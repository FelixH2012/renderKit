<?php
/**
 * Products Custom Post Type
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Register Products Custom Post Type and related functionality
 */
class Products {

    /**
     * Post type slug
     */
    public const POST_TYPE = 'rk_product';

    /**
     * Taxonomy slug
     */
    public const TAXONOMY = 'rk_product_category';

    /**
     * Initialize
     */
    public function init(): void {
        add_action('init', [$this, 'register_post_type']);
        add_action('init', [$this, 'register_taxonomy']);
        add_action('init', [$this, 'register_meta_fields']);
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        add_action('save_post_' . self::POST_TYPE, [$this, 'save_meta'], 10, 2);
        add_action('rest_api_init', [$this, 'register_rest_fields']);
    }

    /**
     * Register the Products post type
     */
    public function register_post_type(): void {
        $labels = [
            'name'               => __('Products', 'renderkit'),
            'singular_name'      => __('Product', 'renderkit'),
            'menu_name'          => __('Products', 'renderkit'),
            'add_new'            => __('Add New', 'renderkit'),
            'add_new_item'       => __('Add New Product', 'renderkit'),
            'edit_item'          => __('Edit Product', 'renderkit'),
            'new_item'           => __('New Product', 'renderkit'),
            'view_item'          => __('View Product', 'renderkit'),
            'search_items'       => __('Search Products', 'renderkit'),
            'not_found'          => __('No products found', 'renderkit'),
            'not_found_in_trash' => __('No products found in trash', 'renderkit'),
            'all_items'          => __('All Products', 'renderkit'),
        ];

        $args = [
            'labels'              => $labels,
            'public'              => true,
            'publicly_queryable'  => true,
            'show_ui'             => true,
            'show_in_menu'        => true,
            'show_in_rest'        => true,
            'query_var'           => true,
            'rewrite'             => ['slug' => 'products', 'with_front' => false],
            'capability_type'     => 'post',
            'has_archive'         => true,
            'hierarchical'        => false,
            'menu_position'       => 5,
            'menu_icon'           => 'dashicons-cart',
            'supports'            => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
            'template'            => [
                ['core/paragraph', ['placeholder' => 'Add product description...']],
            ],
        ];

        register_post_type(self::POST_TYPE, $args);
    }

    /**
     * Register Product Category taxonomy
     */
    public function register_taxonomy(): void {
        $labels = [
            'name'              => __('Product Categories', 'renderkit'),
            'singular_name'     => __('Product Category', 'renderkit'),
            'search_items'      => __('Search Categories', 'renderkit'),
            'all_items'         => __('All Categories', 'renderkit'),
            'parent_item'       => __('Parent Category', 'renderkit'),
            'parent_item_colon' => __('Parent Category:', 'renderkit'),
            'edit_item'         => __('Edit Category', 'renderkit'),
            'update_item'       => __('Update Category', 'renderkit'),
            'add_new_item'      => __('Add New Category', 'renderkit'),
            'new_item_name'     => __('New Category Name', 'renderkit'),
            'menu_name'         => __('Categories', 'renderkit'),
        ];

        $args = [
            'labels'            => $labels,
            'hierarchical'      => true,
            'public'            => true,
            'show_ui'           => true,
            'show_admin_column' => true,
            'show_in_rest'      => true,
            'rewrite'           => ['slug' => 'product-category'],
        ];

        register_taxonomy(self::TAXONOMY, self::POST_TYPE, $args);
    }

    /**
     * Register meta fields for REST API
     */
    public function register_meta_fields(): void {
        $meta_args = [
            'show_in_rest'      => true,
            'single'            => true,
            'type'              => 'string',
            'auth_callback'     => fn() => current_user_can('edit_posts'),
            'sanitize_callback' => 'sanitize_text_field',
        ];

        register_post_meta(self::POST_TYPE, '_rk_price', array_merge($meta_args, [
            'type' => 'number',
            'sanitize_callback' => fn($value) => floatval($value),
        ]));

        register_post_meta(self::POST_TYPE, '_rk_sale_price', array_merge($meta_args, [
            'type' => 'number',
            'sanitize_callback' => fn($value) => floatval($value),
        ]));

        register_post_meta(self::POST_TYPE, '_rk_sku', $meta_args);

        register_post_meta(self::POST_TYPE, '_rk_stock_status', array_merge($meta_args, [
            'default' => 'instock',
        ]));

        register_post_meta(self::POST_TYPE, '_rk_gallery', array_merge($meta_args, [
            'type' => 'array',
            'single' => true,
            'show_in_rest' => [
                'schema' => [
                    'type' => 'array',
                    'items' => ['type' => 'integer'],
                ],
            ],
            'default' => [],
        ]));
    }

