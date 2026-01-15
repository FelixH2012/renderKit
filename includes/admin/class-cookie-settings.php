<?php
/**
 * Cookie Settings (CPT)
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Manage cookie settings via a custom post type.
 */
class CookieSettings {
    public const POST_TYPE = 'renderkit_cookie';
    public const META_ID = '_rk_cookie_id';
    public const META_REQUIRED = '_rk_cookie_required';
    public const META_ENABLED = '_rk_cookie_enabled';
    public const META_LINK_LABEL = '_rk_cookie_link_label';
    public const META_LINK_URL = '_rk_cookie_link_url';
    private const NONCE_ACTION = 'rk_cookie_settings_save';
    private const NONCE_FIELD = 'rk_cookie_settings_nonce';

    /**
     * Register hooks.
     */
    public function init(): void {
        add_action('init', [$this, 'register_post_type']);
        add_action('add_meta_boxes', [$this, 'register_meta_boxes']);
        add_action('save_post', [$this, 'save_meta_boxes']);
    }

    /**
     * Register the Cookie Settings post type.
     */
    public function register_post_type(): void {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name' => __('Cookie Einstellungen', 'renderkit'),
                'singular_name' => __('Cookie Einstellung', 'renderkit'),
                'add_new_item' => __('Cookie Einstellung hinzufuegen', 'renderkit'),
                'edit_item' => __('Cookie Einstellung bearbeiten', 'renderkit'),
                'new_item' => __('Neue Cookie Einstellung', 'renderkit'),
                'view_item' => __('Cookie Einstellung anzeigen', 'renderkit'),
                'search_items' => __('Cookie Einstellungen suchen', 'renderkit'),
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'menu_position' => 25,
            'menu_icon' => 'dashicons-shield',
            'supports' => ['title', 'editor'],
        ]);
    }

    /**
     * Register meta boxes for Cookie Settings.
     */
    public function register_meta_boxes(): void {
        add_meta_box(
            'rk_cookie_setting_meta',
            __('Cookie Einstellung Details', 'renderkit'),
            [$this, 'render_meta_box'],
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    /**
     * Render meta box fields.
     *
     * @param \WP_Post $post
     */
    public function render_meta_box(\WP_Post $post): void {
        wp_nonce_field(self::NONCE_ACTION, self::NONCE_FIELD);

        $id = (string) get_post_meta($post->ID, self::META_ID, true);
        $required = (string) get_post_meta($post->ID, self::META_REQUIRED, true) === '1';
        $enabled = (string) get_post_meta($post->ID, self::META_ENABLED, true) === '1';
        $link_label = (string) get_post_meta($post->ID, self::META_LINK_LABEL, true);
        $link_url = (string) get_post_meta($post->ID, self::META_LINK_URL, true);

        ?>
        <p>
            <label for="rk-cookie-id"><strong><?php esc_html_e('Einstellung ID', 'renderkit'); ?></strong></label><br>
            <input
                id="rk-cookie-id"
                name="rk_cookie_id"
                type="text"
                class="regular-text"
                value="<?php echo esc_attr($id); ?>"
                placeholder="analytics"
            >
            <span class="description"><?php esc_html_e('Eindeutiger Key fuer den Cookie Banner.', 'renderkit'); ?></span>
        </p>
        <p>
            <label>
                <input type="checkbox" name="rk_cookie_required" value="1" <?php checked($required); ?>>
                <?php esc_html_e('Erforderlich (immer aktiv)', 'renderkit'); ?>
            </label>
        </p>
        <p>
            <label>
                <input type="checkbox" name="rk_cookie_enabled" value="1" <?php checked($enabled); ?>>
                <?php esc_html_e('Standardmaessig aktiv', 'renderkit'); ?>
            </label>
        </p>
        <hr>
        <p>
            <label for="rk-cookie-link-label"><strong><?php esc_html_e('Link Text', 'renderkit'); ?></strong></label><br>
            <input
                id="rk-cookie-link-label"
                name="rk_cookie_link_label"
                type="text"
                class="regular-text"
                value="<?php echo esc_attr($link_label); ?>"
                placeholder="<?php esc_attr_e('Mehr Infos', 'renderkit'); ?>"
            >
        </p>
        <p>
            <label for="rk-cookie-link-url"><strong><?php esc_html_e('Link URL', 'renderkit'); ?></strong></label><br>
            <input
                id="rk-cookie-link-url"
                name="rk_cookie_link_url"
                type="url"
                class="regular-text"
                value="<?php echo esc_attr($link_url); ?>"
                placeholder="https://example.com"
            >
        </p>
        <?php
    }

    /**
     * Save meta box data.
     *
     * @param int $post_id
     */
    public function save_meta_boxes(int $post_id): void {
        if (!isset($_POST[self::NONCE_FIELD]) || !wp_verify_nonce($_POST[self::NONCE_FIELD], self::NONCE_ACTION)) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $id = isset($_POST['rk_cookie_id']) ? sanitize_key(wp_unslash($_POST['rk_cookie_id'])) : '';
        $required = isset($_POST['rk_cookie_required']) ? '1' : '0';
        $enabled = isset($_POST['rk_cookie_enabled']) ? '1' : '0';
        $link_label = isset($_POST['rk_cookie_link_label']) ? sanitize_text_field(wp_unslash($_POST['rk_cookie_link_label'])) : '';
        $link_url = isset($_POST['rk_cookie_link_url']) ? esc_url_raw(wp_unslash($_POST['rk_cookie_link_url'])) : '';

        update_post_meta($post_id, self::META_ID, $id);
        update_post_meta($post_id, self::META_REQUIRED, $required);
        update_post_meta($post_id, self::META_ENABLED, $enabled);
        update_post_meta($post_id, self::META_LINK_LABEL, $link_label);
        update_post_meta($post_id, self::META_LINK_URL, $link_url);
    }
}
