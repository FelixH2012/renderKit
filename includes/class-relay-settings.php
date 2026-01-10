<?php
/**
 * Relay Settings UI
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Admin UI for renderKit-Relay configuration
 */
class RelaySettings {

    /**
     * Option key for stored settings
     */
    public const OPTION_KEY = 'renderkit_relay';

    /**
     * Settings group for registration
     */
    public const SETTINGS_GROUP = 'renderkit_relay_group';

    /**
     * Initialize hooks
     */
    public function init(): void {
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_post_renderkit_relay_generate_secret', [$this, 'handle_generate_secret']);
        add_action('admin_post_renderkit_relay_sync_env', [$this, 'handle_sync_env']);
    }

    /**
     * Register plugin settings
     */
    public function register_settings(): void {
        register_setting(self::SETTINGS_GROUP, self::OPTION_KEY, [
            'type'              => 'array',
            'sanitize_callback' => [$this, 'sanitize_settings'],
            'default'           => self::get_stored_settings(),
        ]);

        // Relay Settings Section
        add_settings_section('renderkit_relay_section', 'Relay Configuration', '__return_empty_string', 'renderkit-relay');
        add_settings_field('renderkit_relay_url', 'Relay URL', [self::class, 'render_url_field'], 'renderkit-relay', 'renderkit_relay_section');
        add_settings_field('renderkit_relay_secret', 'Relay Secret', [self::class, 'render_secret_field'], 'renderkit-relay', 'renderkit_relay_section');
        add_settings_field('renderkit_relay_timeout', 'Relay Timeout (s)', [self::class, 'render_timeout_field'], 'renderkit-relay', 'renderkit_relay_section');
        add_settings_field('renderkit_relay_sync_env', 'Sync to .env', [self::class, 'render_sync_env_field'], 'renderkit-relay', 'renderkit_relay_section');

        // Gemini AI Settings
        add_settings_section('renderkit_ai_section', 'AI Configuration (Gemini)', '__return_empty_string', 'renderkit-relay');
        add_settings_field('renderkit_gemini_api_key', 'Gemini API Key', [self::class, 'render_gemini_key_field'], 'renderkit-relay', 'renderkit_ai_section');
    }

    /**
     * Add settings page to the menu
     */
    public function add_settings_page(): void {
        add_options_page(
            __('renderKit-Relay', 'renderkit'),
            __('renderKit-Relay', 'renderkit'),
            'manage_options',
            'renderkit-relay',
            [$this, 'render_settings_page']
        );
    }

    /**
     * Sanitize settings on save
     */
    public function sanitize_settings(array $input): array {
        $sanitized = self::get_stored_settings();

        if (isset($input['url'])) {
            $sanitized['url'] = esc_url_raw($input['url']);
        }

        if (isset($input['secret'])) {
            $sanitized['secret'] = sanitize_text_field($input['secret']);
        }

        if (isset($input['timeout'])) {
            $sanitized['timeout'] = (float) $input['timeout'];
        }

        if (isset($input['syncEnv'])) {
            $sanitized['syncEnv'] = (int) $input['syncEnv'];
        }

        if (isset($input['gemini_api_key'])) {
            $sanitized['gemini_api_key'] = sanitize_text_field($input['gemini_api_key']);
        }

        return $sanitized;
    }

    /**
     * Get settings from database with defaults
     */
    public static function get_stored_settings(): array {
        $defaults = [
            'url'            => 'http://127.0.0.1:8787',
            'secret'         => '',
            'timeout'        => 1.5,
            'syncEnv'        => 0,
            'gemini_api_key' => '',
        ];

        $stored = get_option(self::OPTION_KEY);
        if (!is_array($stored)) {
            return $defaults;
        }

        return array_merge($defaults, $stored);
    }

