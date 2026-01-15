<?php
/**
 * Block Loader Class
 *
 * Handles auto-discovery and registration of Gutenberg blocks
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Block Loader - Auto-discovers and registers blocks
 */
class BlockLoader {

    /**
     * Plugin configuration
     *
     * @var array<string, mixed>
     */
    private array $config;

    /**
     * renderKit-Relay client
     */
    private RelayClient $relay;

    /**
     * Registered block names
     *
     * @var array<string>
     */
    private array $registered_blocks = [];

    /**
     * Constructor
     *
     * @param array<string, mixed> $config Plugin configuration.
     */
    public function __construct(array $config) {
        $this->config = $config;
        $this->relay = new RelayClient($config['relay'] ?? []);
    }

    /**
     * Initialize block loader
     */
    public function init(): void {
        add_action('init', [$this, 'discover_and_register_blocks'], 20);
    }

    /**
     * Discover and register all blocks
     */
    public function discover_and_register_blocks(): void {
        $blocks_dir = $this->config['blocks_dir'];

        if (!is_dir($blocks_dir)) {
            return;
        }

        $block_dirs = glob($blocks_dir . '/*/block.json');

        if (empty($block_dirs)) {
            return;
        }

        foreach ($block_dirs as $block_json_path) {
            $this->register_block($block_json_path);
        }
    }

    /**
     * Register a single block from its block.json file
     *
     * @param string $block_json_path Path to block.json file.
     */
    private function register_block(string $block_json_path): void {
        $block_dir = dirname($block_json_path);
        $block_data = $this->read_block_json($block_json_path);

        if (empty($block_data)) {
            return;
        }

        $block_name = $block_data['name'] ?? '';

        if (empty($block_name)) {
            return;
        }

        // Build registration arguments
        $args = $this->build_registration_args($block_dir, $block_data);

        // Register the block
        $result = register_block_type($block_json_path, $args);

        if ($result !== false) {
            $this->registered_blocks[] = $block_name;
        }
    }

    /**
     * Read and parse block.json file
     *
     * @param string $path Path to block.json.
     * @return array<string, mixed>
     */
    private function read_block_json(string $path): array {
        if (!file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);

        if ($content === false) {
            return [];
        }

        $data = json_decode($content, true);

        if (!is_array($data)) {
            return [];
        }

        return $data;
    }

    /**
     * Build block registration arguments
     *
     * @param string               $block_dir  Block directory path.
     * @param array<string, mixed> $block_data Block JSON data.
     * @return array<string, mixed>
     */
    private function build_registration_args(string $block_dir, array $block_data): array {
        $args = [];
        $args['render_callback'] = function (array $attributes, string $content, \WP_Block $block) use ($block_data): string {
            return $this->render_block_via_relay($attributes, $content, $block, $block_data);
        };

        return $args;
    }

    /**
     * Render a block via renderKit-Relay (TSX SSR).
     *
     * @param array<string, mixed>  $attributes  Block attributes.
     * @param string                $content     Block content.
     * @param \WP_Block             $block       Block instance.
     * @param array<string, mixed>  $block_data  Block JSON data.
     * @return string
     */
    private function render_block_via_relay(
        array $attributes,
        string $content,
        \WP_Block $block,
        array $block_data
    ): string {
        // Merge with default attributes from block.json
        $defaults = $this->get_attribute_defaults($block_data);
        $attributes = array_merge($defaults, $attributes);

        $block_name = (string) ($block_data['name'] ?? '');
        if ($block_name === '') {
            return '';
        }

        $prepared_attributes = $this->prepare_relay_attributes($block_name, $attributes);
        $props = [
            'attributes' => $prepared_attributes,
            'content'    => $content,
        ];

        $html = $this->relay->render($block_name, $props);

        if ($html === '') {
            if (current_user_can('manage_options')) {
                return '<!-- renderKit-Relay: render failed for ' . esc_html($block_name) . ' -->';
            }
            return '';
        }

        $block_key = $this->block_key_from_name($block_name);
        $wrapper_attributes = get_block_wrapper_attributes([
            'data-renderkit-block' => $block_key,
            'data-renderkit-relay' => '1',
        ]);

        return $this->apply_wrapper_attributes_to_root($html, $wrapper_attributes);
    }

