<?php
/**
 * Contact Form Handler
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit\Integrations;

/**
 * Handle contact form submissions and reCAPTCHA verification.
 */
class ContactForm {
    public const NONCE_ACTION = 'rk_contact_submission';
    public const NONCE_FIELD = 'rk_contact_nonce';
    private const RECAPTCHA_DEFAULT_ACTION = 'contact_form';
    private const RECAPTCHA_DEFAULT_THRESHOLD = 0.5;

    /**
     * Register form handlers.
     */
    public function init(): void {
        add_action('admin_post_' . self::NONCE_ACTION, [$this, 'handle_submission']);
        add_action('admin_post_nopriv_' . self::NONCE_ACTION, [$this, 'handle_submission']);
    }

    /**
     * Handle the contact form submission.
     */
    public function handle_submission(): void {
        if (!$this->is_nonce_valid()) {
            $this->redirect_with_status('invalid_nonce');
        }

        $site_key = self::get_recaptcha_site_key();
        $secret_key = self::get_recaptcha_secret_key();
        if ($site_key !== '' && $secret_key === '') {
            $this->redirect_with_status('recaptcha_config_missing');
        }

        if ($secret_key !== '') {
            $token = sanitize_text_field($_POST['g-recaptcha-response'] ?? '');
            $expected_action = (string) apply_filters('renderkit_recaptcha_action', self::RECAPTCHA_DEFAULT_ACTION);
            if ($token === '') {
                $this->redirect_with_status('recaptcha_missing');
            }

            $response = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', [
                'timeout' => 5,
                'body'    => [
                    'secret'   => $secret_key,
                    'response' => $token,
                    'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
                ],
            ]);

            if (is_wp_error($response)) {
                $this->redirect_with_status('recaptcha_error');
            }

            $body = json_decode((string) wp_remote_retrieve_body($response), true);
            if (!is_array($body) || empty($body['success'])) {
                $this->redirect_with_status('recaptcha_failed');
            }

            $action = isset($body['action']) ? (string) $body['action'] : '';
            if ($action !== '' && $expected_action !== '' && $action !== $expected_action) {
                $this->redirect_with_status('recaptcha_action_mismatch');
            }

            $threshold = (float) apply_filters('renderkit_recaptcha_score_threshold', self::RECAPTCHA_DEFAULT_THRESHOLD);
            $score = isset($body['score']) ? (float) $body['score'] : null;
            if ($score !== null && $score < $threshold) {
                $this->redirect_with_status('recaptcha_low_score');
            }
        }

        $privacy_required = sanitize_text_field($_POST['rk_privacy_required'] ?? '') === '1';
        if ($privacy_required) {
            $privacy_agreed = sanitize_text_field($_POST['rk_privacy_agree'] ?? '') === '1';
            if (!$privacy_agreed) {
                $this->redirect_with_status('privacy_missing');
            }
        }

        $name = sanitize_text_field($_POST['rk_name'] ?? '');
        $email = sanitize_email($_POST['rk_email'] ?? '');
        $subject = sanitize_text_field($_POST['rk_subject'] ?? '');
        $message = sanitize_textarea_field($_POST['rk_message'] ?? '');

        if ($name === '' || $email === '' || $message === '') {
            $this->redirect_with_status('invalid');
        }

        $admin_email = (string) get_option('admin_email');
        $mail_subject = $subject !== '' ? $subject : sprintf('Contact form message from %s', get_bloginfo('name'));

        $lines = [
            'Name: ' . $name,
            'Email: ' . $email,
        ];

        if ($subject !== '') {
            $lines[] = 'Subject: ' . $subject;
        }

        $lines[] = '';
        $lines[] = 'Message:';
        $lines[] = $message;

        $headers = [];
        if ($email !== '') {
            $reply_name = $name !== '' ? $name : $email;
            $headers[] = sprintf('Reply-To: %s <%s>', $reply_name, $email);
        }

        $sent = wp_mail($admin_email, $mail_subject, implode("\n", $lines), $headers);
        $this->redirect_with_status($sent ? 'success' : 'mail_failed');
    }

    /**
     * @return bool
     */
    private function is_nonce_valid(): bool {
        $nonce = sanitize_text_field($_POST[self::NONCE_FIELD] ?? '');
        if ($nonce === '') {
            return false;
        }

        return (bool) wp_verify_nonce($nonce, self::NONCE_ACTION);
    }

    /**
     * @param string $status
     */
    private function redirect_with_status(string $status): void {
        $redirect = wp_get_referer();
        if (!is_string($redirect) || $redirect === '') {
            $redirect = home_url('/');
        }

        $redirect = add_query_arg('rk_contact_status', $status, $redirect);
        wp_safe_redirect($redirect);
        exit;
    }

    /**
     * @return string
     */
    public static function get_recaptcha_site_key(): string {
        if (defined('RENDERKIT_RECAPTCHA_SITE_KEY')) {
            return (string) RENDERKIT_RECAPTCHA_SITE_KEY;
        }

        $option = get_option('renderkit_recaptcha_site_key');
        $key = is_string($option) ? $option : '';

        return (string) apply_filters('renderkit_recaptcha_site_key', $key);
    }

    /**
     * @return string
     */
    public static function get_recaptcha_secret_key(): string {
        if (defined('RENDERKIT_RECAPTCHA_SECRET_KEY')) {
            return (string) RENDERKIT_RECAPTCHA_SECRET_KEY;
        }

        $option = get_option('renderkit_recaptcha_secret_key');
        $key = is_string($option) ? $option : '';

        return (string) apply_filters('renderkit_recaptcha_secret_key', $key);
    }
}