    /**
     * Add meta boxes for product data
     */
    public function add_meta_boxes(): void {
        add_meta_box(
            'rk_product_data',
            __('Product Data', 'renderkit'),
            [$this, 'render_meta_box'],
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    /**
     * Render the product data meta box
     */
    public function render_meta_box(\WP_Post $post): void {
        wp_nonce_field('rk_product_meta', 'rk_product_nonce');

        $price = get_post_meta($post->ID, '_rk_price', true);
        $sale_price = get_post_meta($post->ID, '_rk_sale_price', true);
        $sku = get_post_meta($post->ID, '_rk_sku', true);
        $stock_status = get_post_meta($post->ID, '_rk_stock_status', true) ?: 'instock';
        ?>
        <style>
            .rk-product-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 15px 0; }
            .rk-product-fields label { display: block; font-weight: 600; margin-bottom: 5px; color: #1A1816; }
            .rk-product-fields input, .rk-product-fields select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
            .rk-product-fields input:focus, .rk-product-fields select:focus { border-color: #B8975A; outline: none; box-shadow: 0 0 0 2px rgba(184, 151, 90, 0.2); }
        </style>
        <div class="rk-product-fields">
            <div>
                <label for="rk_price"><?php esc_html_e('Price (€)', 'renderkit'); ?></label>
                <input type="number" id="rk_price" name="rk_price" value="<?php echo esc_attr($price); ?>" step="0.01" min="0" placeholder="29.99">
            </div>
            <div>
                <label for="rk_sale_price"><?php esc_html_e('Sale Price (€)', 'renderkit'); ?></label>
                <input type="number" id="rk_sale_price" name="rk_sale_price" value="<?php echo esc_attr($sale_price); ?>" step="0.01" min="0" placeholder="24.99">
            </div>
            <div>
                <label for="rk_sku"><?php esc_html_e('SKU', 'renderkit'); ?></label>
                <input type="text" id="rk_sku" name="rk_sku" value="<?php echo esc_attr($sku); ?>" placeholder="FE-KERZE-001">
            </div>
            <div>
                <label for="rk_stock_status"><?php esc_html_e('Stock Status', 'renderkit'); ?></label>
                <select id="rk_stock_status" name="rk_stock_status">
                    <option value="instock" <?php selected($stock_status, 'instock'); ?>><?php esc_html_e('In Stock', 'renderkit'); ?></option>
                    <option value="outofstock" <?php selected($stock_status, 'outofstock'); ?>><?php esc_html_e('Out of Stock', 'renderkit'); ?></option>
                    <option value="onorder" <?php selected($stock_status, 'onorder'); ?>><?php esc_html_e('On Order', 'renderkit'); ?></option>
                </select>
            </div>
        </div>
        <?php
    }

    /**
     * Save product meta
     */
    public function save_meta(int $post_id, \WP_Post $post): void {
        if (!isset($_POST['rk_product_nonce']) || !wp_verify_nonce($_POST['rk_product_nonce'], 'rk_product_meta')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $fields = ['rk_price', 'rk_sale_price', 'rk_sku', 'rk_stock_status'];

        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                $value = sanitize_text_field($_POST[$field]);
                update_post_meta($post_id, '_' . $field, $value);
            }
        }
    }

    /**
     * Register REST API fields
     */
    public function register_rest_fields(): void {
        register_rest_field(self::POST_TYPE, 'product_data', [
            'get_callback' => function ($post) {
                $id = $post['id'];
                return [
                    'price'        => (float) get_post_meta($id, '_rk_price', true),
                    'sale_price'   => (float) get_post_meta($id, '_rk_sale_price', true),
                    'sku'          => get_post_meta($id, '_rk_sku', true),
                    'stock_status' => get_post_meta($id, '_rk_stock_status', true) ?: 'instock',
                    'image'        => get_the_post_thumbnail_url($id, 'large'),
                ];
            },
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'price'        => ['type' => 'number'],
                    'sale_price'   => ['type' => 'number'],
                    'sku'          => ['type' => 'string'],
                    'stock_status' => ['type' => 'string'],
                    'image'        => ['type' => 'string'],
                ],
            ],
        ]);
    }

    /**
     * Get products for frontend
     */
    public static function get_products(array $args = []): array {
        $defaults = [
            'post_type'      => self::POST_TYPE,
            'posts_per_page' => 12,
            'post_status'    => 'publish',
        ];

        $query = new \WP_Query(array_merge($defaults, $args));
        $products = [];

        foreach ($query->posts as $post) {
            $products[] = [
                'id'           => $post->ID,
                'title'        => $post->post_title,
                'excerpt'      => $post->post_excerpt,
                'url'          => get_permalink($post->ID),
                'price'        => (float) get_post_meta($post->ID, '_rk_price', true),
                'sale_price'   => (float) get_post_meta($post->ID, '_rk_sale_price', true),
                'sku'          => get_post_meta($post->ID, '_rk_sku', true),
                'stock_status' => get_post_meta($post->ID, '_rk_stock_status', true) ?: 'instock',
                'image'        => get_the_post_thumbnail_url($post->ID, 'large'),
            ];
        }

        return $products;
    }
}