    /**
     * Get effective settings (stored + constants)
     */
    public static function get_effective_settings(): array {
        $stored = self::get_stored_settings();

        return [
            'url'     => defined('RENDERKIT_RELAY_URL') ? (string) RENDERKIT_RELAY_URL : $stored['url'],
            'secret'  => defined('RENDERKIT_RELAY_SECRET') ? (string) RENDERKIT_RELAY_SECRET : $stored['secret'],
            'timeout' => defined('RENDERKIT_RELAY_TIMEOUT') ? (float) RENDERKIT_RELAY_TIMEOUT : $stored['timeout'],
            'syncEnv' => $stored['syncEnv'],
        ];
    }

    /**
     * Check Relay health
     */
    private function check_health(string $url): array {
        $health_url = rtrim($url, '/') . '/health';
        $response = wp_remote_get($health_url, [
            'timeout' => 2,
        ]);

        if (is_wp_error($response)) {
            return [
                'ok'      => false,
                'message' => $response->get_error_message(),
                'version' => '',
            ];
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        $body = (string) wp_remote_retrieve_body($response);
        $json = json_decode($body, true);

        if ($code !== 200 || !is_array($json) || empty($json['ok'])) {
            return [
                'ok'      => false,
                'message' => __('Service unreachable or unhealthy.', 'renderkit'),
                'version' => '',
            ];
        }

        return [
            'ok'      => true,
            'message' => __('Healthy', 'renderkit'),
            'version' => (string) ($json['version'] ?? 'unkown'),
        ];
    }

    /**
     * Path to Relay .env file
     */
    private function env_file_path(): string {
        return RENDERKIT_PLUGIN_DIR . 'relay/.env';
    }

    /**
     * Generate new HMAC secret
     */
    public function handle_generate_secret(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        check_admin_referer('renderkit_relay_generate_secret');

        $secret = bin2hex(random_bytes(32));
        $stored = self::get_stored_settings();
        $stored['secret'] = $secret;

        update_option(self::OPTION_KEY, $stored);

        // Auto-sync if enabled
        if ($stored['syncEnv']) {
            $this->sync_to_env($stored['url'], $secret);
        }

        wp_safe_redirect(wp_get_referer());
        exit;
    }

    /**
     * Sync configuration to .env file
     */
    public function handle_sync_env(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        check_admin_referer('renderkit_relay_sync_env');

        $effective = self::get_effective_settings();
        $this->sync_to_env($effective['url'], $effective['secret']);

        wp_safe_redirect(wp_get_referer());
        exit;
    }

    /**
     * Write config to file
     */
    private function sync_to_env(string $url, string $secret): bool {
        $path = $this->env_file_path();
        $content = sprintf(
            "# Auto-generated by RenderKit Plugin\n" .
            "RENDERKIT_RELAY_URL=%s\n" .
            "RENDERKIT_RELAY_SECRET=%s\n",
            $url,
            $secret
        );

        return (bool) file_put_contents($path, $content);
    }

    /**
     * Render Gemini API Key field
     */
    public static function render_gemini_key_field(): void {
        $options = get_option(self::OPTION_KEY);
        $key = $options['gemini_api_key'] ?? '';
        ?>
        <input type="password" name="<?php echo esc_attr(self::OPTION_KEY); ?>[gemini_api_key]" value="<?php echo esc_attr($key); ?>" class="regular-text" placeholder="AIza...">
        <p class="description">
            <?php esc_html_e('Required for AI-powered product generation (Google Gemini API).', 'renderkit'); ?>
        </p>
        <?php
    }

    public function render_settings_page(): void {
    if (!current_user_can('manage_options')) {
        return;
    }

    $stored    = self::get_stored_settings();
    $effective = self::get_effective_settings();
    $status    = $this->check_health($effective['url']);

    $logo_url = RENDERKIT_PLUGIN_URL . 'resources/renderKitRelay.png';
    $is_locked = [
        'url'     => defined('RENDERKIT_RELAY_URL'),
        'secret'  => defined('RENDERKIT_RELAY_SECRET'),
        'timeout' => defined('RENDERKIT_RELAY_TIMEOUT'),
    ];

    $env_path = $this->env_file_path();

    ?>
    <div class="wrap rk-relay rk-relay--shell">
        <style>
            .rk-relay--shell {
                padding-top: 32px;
                padding-bottom: 40px;
            }

            .rk-relay {
                max-width: 1120px;
                margin: 0 auto;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
                color: #0f172a;
            }

            .rk-relay * {
                box-sizing: border-box;
            }

            /* HEADER – BOLD, AIRBNB-ISH */
            .rk-relay__header {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                column-gap: 32px;
                row-gap: 16px;
                align-items: center;
                margin-bottom: 32px;
            }

            .rk-relay__logo-wrap {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .rk-relay__logo {
                width: 92px;
                height: 92px;
                border-radius: 28px;
                object-fit: contain;
                /* subtiler, aber sichtbarer „product“ look ohne Box */
                filter: drop-shadow(0 18px 45px rgba(15, 23, 42, 0.20));
            }

            .rk-relay__heading {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .rk-relay__eyebrow {
                font-size: 11px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #9ca3af;
                font-weight: 600;
            }

            .rk-relay__title {
                margin: 0;
                font-size: clamp(32px, 4vw, 44px);
                line-height: 0.9;
                font-weight: 800;
                letter-spacing: -0.05em;
            }

            .rk-relay__subtitle {
                margin: 0;
                max-width: 520px;
                font-size: 14px;
                line-height: 1.6;
                color: #4b5563;
            }

            .rk-relay__meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
                font-size: 12px;
                color: #6b7280;
            }

            .rk-relay__meta-pill {
                padding: 4px 9px;
                border-radius: 999px;
                background: #f3f4f6;
            }

            /* LAYOUT GRID */
            .rk-relay__grid {
                display: grid;
                grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
                gap: 24px;
                align-items: flex-start;
            }

            .rk-relay__stack {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* CARDS – MINIMAL, SOFT RADIUS */
            .rk-card {
                position: relative;
                background: #ffffff;
                border-radius: 20px;
                padding: 18px 18px 16px;
                border: 1px solid rgba(148, 163, 184, 0.28);
                box-shadow:
                    0 18px 40px rgba(15, 23, 42, 0.04),
                    0 1px 0 rgba(15, 23, 42, 0.02);
            }

            .rk-card__header {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 10px;
            }

            .rk-card__title {
                margin: 0;
                font-size: 15px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #111827;
            }

            .rk-card__hint {
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
                text-align: right;
            }

            /* STATUS PILL */
            .rk-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                border-radius: 999px;
                padding: 5px 10px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.14em;
                text-transform: uppercase;
            }

            .rk-pill__dot {
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: currentColor;
                opacity: 0.92;
            }

            .rk-pill--ok {
                background: #ecfdf3;
                color: #16a34a;
                border: 1px solid #bbf7d0;
            }

            .rk-pill--bad {
                background: #fef2f2;
                color: #b91c1c;
                border: 1px solid #fecaca;
            }

            /* KEY VALUE BLOCK */
            .rk-kv {
                display: grid;
                grid-template-columns: 140px minmax(0, 1fr);
                gap: 10px 18px;
                font-size: 13px;
                margin-top: 14px;
            }

            .rk-k {
                color: #6b7280;
                font-weight: 500;
            }

            .rk-v {
                color: #0f172a;
                word-break: break-word;
            }

            .rk-note {
                margin-top: 12px;
                font-size: 12px;
                color: #6b7280;
                line-height: 1.5;
            }

            /* FORM */
            .rk-form {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .rk-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .rk-field__label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .rk-field label {
                font-size: 11px;
                font-weight: 700;
                color: #111827;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 0.12em;
            }

            .rk-field__meta {
                font-size: 11px;
                color: #9ca3af;
            }

            .rk-field input[type="text"],
            .rk-field input[type="password"],
            .rk-field input[type="number"] {
                width: 100%;
                max-width: 100%;
                padding: 9px 11px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                background: #ffffff;
                font-size: 13px;
                line-height: 1.4;
                transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
            }

            .rk-field input[type="text"]:focus,
            .rk-field input[type="password"]:focus,
            .rk-field input[type="number"]:focus {
                outline: none;
                border-color: #111827;
                box-shadow: 0 0 0 1px #1118271a;
                background: #f9fafb;
            }

            .rk-field input[disabled] {
                background: #f9fafb;
                color: #6b7280;
                border-style: dashed;
            }

            .rk-help {
                margin: 0;
                font-size: 12px;
                color: #6b7280;
                line-height: 1.5;
            }

            .rk-row {
                display: flex;
                gap: 8px;
                align-items: center;
                flex-wrap: wrap;
            }

            .rk-split {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
                gap: 12px;
            }

            /* BUTTONS – QUIET, PRODUCT-LIKE */
            .rk-btn {
                appearance: none;
                border-radius: 999px;
                border: 1px solid #0f172a;
                background: #0f172a;
                color: #f9fafb;
                padding: 9px 14px;
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease, transform 80ms ease;
            }

            .rk-btn:hover {
                background: #020617;
                border-color: #020617;
                transform: translateY(-0.5px);
            }

            .rk-btn:active {
                transform: translateY(0);
            }

            .rk-btn:disabled {
                opacity: 0.45;
                cursor: not-allowed;
                transform: none;
            }

            .rk-btn--ghost {
                background: #ffffff;
                color: #0f172a;
                border-color: #e5e7eb;
            }

            .rk-btn--ghost:hover {
                background: #f9fafb;
                border-color: #d1d5db;
            }

            .rk-btn--subtle {
                background: #f9fafb;
                border-color: #e5e7eb;
                color: #4b5563;
            }

            /* CODE BLOCKS */
            .rk-code {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                font-size: 12px;
                padding: 9px 11px;
                border-radius: 14px;
                border: 1px solid #e5e7eb;
                background: #f9fafb;
                overflow: auto;
                line-height: 1.4;
                color: #111827;
            }

            .rk-section-divider {
                border: 0;
                border-top: 1px solid #e5e7eb;
                margin: 16px 0;
            }

            /* RESPONSIVE */
            @media (max-width: 960px) {
                .rk-relay__grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 720px) {
                .rk-relay--shell {
                    padding-top: 20px;
                }

                .rk-relay__header {
                    grid-template-columns: 1fr;
                    row-gap: 20px;
                }

                .rk-relay__logo-wrap {
                    justify-content: flex-start;
                }

                .rk-relay__title {
                    font-size: 30px;
                }

                .rk-kv {
                    grid-template-columns: 1fr;
                }

                .rk-split {
                    grid-template-columns: 1fr;
                }
            }
        </style>

        <header class="rk-relay__header">
            <div class="rk-relay__logo-wrap">
                <img class="rk-relay__logo" src="<?php echo esc_url($logo_url); ?>" alt="renderKit-Relay" />
            </div>
            <div class="rk-relay__heading">
                <span class="rk-relay__eyebrow">Render-first infra</span>
                <h1 class="rk-relay__title">renderKit&nbsp;Relay</h1>
                <p class="rk-relay__subtitle">
                    Server-side rendering for your TSX blocks – fast, crawlable and no-JS friendly, tuned for modern WordPress stacks.
                </p>
                <div class="rk-relay__meta">
                    <span class="rk-relay__meta-pill">Local-only by default</span>
                    <span class="rk-relay__meta-pill">Docker aware</span>
                    <span class="rk-relay__meta-pill">HMAC secured</span>
                </div>
            </div>
        </header>

        <?php settings_errors('renderkit_relay'); ?>

        <main class="rk-relay__grid">
            <section class="rk-relay__stack">
                <article class="rk-card">
                    <header class="rk-card__header">
                        <h2 class="rk-card__title"><?php echo esc_html__('Status', 'renderkit'); ?></h2>
                        <p class="rk-card__hint">
                            <?php echo esc_html__('Health snapshot of your Relay process.', 'renderkit'); ?>
                        </p>
                    </header>

                    <?php if ($status['ok']) : ?>
                        <span class="rk-pill rk-pill--ok">
                            <span class="rk-pill__dot"></span>
                            <?php echo esc_html__('Online', 'renderkit'); ?>
                        </span>
                    <?php else : ?>
                        <span class="rk-pill rk-pill--bad">
                            <span class="rk-pill__dot"></span>
                            <?php echo esc_html__('Offline', 'renderkit'); ?>
                        </span>
                    <?php endif; ?>

                    <div class="rk-kv">
                        <div class="rk-k"><?php echo esc_html__('Relay URL', 'renderkit'); ?></div>
                        <div class="rk-v"><?php echo esc_html($effective['url']); ?></div>

                        <div class="rk-k"><?php echo esc_html__('Health', 'renderkit'); ?></div>
                        <div class="rk-v"><?php echo esc_html($status['message']); ?></div>

                        <div class="rk-k"><?php echo esc_html__('Version', 'renderkit'); ?></div>
                        <div class="rk-v"><?php echo esc_html($status['version'] ?: '—'); ?></div>
                    </div>

                    <p class="rk-note">
                        <?php echo esc_html__('Der Relay ist standardmäßig an 127.0.0.1 gebunden – kein öffentlicher Port notwendig.', 'renderkit'); ?>
                    </p>
                </article>

                <article class="rk-card">
                    <header class="rk-card__header">
                        <h2 class="rk-card__title"><?php echo esc_html__('Einstellungen', 'renderkit'); ?></h2>
                        <p class="rk-card__hint">
                            <?php echo esc_html__('URL, Secret & Timeout für deine SSR-Pipeline.', 'renderkit'); ?>
                        </p>
                    </header>

                    <form method="post" action="options.php" class="rk-form">
                        <?php settings_fields(self::SETTINGS_GROUP); ?>

                        <div class="rk-field">
                            <div class="rk-field__label">
                                <label for="rk-relay-url"><?php echo esc_html__('Relay URL', 'renderkit'); ?></label>
                                <span class="rk-field__meta"><?php echo esc_html__('Local-first endpoint', 'renderkit'); ?></span>
                            </div>
                            <input
                                id="rk-relay-url"
                                name="<?php echo esc_attr(self::OPTION_KEY); ?>[url]"
                                type="text"
                                value="<?php echo esc_attr($stored['url']); ?>"
                                placeholder="http://127.0.0.1:8787"
                                <?php disabled($is_locked['url']); ?>
                            />
                            <?php if ($is_locked['url']) : ?>
                                <p class="rk-help">
                                    <?php echo esc_html__('Gesperrt durch RENDERKIT_RELAY_URL in wp-config.php', 'renderkit'); ?>
                                </p>
                            <?php endif; ?>
                        </div>

                        <div class="rk-field">
                            <div class="rk-field__label">
                                <label for="rk-relay-secret"><?php echo esc_html__('Relay Secret', 'renderkit'); ?></label>
                                <span class="rk-field__meta"><?php echo esc_html__('HMAC key', 'renderkit'); ?></span>
                            </div>
                            <div class="rk-row">
                                <input
                                    id="rk-relay-secret"
                                    name="<?php echo esc_attr(self::OPTION_KEY); ?>[secret]"
                                    type="password"
                                    value="<?php echo esc_attr($stored['secret']); ?>"
                                    autocomplete="new-password"
                                    <?php disabled($is_locked['secret']); ?>
                                />
                                <button type="button" class="rk-btn rk-btn--ghost" id="rk-toggle-secret" <?php disabled($is_locked['secret']); ?>>
                                    <?php echo esc_html__('Show', 'renderkit'); ?>
                                </button>
                                <button type="button" class="rk-btn rk-btn--ghost rk-btn--subtle" id="rk-copy-secret" <?php disabled($stored['secret'] === '' || $is_locked['secret']); ?>>
                                    <?php echo esc_html__('Copy', 'renderkit'); ?>
                                </button>
                            </div>
                            <?php if ($is_locked['secret']) : ?>
                                <p class="rk-help">
                                    <?php echo esc_html__('Gesperrt durch RENDERKIT_RELAY_SECRET in wp-config.php', 'renderkit'); ?>
                                </p>
                            <?php else : ?>
                                <p class="rk-help">
                                    <?php echo esc_html__('Muss mit dem Secret im Relay übereinstimmen (HMAC).', 'renderkit'); ?>
                                </p>
                            <?php endif; ?>
                        </div>

                        <div class="rk-split">
                            <div class="rk-field">
                                <div class="rk-field__label">
                                    <label for="rk-relay-timeout"><?php echo esc_html__('Timeout (s)', 'renderkit'); ?></label>
                                    <span class="rk-field__meta"><?php echo esc_html__('Network budget', 'renderkit'); ?></span>
                                </div>
                                <input
                                    id="rk-relay-timeout"
                                    name="<?php echo esc_attr(self::OPTION_KEY); ?>[timeout]"
                                    type="number"
                                    min="0.1"
                                    max="10"
                                    step="0.1"
                                    value="<?php echo esc_attr((string) $stored['timeout']); ?>"
                                    <?php disabled($is_locked['timeout']); ?>
                                />
                                <?php if ($is_locked['timeout']) : ?>
                                    <p class="rk-help">
                                        <?php echo esc_html__('Gesperrt durch RENDERKIT_RELAY_TIMEOUT in wp-config.php', 'renderkit'); ?>
                                    </p>
                                <?php endif; ?>
                            </div>

                            <div class="rk-field">
                                <div class="rk-field__label">
                                    <label><?php echo esc_html__('Docker Sync', 'renderkit'); ?></label>
                                </div>
                                <label style="display:flex; align-items:center; gap:10px; margin-top: 4px; font-weight:500; text-transform:none; letter-spacing:0;">
                                    <input
                                        type="checkbox"
                                        name="<?php echo esc_attr(self::OPTION_KEY); ?>[syncEnv]"
                                        value="1"
                                        <?php checked($stored['syncEnv'], 1); ?>
                                        <?php disabled($is_locked['url'] || $is_locked['secret']); ?>
                                    />
                                    <span><?php echo esc_html__('relay/.env automatisch aktualisieren', 'renderkit'); ?></span>
                                </label>
                                <p class="rk-help">
                                    <?php echo esc_html__('Schreibt Port + Secret in relay/.env für docker compose.', 'renderkit'); ?>
                                </p>
                            </div>
                        </div>

                        <div class="rk-field" style="margin-top: 20px;">
                            <div class="rk-field__label">
                                <label for="rk-gemini-key"><?php echo esc_html__('Gemini AI Key', 'renderkit'); ?></label>
                                <span class="rk-field__meta"><?php echo esc_html__('Optional', 'renderkit'); ?></span>
                            </div>
                            <?php self::render_gemini_key_field(); ?>
                        </div>

                        <div class="rk-row" style="margin-top: 8px;">
                            <button type="submit" class="rk-btn">
                                <?php echo esc_html__('Save Settings', 'renderkit'); ?>
                            </button>
                        </div>
                    </form>
                </article>
            </section>

            <section class="rk-relay__stack">
                <article class="rk-card">
                    <header class="rk-card__header">
                        <h2 class="rk-card__title"><?php echo esc_html__('Server Commands', 'renderkit'); ?></h2>
                        <p class="rk-card__hint">
                            <?php echo esc_html__('Für lokale Docker-basierte Setups.', 'renderkit'); ?>
                        </p>
                    </header>

                    <p class="rk-help"><?php echo esc_html__('Relay starten:', 'renderkit'); ?></p>
                    <div class="rk-code">make -C <?php echo esc_html(basename(RENDERKIT_PLUGIN_DIR)); ?> relay-up</div>

                    <p class="rk-help" style="margin-top: 10px;"><?php echo esc_html__('Health check:', 'renderkit'); ?></p>
                    <div class="rk-code">make -C <?php echo esc_html(basename(RENDERKIT_PLUGIN_DIR)); ?> relay-health</div>

                    <p class="rk-help" style="margin-top: 10px;"><?php echo esc_html__('Logs:', 'renderkit'); ?></p>
                    <div class="rk-code">make -C <?php echo esc_html(basename(RENDERKIT_PLUGIN_DIR)); ?> relay-logs</div>
                </article>

                <article class="rk-card">
                    <header class="rk-card__header">
                        <h2 class="rk-card__title"><?php echo esc_html__('wp-config.php (optional)', 'renderkit'); ?></h2>
                        <p class="rk-card__hint">
                            <?php echo esc_html__('Nutze Konstanten, wenn du die UI nur als Read-only Dashboard willst.', 'renderkit'); ?>
                        </p>
                    </header>

                    <p class="rk-help">
                        <?php echo esc_html__('Konfiguration über Konstanten überschreibt alle UI-Settings:', 'renderkit'); ?>
                    </p>
                    <div class="rk-code">
                        <?php
                        echo esc_html(
                            "define('RENDERKIT_RELAY_URL', '" . $effective['url'] . "');\n" .
                            "define('RENDERKIT_RELAY_SECRET', '" . ($effective['secret'] ?: 'CHANGE_ME') . "');\n" .
                            "define('RENDERKIT_RELAY_TIMEOUT', " . (string) $effective['timeout'] . ');'
                        );
                        ?>
                    </div>

                    <hr class="rk-section-divider" />

                    <div class="rk-row">
                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <?php wp_nonce_field('renderkit_relay_generate_secret'); ?>
                            <input type="hidden" name="action" value="renderkit_relay_generate_secret">
                            <button type="submit" class="rk-btn rk-btn--ghost">
                                <?php echo esc_html__('Generate New Secret', 'renderkit'); ?>
                            </button>
                        </form>

                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <?php wp_nonce_field('renderkit_relay_sync_env'); ?>
                            <input type="hidden" name="action" value="renderkit_relay_sync_env">
                            <button type="submit" class="rk-btn rk-btn--ghost rk-btn--subtle" <?php disabled($effective['secret'] === ''); ?>>
                                <?php echo esc_html__('Sync relay/.env now', 'renderkit'); ?>
                            </button>
                        </form>
                    </div>

                    <p class="rk-help" style="margin-top: 8px;">
                        <?php
                        echo esc_html__('Pfad:', 'renderkit') . ' ' . esc_html(str_replace(ABSPATH, '/', $env_path));
                        ?>
                    </p>
                </article>
            </section>
        </main>

        <script>
            (function() {
                var input = document.getElementById('rk-relay-secret');
                var toggle = document.getElementById('rk-toggle-secret');
                var copy = document.getElementById('rk-copy-secret');

                if (toggle && input) {
                    toggle.addEventListener('click', function() {
                        var isPassword = input.getAttribute('type') === 'password';
                        input.setAttribute('type', isPassword ? 'text' : 'password');
                        toggle.textContent = isPassword ? 'Hide' : 'Show';
                    });
                }

                if (copy && input && navigator && navigator.clipboard) {
                    copy.addEventListener('click', function() {
                        navigator.clipboard.writeText(input.value || '').then(function() {
                            copy.textContent = 'Copied';
                            setTimeout(function() { copy.textContent = 'Copy'; }, 900);
                        });
                    });
                }
            })();
        </script>
    </div>
    <?php
}
}
