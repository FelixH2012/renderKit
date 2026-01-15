<?php
/**
 * Maintenance Mode
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Simple maintenance mode with access key.
 */
class MaintenanceMode {
    private const COOKIE_NAME = 'rk_maint_access';
    private const ACCESS_QUERY = 'rk_access';
    private const ACCESS_FIELD = 'rk_access_key';

    /**
     * Register hooks.
     */
    public function init(): void {
        add_action('template_redirect', [$this, 'maybe_block_request'], 0);
    }

    /**
     * Gate frontend traffic when maintenance mode is enabled.
     */
    public function maybe_block_request(): void {
        if (!$this->is_enabled()) {
            return;
        }

        if ($this->has_bypass()) {
            return;
        }

        if ($this->handle_access_grant()) {
            return;
        }

        $this->render_maintenance_page();
    }

    /**
     * @return bool
     */
    private function is_enabled(): bool {
        return defined('RENDERKIT_MAINTENANCE_MODE') && (bool) RENDERKIT_MAINTENANCE_MODE;
    }

    /**
     * @return bool
     */
    private function has_bypass(): bool {
        if (is_admin()) {
            return true;
        }

        if (defined('DOING_CRON') && DOING_CRON) {
            return true;
        }

        if (defined('DOING_AJAX') && DOING_AJAX) {
            return true;
        }

        if (defined('REST_REQUEST') && REST_REQUEST) {
            return true;
        }

        if (is_user_logged_in() && current_user_can('manage_options')) {
            return true;
        }

        $cookie = $_COOKIE[self::COOKIE_NAME] ?? '';
        if (!is_string($cookie) || $cookie === '') {
            return false;
        }

        return hash_equals($this->get_key_hash(), $cookie);
    }

    /**
     * @return bool True if access was granted and a redirect was sent.
     */
    private function handle_access_grant(): bool {
        $key = $this->get_access_key();
        if ($key === '') {
            return false;
        }

        $provided = '';
        if (isset($_GET[self::ACCESS_QUERY])) {
            $provided = sanitize_text_field(wp_unslash($_GET[self::ACCESS_QUERY]));
        } elseif (isset($_POST[self::ACCESS_FIELD])) {
            $provided = sanitize_text_field(wp_unslash($_POST[self::ACCESS_FIELD]));
        }

        if ($provided === '' || !hash_equals($key, $provided)) {
            return false;
        }

        $this->set_access_cookie();

        $redirect = home_url('/');
        if (isset($_POST['rk_redirect'])) {
            $candidate = esc_url_raw(wp_unslash($_POST['rk_redirect']));
            if (is_string($candidate) && $candidate !== '') {
                $redirect = $candidate;
            }
        } elseif (isset($_GET[self::ACCESS_QUERY])) {
            $redirect = remove_query_arg(self::ACCESS_QUERY);
        }

        wp_safe_redirect($redirect);
        exit;
    }

    /**
     * @return string
     */
    private function get_access_key(): string {
        if (defined('RENDERKIT_MAINTENANCE_KEY')) {
            return (string) RENDERKIT_MAINTENANCE_KEY;
        }

        $host = (string) wp_parse_url(home_url('/'), PHP_URL_HOST);
        $salt = defined('AUTH_KEY') ? (string) AUTH_KEY : wp_salt('auth');
        if ($host === '' || $salt === '') {
            return '';
        }

        return substr(hash_hmac('sha256', $host, $salt), 0, 12);
    }

    /**
     * @return string
     */
    private function get_key_hash(): string {
        $key = $this->get_access_key();
        if ($key === '') {
            return '';
        }

        return hash_hmac('sha256', $key, wp_salt('auth'));
    }

    /**
     * @return void
     */
    private function set_access_cookie(): void {
        $hash = $this->get_key_hash();
        if ($hash === '') {
            return;
        }

        setcookie(self::COOKIE_NAME, $hash, [
            'expires'  => time() + 12 * 60 * 60,
            'path'     => '/',
            'secure'   => is_ssl(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        $_COOKIE[self::COOKIE_NAME] = $hash;
    }

    /**
     * Render maintenance page and exit.
     */
    private function render_maintenance_page(): void {
        status_header(503);
        nocache_headers();

        $action = esc_url(home_url(add_query_arg([])));
        $redirect = esc_url($action);

        echo '<!doctype html>';
        echo '<html lang="de">';
        echo '<head>';
        echo '<meta charset="utf-8">';
        echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
        echo '<title>Wartungsmodus</title>';
        echo '<style>';
        echo ':root{--rk-cream:#FFFEF9;--rk-greige:#E8E3DB;--rk-gold:#B8975A;--rk-anthracite:#1A1816;--rk-black:#000000;--rk-radius-xl:1.25rem;--rk-radius-pill:999px;--rk-shadow-soft:0 24px 60px rgba(0,0,0,0.35);}';
        echo 'body{margin:0;font-family:"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at top,#1b1a18 0%,#0d0c0b 55%,#000 100%);color:var(--rk-cream);display:flex;min-height:100vh;align-items:center;justify-content:flex-start;padding:4rem 2.5rem;overflow:hidden;}';
        echo '.rk-maint{max-width:720px;width:100%;}';
        echo '.rk-maint__bar{width:72px;height:2px;background:linear-gradient(90deg,var(--rk-gold),transparent);margin-bottom:1.5rem;}';
        echo '.rk-maint__eyebrow{margin:0 0 0.4rem;font-size:0.7rem;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.55);}';
        echo '.rk-maint h1{margin:0 0 0.75rem;font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(2.1rem,4vw,3.1rem);font-weight:300;letter-spacing:-0.02em;line-height:1.05;}';
        echo '.rk-maint p{margin:0 0 1.75rem;color:rgba(255,255,255,0.7);line-height:1.7;font-size:1rem;}';
        echo '.rk-maint label{display:block;font-size:0.7rem;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:0.6rem;}';
        echo '.rk-maint input{width:min(420px,100%);padding:0.9rem 1rem;border-radius:var(--rk-radius-pill);border:1px solid rgba(255,255,255,0.2);background:#0b0b0b;color:#fff;margin-bottom:0.85rem;}';
        echo '.rk-maint button{width:min(420px,100%);padding:0.9rem 1rem;border-radius:var(--rk-radius-pill);border:0;background:var(--rk-cream);color:var(--rk-black);font-weight:600;text-transform:uppercase;letter-spacing:0.2em;cursor:pointer;}';
        echo '.rk-maint__hint{margin-top:1rem;font-size:0.85rem;color:rgba(255,255,255,0.58);}';
        echo '</style>';
        echo '</head>';
        echo '<body>';
        echo '<div class="rk-maint">';
        echo '<div class="rk-maint__bar"></div>';
        echo '<h1>Wir verfeinern gerade das Erlebnis.</h1>';
        echo '<form method="post" action="' . $action . '">';
        echo '<input type="hidden" name="rk_redirect" value="' . $redirect . '">';
        echo '<label for="rk-access">Zugangsschluessel</label>';
        echo '<input id="rk-access" name="' . self::ACCESS_FIELD . '" type="password" autocomplete="one-time-code">';
        echo '<button type="submit">Zugang</button>';
        echo '</form>';
        echo '</div>';
        echo '</body>';
        echo '</html>';
        exit;
    }
}

//wp eval "echo substr(hash_hmac('sha256', wp_parse_url(home_url('/'), PHP_URL_HOST), defined('AUTH_KEY') ? AUTH_KEY : wp_salt('auth')), 0, 12), PHP_EOL;"