    /**
     * Prepare attributes for relay rendering (adds dynamic props where needed).
     *
     * @param string               $block_name Full block name, e.g. renderkit/navigation
     * @param array<string, mixed> $attributes Merged block attributes
     * @return array<string, mixed>
     */
    private function prepare_relay_attributes(string $block_name, array $attributes): array {
        switch ($block_name) {
            case 'renderkit/navigation':
                return $this->prepare_navigation_attributes($attributes);
            case 'renderkit/product-grid':
                return $this->prepare_product_grid_attributes($attributes);
            case 'renderkit/swiper':
                return $this->prepare_swiper_attributes($attributes);
            case 'renderkit/footer':
                return $this->prepare_footer_attributes($attributes);
            case 'renderkit/contact-form':
                return $this->prepare_contact_form_attributes($attributes);
            case 'renderkit/cookie-banner':
                return $this->prepare_cookie_banner_attributes($attributes);
            case 'renderkit/cart':
                return $this->prepare_cart_attributes($attributes);
            default:
                return $attributes;
        }
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function prepare_footer_attributes(array $attributes): array {
        $menu_slug = (string) ($attributes['menuSlug'] ?? 'renderkit-footer');
        $site_name = !empty($attributes['siteName']) ? (string) $attributes['siteName'] : get_bloginfo('name');

        $menu_items = [];
        $locations = get_nav_menu_locations();

        if (!empty($locations[$menu_slug])) {
            $menu = wp_get_nav_menu_object($locations[$menu_slug]);
            if ($menu) {
                $items = wp_get_nav_menu_items($menu->term_id);
                if ($items) {
                    foreach ($items as $item) {
                        if ((int) $item->menu_item_parent !== 0) {
                            continue;
                        }
                        $menu_items[] = [
                            'id'    => (int) $item->ID,
                            'title' => (string) $item->title,
                            'url'   => (string) $item->url,
                        ];
                    }
                }
            }
        }

        $attributes['menuItems'] = $menu_items;
        $attributes['siteName'] = $site_name;

        return $attributes;
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function prepare_navigation_attributes(array $attributes): array {
        $menu_slug = (string) ($attributes['menuSlug'] ?? 'renderkit-primary');
        $site_name = !empty($attributes['siteName']) ? (string) $attributes['siteName'] : get_bloginfo('name');
        $current_url = home_url(add_query_arg([]));

        $menu_items = [];
        $locations = get_nav_menu_locations();

        if (!empty($locations[$menu_slug])) {
            $menu = wp_get_nav_menu_object($locations[$menu_slug]);
            if ($menu) {
                $items = wp_get_nav_menu_items($menu->term_id);
                if ($items) {
                    foreach ($items as $item) {
                        if ((int) $item->menu_item_parent !== 0) {
                            continue;
                        }
                        $menu_items[] = [
                            'id'    => (int) $item->ID,
                            'title' => (string) $item->title,
                            'url'   => (string) $item->url,
                        ];
                    }
                }
            }
        }

        $attributes['menuItems'] = $menu_items;
        $attributes['siteName'] = $site_name;
        $attributes['currentUrl'] = $current_url;

        // Inject cart data
        $cart = new Cart();
        $attributes['cartCount'] = $cart->get_count();

        // Get cart page URL (try by slug first, then by path)
        $cart_page = get_page_by_path('warenkorb');
        if (!$cart_page) {
            $cart_page = get_page_by_path('cart');
        }
        $attributes['cartUrl'] = $cart_page ? get_permalink($cart_page) : '/warenkorb/';

        return $attributes;
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function prepare_product_grid_attributes(array $attributes): array {
        $count = isset($attributes['count']) ? (int) $attributes['count'] : 6;
        $category = isset($attributes['category']) ? (int) $attributes['category'] : 0;

        $args = ['posts_per_page' => min($count, 6)];
        if ($category > 0) {
            $args['tax_query'] = [[
                'taxonomy' => Products::TAXONOMY,
                'field'    => 'term_id',
                'terms'    => $category,
            ]];
        }

        $attributes['products'] = Products::get_products($args);
        return $attributes;
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function prepare_contact_form_attributes(array $attributes): array {
        $site_key = Integrations\ContactForm::get_recaptcha_site_key();
        $status = '';
        if (isset($_GET['rk_contact_status'])) {
            $status = sanitize_text_field(wp_unslash($_GET['rk_contact_status']));
        }

        $attributes['recaptchaSiteKey'] = $site_key;
        $attributes['recaptchaEnabled'] = $site_key !== '';
        $attributes['nonce'] = wp_create_nonce('rk_contact_submission');
        $attributes['status'] = $status;

        return $attributes;
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function prepare_cookie_banner_attributes(array $attributes): array {
        $cookies = get_posts([
            'post_type' => CookieSettings::POST_TYPE,
            'post_status' => 'publish',
            'numberposts' => -1,
            'orderby' => 'menu_order',
            'order' => 'ASC',
        ]);

        if (empty($cookies)) {
            return $attributes;
        }

        $settings = [];
        foreach ($cookies as $cookie) {
            if (!$cookie instanceof \WP_Post) {
                continue;
            }
            $id = (string) get_post_meta($cookie->ID, CookieSettings::META_ID, true);
            if ($id === '') {
                $id = sanitize_key($cookie->post_title ?: ('setting-' . $cookie->ID));
            }

            $settings[] = [
                'id' => $id,
                'label' => $cookie->post_title ? (string) $cookie->post_title : $id,
                'description' => $cookie->post_content ? wp_strip_all_tags($cookie->post_content) : '',
                'required' => (string) get_post_meta($cookie->ID, CookieSettings::META_REQUIRED, true) === '1',
                'enabledByDefault' => (string) get_post_meta($cookie->ID, CookieSettings::META_ENABLED, true) === '1',
                'linkLabel' => (string) get_post_meta($cookie->ID, CookieSettings::META_LINK_LABEL, true),
                'linkUrl' => (string) get_post_meta($cookie->ID, CookieSettings::META_LINK_URL, true),
            ];
        }

        $attributes['settings'] = $settings;
        return $attributes;
    }

    /**
     * Prepare cart attributes with current cart data.
     *
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function prepare_cart_attributes(array $attributes): array {
        $cart = new Cart();
        $attributes['items'] = $cart->get_items();
        $attributes['total'] = $cart->get_total();
        return $attributes;
    }

    /**
     * Enrich Swiper slide images with WP attachment data (src, srcset, sizes, dimensions, alt).
     *
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    private function prepare_swiper_attributes(array $attributes): array {
        $slides = $attributes['slides'] ?? [];
        if (!is_array($slides)) {
            return $attributes;
        }

        $prepared = [];
        foreach ($slides as $raw_slide) {
            if (!is_array($raw_slide)) {
                continue;
            }

            $slide = $raw_slide;
            $image_id = isset($slide['imageId']) ? (int) $slide['imageId'] : 0;

            if ($image_id > 0) {
                $src = wp_get_attachment_image_url($image_id, 'full');
                if (is_string($src) && $src !== '') {
                    $slide['imageUrl'] = $src;
                }

                $alt = get_post_meta($image_id, '_wp_attachment_image_alt', true);
                if (is_string($alt)) {
                    $slide['imageAlt'] = $alt;
                }

                $image_src = wp_get_attachment_image_src($image_id, 'full');
                if (is_array($image_src) && isset($image_src[1], $image_src[2])) {
                    $slide['imageWidth'] = (int) $image_src[1];
                    $slide['imageHeight'] = (int) $image_src[2];
                }

                $srcset = wp_get_attachment_image_srcset($image_id, 'large');
                if (is_string($srcset) && $srcset !== '') {
                    $slide['imageSrcSet'] = $srcset;
                }

                $sizes = wp_get_attachment_image_sizes($image_id, 'large');
                if (is_string($sizes) && $sizes !== '') {
                    $slide['imageSizes'] = $sizes;
                } else {
                    // Fallback: match the "peek" layout used by the CSS slider.
                    $slide['imageSizes'] = '(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 50vw';
                }
            }

            $prepared[] = $slide;
        }

        $attributes['slides'] = $prepared;
        return $attributes;
    }

    /**
     * @param string $block_name Full block name e.g. renderkit/hero
     */
    private function block_key_from_name(string $block_name): string {
        $parts = explode('/', $block_name, 2);
        return $parts[1] ?? $block_name;
    }

    /**
     * Apply WordPress wrapper attributes to the root element of a Relay-rendered HTML string.
     *
     * @param string $html Rendered HTML (must start with the root element)
     * @param string $wrapper_attributes Output of get_block_wrapper_attributes()
     */
    private function apply_wrapper_attributes_to_root(string $html, string $wrapper_attributes): string {
        $wrapper_attributes = trim($wrapper_attributes);
        if ($wrapper_attributes === '') {
            return $html;
        }

        $parsed = $this->parse_attribute_string($wrapper_attributes);
        if (empty($parsed)) {
            return $html;
        }

        if (class_exists('\\WP_HTML_Tag_Processor')) {
            $processor = new \WP_HTML_Tag_Processor($html);
            if (!$processor->next_tag()) {
                return $html;
            }

            $existing_class = (string) $processor->get_attribute('class');
            if (isset($parsed['class'])) {
                $processor->set_attribute('class', $this->merge_class_names($existing_class, (string) $parsed['class']));
                unset($parsed['class']);
            }

            $existing_style = (string) $processor->get_attribute('style');
            if (isset($parsed['style'])) {
                $processor->set_attribute('style', $this->merge_style_strings($existing_style, (string) $parsed['style']));
                unset($parsed['style']);
            }

            foreach ($parsed as $name => $value) {
                $processor->set_attribute($name, (string) $value);
            }

            return $processor->get_updated_html();
        }

        // Fallback: best-effort injection (no class/style merge).
        return preg_replace('/^<([a-z0-9:-]+)(\\s|>)/i', '<$1 ' . $wrapper_attributes . '$2', $html, 1) ?: $html;
    }

    /**
     * Parse an HTML attribute string like `class="a b" data-x="y"` into a map.
     *
     * @return array<string, string>
     */
    private function parse_attribute_string(string $attributes): array {
        $result = [];
        if ($attributes === '') {
            return $result;
        }

        if (!preg_match_all('/([a-zA-Z0-9:-]+)=(\"[^\"]*\"|\\\'[^\\\']*\\\')/', $attributes, $matches, PREG_SET_ORDER)) {
            return $result;
        }

        foreach ($matches as $match) {
            $name = $match[1];
            $value = $match[2];

            $value = trim($value, "\"'");
            $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
            $result[$name] = $value;
        }

        return $result;
    }

    private function merge_class_names(string $existing, string $additional): string {
        $existing_parts = preg_split('/\\s+/', trim($existing)) ?: [];
        $additional_parts = preg_split('/\\s+/', trim($additional)) ?: [];
        $merged = array_values(array_unique(array_filter(array_merge($existing_parts, $additional_parts))));
        return implode(' ', $merged);
    }

    private function merge_style_strings(string $existing, string $additional): string {
        $existing = trim($existing);
        $additional = trim($additional);
        if ($existing === '') {
            return $additional;
        }
        if ($additional === '') {
            return $existing;
        }
        $existing = rtrim($existing, ';');
        $additional = ltrim($additional, ';');
        return $existing . ';' . $additional;
    }

    /**
     * Get default attribute values from block.json
     *
     * @param array<string, mixed> $block_data Block JSON data.
     * @return array<string, mixed>
     */
    private function get_attribute_defaults(array $block_data): array {
        $defaults = [];
        $attributes = $block_data['attributes'] ?? [];

        foreach ($attributes as $name => $schema) {
            if (isset($schema['default'])) {
                $defaults[$name] = $schema['default'];
            }
        }

        return $defaults;
    }

    /**
     * Get list of registered block names
     *
     * @return array<string>
     */
    public function get_registered_block_names(): array {
        return $this->registered_blocks;
    }
}
