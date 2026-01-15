<?php
/**
 * Cart Service
 *
 * Session-based shopping cart management with REST API.
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Shopping Cart Service
 */
class Cart {

    /**
     * Session key for cart data
     */
    const SESSION_KEY = 'renderkit_cart';

    /**
     * REST API namespace
     */
    const REST_NAMESPACE = 'renderkit/v1';

    /**
     * Initialize cart service
     */
    public function init(): void {
        // Start session early if not already started
        add_action('init', [$this, 'maybe_start_session'], 1);

        // Register REST API endpoints
        add_action('rest_api_init', [$this, 'register_rest_routes']);

        // Localize cart data for frontend
        add_action('wp_enqueue_scripts', [$this, 'localize_cart_data'], 20);
    }

    /**
     * Start PHP session if not already started
     */
    public function maybe_start_session(): void {
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start();
        }
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes(): void {
        register_rest_route(self::REST_NAMESPACE, '/cart', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_get_cart'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::REST_NAMESPACE, '/cart/add', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_add_item'],
            'permission_callback' => '__return_true',
            'args' => [
                'product_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'quantity' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 1,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/cart/update', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_update_quantity'],
            'permission_callback' => '__return_true',
            'args' => [
                'product_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'quantity' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/cart/remove', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_remove_item'],
            'permission_callback' => '__return_true',
            'args' => [
                'product_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/cart/clear', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_clear_cart'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Localize cart data for frontend JavaScript
     */
    public function localize_cart_data(): void {
        $data = [
            'restUrl' => rest_url(self::REST_NAMESPACE . '/cart'),
            'nonce' => wp_create_nonce('wp_rest'),
            'items' => $this->get_items(),
            'count' => $this->get_count(),
            'total' => $this->get_total(),
        ];

        wp_localize_script('renderkit-view', 'renderKitCart', $data);
    }

    /**
     * Get cart items from session
     *
     * @return array<int, array{id: int, quantity: int}>
     */
    public function get_cart_data(): array {
        $this->maybe_start_session();
        return $_SESSION[self::SESSION_KEY] ?? [];
    }

    /**
     * Save cart data to session
     *
     * @param array<int, array{id: int, quantity: int}> $data
     */
    private function save_cart_data(array $data): void {
        $this->maybe_start_session();
        $_SESSION[self::SESSION_KEY] = $data;
    }

    /**
     * Add item to cart
     *
     * @param int $product_id Product ID
     * @param int $quantity Quantity to add
     * @return array<string, mixed> Updated cart state
     */
    public function add_item(int $product_id, int $quantity = 1): array {
        if ($quantity < 1) {
            $quantity = 1;
        }

        // Validate product exists
        $product = get_post($product_id);
        if (!$product || $product->post_type !== Products::POST_TYPE) {
            return ['error' => 'invalid_product'];
        }

        $cart = $this->get_cart_data();

        if (isset($cart[$product_id])) {
            $cart[$product_id]['quantity'] += $quantity;
        } else {
            $cart[$product_id] = [
                'id' => $product_id,
                'quantity' => $quantity,
            ];
        }

        $this->save_cart_data($cart);

        return $this->get_cart_response();
    }

    /**
     * Update item quantity
     *
     * @param int $product_id Product ID
     * @param int $quantity New quantity (0 removes the item)
     * @return array<string, mixed> Updated cart state
     */
    public function update_quantity(int $product_id, int $quantity): array {
        $cart = $this->get_cart_data();

        if ($quantity <= 0) {
            unset($cart[$product_id]);
        } elseif (isset($cart[$product_id])) {
            $cart[$product_id]['quantity'] = $quantity;
        }

        $this->save_cart_data($cart);

        return $this->get_cart_response();
    }

    /**
     * Remove item from cart
     *
     * @param int $product_id Product ID
     * @return array<string, mixed> Updated cart state
     */
    public function remove_item(int $product_id): array {
        $cart = $this->get_cart_data();
        unset($cart[$product_id]);
        $this->save_cart_data($cart);

        return $this->get_cart_response();
    }

    /**
     * Clear all items from cart
     *
     * @return array<string, mixed> Empty cart state
     */
    public function clear(): array {
        $this->save_cart_data([]);
        return $this->get_cart_response();
    }

    /**
     * Get enriched cart items with product data
     *
     * @return array<int, array{id: int, title: string, price: float, sale_price: float, quantity: int, image: string|null, url: string}>
     */
    public function get_items(): array {
        $cart_data = $this->get_cart_data();
        $items = [];

        foreach ($cart_data as $product_id => $item) {
            $product = get_post($product_id);
            if (!$product || $product->post_type !== Products::POST_TYPE) {
                continue;
            }

            $price = (float) get_post_meta($product_id, '_rk_price', true);
            $sale_price = (float) get_post_meta($product_id, '_rk_sale_price', true);
            $image_id = (int) get_post_thumbnail_id($product_id);
            $image_url = $image_id > 0 ? wp_get_attachment_image_url($image_id, 'medium') : null;

            $items[] = [
                'id' => $product_id,
                'title' => $product->post_title,
                'price' => $price,
                'sale_price' => $sale_price,
                'quantity' => $item['quantity'],
                'image' => $image_url ?: null,
                'url' => get_permalink($product_id),
            ];
        }

        return $items;
    }

    /**
     * Get total item count in cart
     *
     * @return int
     */
    public function get_count(): int {
        $cart_data = $this->get_cart_data();
        $count = 0;

        foreach ($cart_data as $item) {
            $count += $item['quantity'];
        }

        return $count;
    }

    /**
     * Get cart total price
     *
     * @return float
     */
    public function get_total(): float {
        $items = $this->get_items();
        $total = 0.0;

        foreach ($items as $item) {
            $price = $item['sale_price'] > 0 ? $item['sale_price'] : $item['price'];
            $total += $price * $item['quantity'];
        }

        return $total;
    }

    /**
     * Get complete cart response for REST API
     *
     * @return array<string, mixed>
     */
    public function get_cart_response(): array {
        return [
            'success' => true,
            'items' => $this->get_items(),
            'count' => $this->get_count(),
            'total' => $this->get_total(),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // REST API Callbacks
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * REST: Get cart
     */
    public function rest_get_cart(\WP_REST_Request $request): \WP_REST_Response {
        return new \WP_REST_Response($this->get_cart_response(), 200);
    }

    /**
     * REST: Add item to cart
     */
    public function rest_add_item(\WP_REST_Request $request): \WP_REST_Response {
        $product_id = (int) $request->get_param('product_id');
        $quantity = (int) $request->get_param('quantity');

        $result = $this->add_item($product_id, $quantity);

        if (isset($result['error'])) {
            return new \WP_REST_Response(['success' => false, 'error' => $result['error']], 400);
        }

        return new \WP_REST_Response($result, 200);
    }

    /**
     * REST: Update item quantity
     */
    public function rest_update_quantity(\WP_REST_Request $request): \WP_REST_Response {
        $product_id = (int) $request->get_param('product_id');
        $quantity = (int) $request->get_param('quantity');

        return new \WP_REST_Response($this->update_quantity($product_id, $quantity), 200);
    }

    /**
     * REST: Remove item from cart
     */
    public function rest_remove_item(\WP_REST_Request $request): \WP_REST_Response {
        $product_id = (int) $request->get_param('product_id');

        return new \WP_REST_Response($this->remove_item($product_id), 200);
    }

    /**
     * REST: Clear cart
     */
    public function rest_clear_cart(\WP_REST_Request $request): \WP_REST_Response {
        return new \WP_REST_Response($this->clear(), 200);
    }
}
