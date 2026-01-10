<?php
/**
 * renderKit-Relay Settings
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Admin settings UI for renderKit-Relay
 */
final class RelaySettings {

    private const OPTION_KEY = 'renderkit_relay_settings';
    private const PAGE_SLUG = 'renderkit-relay';
    private const SETTINGS_GROUP = 'renderkit_relay_settings_group';

    /**
     * Initialize admin hooks
     */
    public function init(): void {
        if (!is_admin()) {
            return;
        }

        add_action('admin_menu', [$this, 'register_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_renderkit_relay_generate_secret', [$this, 'handle_generate_secret']);
        add_action('admin_post_renderkit_relay_sync_env', [$this, 'handle_sync_env']);
    }

    /**
     * Register the settings page under Settings
     */
    public function register_settings_page(): void {
        add_options_page(
            __('renderKit-Relay', 'renderkit'),
            __('renderKit-Relay', 'renderkit'),
            'manage_options',
            self::PAGE_SLUG,
            [$this, 'render_settings_page']
        );
    }

    /**
     * Register settings
     */
    public function register_settings(): void {
        register_setting(self::SETTINGS_GROUP, self::OPTION_KEY, [
            'type'              => 'array',
            'sanitize_callback' => [$this, 'sanitize_settings'],
            'default'           => self::default_settings(),
        ]);
    }

    /**
     * @return array{url:string, secret:string, timeout:float, syncEnv:int}
     */
    public static function default_settings(): array {
        return [
            'url'     => 'http://127.0.0.1:8787',
            'secret'  => '',
            'timeout' => 1.5,
            'syncEnv' => 1,
        ];
    }

    /**
     * @return array{url:string, secret:string, timeout:float, syncEnv:int}
     */
    public static function get_stored_settings(): array {
        $stored = get_option(self::OPTION_KEY, []);
        $defaults = self::default_settings();
        if (!is_array($stored)) {
            return $defaults;
        }

        return [
            'url'     => isset($stored['url']) && is_string($stored['url']) ? $stored['url'] : $defaults['url'],
            'secret'  => isset($stored['secret']) && is_string($stored['secret']) ? $stored['secret'] : $defaults['secret'],
            'timeout' => isset($stored['timeout']) ? (float) $stored['timeout'] : $defaults['timeout'],
            'syncEnv' => !empty($stored['syncEnv']) ? 1 : 0,
        ];
    }

    /**
     * @return array{url:string, secret:string, timeout:float, syncEnv:int}
     */
    public static function get_effective_settings(): array {
        $settings = self::get_stored_settings();

        if (defined('RENDERKIT_RELAY_URL')) {
            $settings['url'] = (string) RENDERKIT_RELAY_URL;
        }
        if (defined('RENDERKIT_RELAY_SECRET')) {
            $settings['secret'] = (string) RENDERKIT_RELAY_SECRET;
        }
        if (defined('RENDERKIT_RELAY_TIMEOUT')) {
            $settings['timeout'] = (float) RENDERKIT_RELAY_TIMEOUT;
        }

        $settings['url'] = rtrim($settings['url'], '/');
        return $settings;
    }

    /**
     * Sanitize settings input and optionally sync relay/.env
     *
     * @param mixed $input Raw input from the settings form.
     * @return array{url:string, secret:string, timeout:float, syncEnv:int}
     */
    public function sanitize_settings(mixed $input): array {
        $defaults = self::default_settings();
        $stored = self::get_stored_settings();

        $data = is_array($input) ? $input : [];

        $url = isset($data['url']) ? trim((string) $data['url']) : $stored['url'];
        if ($url === '') {
            $url = $defaults['url'];
        }
        $url = rtrim($url, '/');

        $sanitized_url = esc_url_raw($url);
        $parts = wp_parse_url($sanitized_url);
        $scheme = is_array($parts) && isset($parts['scheme']) ? (string) $parts['scheme'] : '';
        $host = is_array($parts) && isset($parts['host']) ? (string) $parts['host'] : '';

        if ($sanitized_url === '' || $scheme === '' || $host === '' || !in_array(strtolower($scheme), ['http', 'https'], true)) {
            add_settings_error('renderkit_relay', 'invalid_url', __('Relay URL ist ungültig.', 'renderkit'));
            $url = $stored['url'] ?: $defaults['url'];
        } else {
            $url = rtrim($sanitized_url, '/');
        }

        $secret = isset($data['secret']) ? trim((string) $data['secret']) : $stored['secret'];
        $timeout = isset($data['timeout']) ? (float) $data['timeout'] : $stored['timeout'];
        if ($timeout <= 0) {
            $timeout = $defaults['timeout'];
        }
        if ($timeout > 10) {
            $timeout = 10.0;
        }

        $sync_env = !empty($data['syncEnv']) ? 1 : 0;

        $settings = [
            'url'     => $url,
            'secret'  => $secret,
            'timeout' => $timeout,
            'syncEnv' => $sync_env,
        ];

        // If wp-config.php constants are set, settings won't take effect.
        if (defined('RENDERKIT_RELAY_URL') || defined('RENDERKIT_RELAY_SECRET') || defined('RENDERKIT_RELAY_TIMEOUT')) {
            add_settings_error(
                'renderkit_relay',
                'constants_override',
                __('Hinweis: wp-config.php Konstanten überschreiben diese Einstellungen.', 'renderkit'),
                'warning'
            );
            return $settings;
        }

        if ($settings['secret'] === '') {
            add_settings_error(
                'renderkit_relay',
                'missing_secret',
                __('Relay Secret fehlt. renderKit-Relay kann ohne Secret nicht genutzt werden.', 'renderkit'),
                'warning'
            );
        }

        if ($sync_env === 1) {
            $ok = $this->write_env_file($settings['url'], $settings['secret']);
            if (!$ok) {
                add_settings_error(
                    'renderkit_relay',
                    'env_write_failed',
                    __('Konnte relay/.env nicht schreiben. Prüfe Dateirechte auf dem Server.', 'renderkit'),
                    'warning'
                );
            }
        }

        return $settings;
    }

    /**
     * Render settings page
     */
    public function render_settings_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $stored = self::get_stored_settings();
        $effective = self::get_effective_settings();
        $status = $this->check_health($effective['url']);

        $logo_url = RENDERKIT_PLUGIN_URL . 'resources/renderKitRelay.png';
        $is_locked = [
            'url'     => defined('RENDERKIT_RELAY_URL'),
            'secret'  => defined('RENDERKIT_RELAY_SECRET'),
            'timeout' => defined('RENDERKIT_RELAY_TIMEOUT'),
        ];

        $env_path = $this->env_file_path();

        ?>
        <div class="wrap rk-relay">
            <style>
                .rk-relay { max-width: 1120px; }
                .rk-relay * { box-sizing: border-box; }
                .rk-relay__header { display:flex; align-items:center; gap:18px; margin: 18px 0 18px; }
                .rk-relay__logo { width:64px; height:64px; border-radius: 16px; background:#fff; border:1px solid #e5e7eb; padding:10px; }
                .rk-relay__title { margin:0; font-size: 32px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
                .rk-relay__subtitle { margin:6px 0 0; font-size: 15px; color:#4b5563; }
                .rk-relay__grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
                .rk-card { background:#fff; border:1px solid #e5e7eb; border-radius: 18px; padding: 18px; box-shadow: 0 1px 0 rgba(17,24,39,0.03); }
                .rk-card h2 { margin:0 0 12px; font-size: 18px; letter-spacing: -0.01em; }
                .rk-kv { display:grid; grid-template-columns: 170px 1fr; gap: 10px 16px; font-size: 14px; margin-top: 6px; }
                .rk-k { color:#6b7280; }
                .rk-v { color:#111827; word-break: break-word; }
                .rk-pill { display:inline-flex; align-items:center; gap:8px; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; }
                .rk-pill--ok { background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; }
                .rk-pill--bad { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
                .rk-pill__dot { width: 8px; height: 8px; border-radius: 999px; background: currentColor; opacity: 0.9; }
                .rk-form { display:flex; flex-direction: column; gap: 12px; }
                .rk-field label { display:block; font-size: 12px; font-weight: 700; color:#111827; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
                .rk-field input[type="text"],
                .rk-field input[type="password"],
                .rk-field input[type="number"] { width:100%; max-width: 100%; padding: 10px 12px; border-radius: 12px; border:1px solid #e5e7eb; background:#fff; font-size: 14px; }
                .rk-field input[disabled] { background:#f9fafb; color:#6b7280; }
                .rk-help { margin: 6px 0 0; font-size: 13px; color:#6b7280; line-height: 1.45; }
                .rk-row { display:flex; gap: 10px; align-items:center; flex-wrap: wrap; }
                .rk-btn { appearance:none; border:1px solid #e5e7eb; background:#111827; color:#fff; padding: 10px 12px; border-radius: 12px; font-weight: 700; cursor:pointer; }
                .rk-btn:hover { opacity: 0.95; }
                .rk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .rk-btn--ghost { background:#fff; color:#111827; }
                .rk-btn--ghost:hover { background:#f9fafb; }
                .rk-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; padding: 10px 12px; border-radius: 12px; border:1px solid #e5e7eb; background:#f9fafb; overflow:auto; }
                .rk-note { margin-top: 10px; font-size: 13px; color:#6b7280; }
                .rk-split { display:flex; gap: 10px; }
                .rk-split > * { flex: 1; }
                @media (max-width: 960px) { .rk-relay__grid { grid-template-columns: 1fr; } .rk-kv { grid-template-columns: 1fr; } }
            </style>

            <div class="rk-relay__header">
                <img class="rk-relay__logo" src="<?php echo esc_url($logo_url); ?>" alt="renderKit-Relay" />
                <div>
                    <h1 class="rk-relay__title">renderKit-Relay</h1>
                    <p class="rk-relay__subtitle">Server-Side Rendering (SSR) für deine TSX Blocks — SEO/no-JS friendly.</p>
                </div>
            </div>

            <?php settings_errors('renderkit_relay'); ?>

            <div class="rk-relay__grid">
                <div class="rk-card">
                    <h2><?php echo esc_html__('Status', 'renderkit'); ?></h2>
                    <?php if ($status['ok']) : ?>
                        <div class="rk-pill rk-pill--ok"><span class="rk-pill__dot"></span><?php echo esc_html__('Online', 'renderkit'); ?></div>
                    <?php else : ?>
                        <div class="rk-pill rk-pill--bad"><span class="rk-pill__dot"></span><?php echo esc_html__('Offline', 'renderkit'); ?></div>
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
                        <?php echo esc_html__('Hinweis: Der Relay ist standardmäßig an 127.0.0.1 gebunden — es muss kein externer Port geöffnet werden.', 'renderkit'); ?>
                    </p>
                </div>

                <div class="rk-card">
                    <h2><?php echo esc_html__('Einstellungen', 'renderkit'); ?></h2>

                    <form method="post" action="options.php" class="rk-form">
                        <?php settings_fields(self::SETTINGS_GROUP); ?>

                        <div class="rk-field">
                            <label for="rk-relay-url"><?php echo esc_html__('Relay URL', 'renderkit'); ?></label>
                            <input
                                id="rk-relay-url"
                                name="<?php echo esc_attr(self::OPTION_KEY); ?>[url]"
                                type="text"
                                value="<?php echo esc_attr($stored['url']); ?>"
                                placeholder="http://127.0.0.1:8787"
                                <?php disabled($is_locked['url']); ?>
                            />
                            <?php if ($is_locked['url']) : ?>
                                <p class="rk-help"><?php echo esc_html__('Gesperrt durch RENDERKIT_RELAY_URL in wp-config.php', 'renderkit'); ?></p>
                            <?php endif; ?>
                        </div>

                        <div class="rk-field">
                            <label for="rk-relay-secret"><?php echo esc_html__('Relay Secret', 'renderkit'); ?></label>
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
                                <button type="button" class="rk-btn rk-btn--ghost" id="rk-copy-secret" <?php disabled($stored['secret'] === '' || $is_locked['secret']); ?>>
                                    <?php echo esc_html__('Copy', 'renderkit'); ?>
                                </button>
                            </div>
                            <?php if ($is_locked['secret']) : ?>
                                <p class="rk-help"><?php echo esc_html__('Gesperrt durch RENDERKIT_RELAY_SECRET in wp-config.php', 'renderkit'); ?></p>
                            <?php else : ?>
                                <p class="rk-help"><?php echo esc_html__('Muss mit dem Secret im Relay übereinstimmen (HMAC).', 'renderkit'); ?></p>
                            <?php endif; ?>
                        </div>

                        <div class="rk-split">
                            <div class="rk-field">
                                <label for="rk-relay-timeout"><?php echo esc_html__('Timeout (s)', 'renderkit'); ?></label>
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
                                    <p class="rk-help"><?php echo esc_html__('Gesperrt durch RENDERKIT_RELAY_TIMEOUT in wp-config.php', 'renderkit'); ?></p>
                                <?php endif; ?>
                            </div>

                            <div class="rk-field">
                                <label><?php echo esc_html__('Docker Sync', 'renderkit'); ?></label>
                                <label style="display:flex; align-items:center; gap:10px; margin-top: 10px; font-weight:600; text-transform:none; letter-spacing:0;">
                                    <input
                                        type="checkbox"
                                        name="<?php echo esc_attr(self::OPTION_KEY); ?>[syncEnv]"
                                        value="1"
                                        <?php checked($stored['syncEnv'], 1); ?>
                                        <?php disabled($is_locked['url'] || $is_locked['secret']); ?>
                                    />
                                    <span><?php echo esc_html__('relay/.env automatisch aktualisieren', 'renderkit'); ?></span>
                                </label>
                                <p class="rk-help"><?php echo esc_html__('Schreibt Port+Secret in relay/.env für docker compose.', 'renderkit'); ?></p>
                            </div>
                        </div>

                        <div class="rk-row">
                            <button type="submit" class="rk-btn"><?php echo esc_html__('Save Settings', 'renderkit'); ?></button>
                        </div>
                    </form>

                    <hr style="border:0; border-top:1px solid #e5e7eb; margin: 16px 0;">

                    <div class="rk-row">
                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <?php wp_nonce_field('renderkit_relay_generate_secret'); ?>
                            <input type="hidden" name="action" value="renderkit_relay_generate_secret">
                            <button type="submit" class="rk-btn rk-btn--ghost" <?php disabled($is_locked['secret']); ?>>
                                <?php echo esc_html__('Generate New Secret', 'renderkit'); ?>
                            </button>
                        </form>

                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <?php wp_nonce_field('renderkit_relay_sync_env'); ?>
                            <input type="hidden" name="action" value="renderkit_relay_sync_env">
                            <button type="submit" class="rk-btn rk-btn--ghost" <?php disabled($effective['secret'] === ''); ?>>
                                <?php echo esc_html__('Sync relay/.env now', 'renderkit'); ?>
                            </button>
                        </form>
                    </div>

                    <p class="rk-help">
                        <?php
                        echo esc_html__('Pfad:', 'renderkit') . ' ';
                        echo esc_html(str_replace(ABSPATH, '/', $env_path));
                        ?>
                    </p>
                </div>

                <div class="rk-card">
                    <h2><?php echo esc_html__('Server Commands', 'renderkit'); ?></h2>
                    <p class="rk-help"><?php echo esc_html__('Wenn Docker läuft, starte den Relay so:', 'renderkit'); ?></p>
                    <div class="rk-code">make -C <?php echo esc_html(basename(RENDERKIT_PLUGIN_DIR)); ?> relay-up</div>
                    <p class="rk-help"><?php echo esc_html__('Health check:', 'renderkit'); ?></p>
                    <div class="rk-code">make -C <?php echo esc_html(basename(RENDERKIT_PLUGIN_DIR)); ?> relay-health</div>
                    <p class="rk-help"><?php echo esc_html__('Logs:', 'renderkit'); ?></p>
                    <div class="rk-code">make -C <?php echo esc_html(basename(RENDERKIT_PLUGIN_DIR)); ?> relay-logs</div>
                </div>

                <div class="rk-card">
                    <h2><?php echo esc_html__('wp-config.php (optional)', 'renderkit'); ?></h2>
                    <p class="rk-help"><?php echo esc_html__('Wenn du lieber Konstanten nutzt (überschreibt UI):', 'renderkit'); ?></p>
                    <div class="rk-code"><?php echo esc_html("define('RENDERKIT_RELAY_URL', '" . $effective['url'] . "');\n" . "define('RENDERKIT_RELAY_SECRET', '" . ($effective['secret'] ?: 'CHANGE_ME') . "');\n" . "define('RENDERKIT_RELAY_TIMEOUT', " . (string) $effective['timeout'] . ');'); ?></div>
                </div>
            </div>

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

    /**
     * Generate a new secret and store it
     */
    public function handle_generate_secret(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Forbidden');
        }

        check_admin_referer('renderkit_relay_generate_secret');

        if (defined('RENDERKIT_RELAY_SECRET')) {
            wp_safe_redirect(admin_url('options-general.php?page=' . self::PAGE_SLUG));
            exit;
        }

        $settings = self::get_stored_settings();
        $settings['secret'] = wp_generate_password(64, false, false);

        update_option(self::OPTION_KEY, $settings);

        if (!empty($settings['syncEnv'])) {
            $this->write_env_file($settings['url'], $settings['secret']);
        }

        wp_safe_redirect(admin_url('options-general.php?page=' . self::PAGE_SLUG . '&rk=secret'));
        exit;
    }

    /**
     * Force sync relay/.env from the effective settings
     */
    public function handle_sync_env(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Forbidden');
        }

        check_admin_referer('renderkit_relay_sync_env');

        $effective = self::get_effective_settings();
        $ok = $this->write_env_file($effective['url'], $effective['secret']);

        $query = $ok ? 'rk=env' : 'rk=env_fail';
        wp_safe_redirect(admin_url('options-general.php?page=' . self::PAGE_SLUG . '&' . $query));
        exit;
    }

    /**
     * @return array{ok:bool, message:string, version:string}
     */
    private function check_health(string $relay_url): array {
        $relay_url = rtrim($relay_url, '/');
        if ($relay_url === '') {
            return ['ok' => false, 'message' => 'missing_url', 'version' => ''];
        }

        $health_url = $relay_url . '/health';
        $response = wp_remote_get($health_url, [
            'timeout' => 0.6,
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            return ['ok' => false, 'message' => $response->get_error_message(), 'version' => ''];
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $body = (string) wp_remote_retrieve_body($response);

        $json = json_decode($body, true);
        $version = is_array($json) && isset($json['version']) && is_string($json['version']) ? $json['version'] : '';

        if ($status === 200 && is_array($json) && !empty($json['ok'])) {
            return ['ok' => true, 'message' => 'ok', 'version' => $version];
        }

        $error = is_array($json) && isset($json['error']) && is_string($json['error']) ? $json['error'] : ('http_' . $status);
        return ['ok' => false, 'message' => $error, 'version' => $version];
    }

    private function env_file_path(): string {
        return RENDERKIT_PLUGIN_DIR . 'relay/.env';
    }

    private function derive_port_from_url(string $url): int {
        $parts = wp_parse_url($url);
        if (!is_array($parts)) {
            return 8787;
        }
        if (!empty($parts['port'])) {
            return (int) $parts['port'];
        }
        return 8787;
    }

    private function write_env_file(string $url, string $secret): bool {
        $secret = trim($secret);
        if ($secret === '') {
            return false;
        }

        $port = $this->derive_port_from_url($url);
        if ($port < 1 || $port > 65535) {
            $port = 8787;
        }

        $env = "RENDERKIT_RELAY_PORT={$port}\nRENDERKIT_RELAY_SECRET={$secret}\n";
        $path = $this->env_file_path();

        $dir = dirname($path);
        if (!is_dir($dir)) {
            return false;
        }

        $bytes = @file_put_contents($path, $env, LOCK_EX);
        if (!is_int($bytes) || $bytes <= 0) {
            return false;
        }

        @chmod($path, 0600);
        return true;
    }
}
