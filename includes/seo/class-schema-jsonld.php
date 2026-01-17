<?php
/**
 * Schema.org JSON-LD Generator
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

final class SchemaJsonLd {
    private const SCHEMA_CONTEXT = 'https://schema.org';

    private static ?self $instance = null;
    private bool $initialized = false;

    /**
     * @var array<int, array<string, mixed>>
     */
    private array $entries = [];

    /**
     * @var array<string, bool>
     */
    private array $seen = [];

    /**
     * @var array<string, string>
     */
    private array $block_generators = [
        'renderkit/faq' => 'build_faq_schema',
        'renderkit/product-grid' => 'build_product_grid_schema',
    ];

    public static function get_instance(): self {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function init(): void {
        if ($this->initialized) {
            return;
        }
        $this->initialized = true;

        add_action('wp', [$this, 'collect_context_schemas']);
        add_action('wp_head', [$this, 'output_json_ld'], 20);
    }

    public function collect_context_schemas(): void {
        if (!$this->should_collect()) {
            return;
        }

        if (is_singular(Products::POST_TYPE)) {
            $schema = $this->build_product_schema_from_post_id((int) get_queried_object_id());
            $this->add_schema($schema);
        }

        if (is_post_type_archive(Products::POST_TYPE)) {
            $schema = $this->build_product_archive_schema();
            $this->add_schema($schema);
        }
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function collect_block_schema(string $block_name, array $attributes, string $content, \WP_Block $block): void {
        if (!$this->should_collect()) {
            return;
        }

        $method = $this->block_generators[$block_name] ?? null;
        if (!$method || !method_exists($this, $method)) {
            return;
        }

        $schema = $this->$method($attributes, $content, $block);
        $this->add_schema($schema);
    }

    public function output_json_ld(): void {
        if (!$this->should_collect()) {
            return;
        }

        if (empty($this->entries)) {
            return;
        }

        $payload = $this->build_payload($this->entries);
        $payload = apply_filters('renderkit_schema_jsonld_payload', $payload, $this->entries);
        if (!is_array($payload) || empty($payload)) {
            return;
        }

        echo "\n" . '<script type="application/ld+json">';
        echo wp_json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        echo "</script>\n";
    }

    private function should_collect(): bool {
        if (is_admin()) {
            return false;
        }

        if (function_exists('wp_doing_ajax') && wp_doing_ajax()) {
            return false;
        }

        if (function_exists('wp_doing_cron') && wp_doing_cron()) {
            return false;
        }

        if (defined('REST_REQUEST') && REST_REQUEST) {
            return false;
        }

        return !is_feed();
    }

    /**
     * @param array<int, array<string, mixed>> $entries
     * @return array<string, mixed>
     */
    private function build_payload(array $entries): array {
        $entries = array_values($entries);
        if (count($entries) === 1) {
            $entry = $entries[0];
            if (!isset($entry['@context'])) {
                $entry['@context'] = self::SCHEMA_CONTEXT;
            }
            return $entry;
        }

        $graph = [];
        foreach ($entries as $entry) {
            if (isset($entry['@context'])) {
                unset($entry['@context']);
            }
            $graph[] = $entry;
        }

        return [
            '@context' => self::SCHEMA_CONTEXT,
            '@graph' => $graph,
        ];
    }

    /**
     * @param array<string, mixed>|array<int, array<string, mixed>>|null $schema
     */
    private function add_schema($schema): void {
        if (empty($schema)) {
            return;
        }

        if (is_array($schema) && $this->is_list($schema)) {
            foreach ($schema as $item) {
                if (is_array($item)) {
                    $this->add_schema($item);
                }
            }
            return;
        }

        if (!is_array($schema)) {
            return;
        }

        $normalized = $this->normalize_schema($schema);
        if (empty($normalized)) {
            return;
        }

        $key = $normalized['@id'] ?? '';
        if ($key === '') {
            $key = md5(wp_json_encode($normalized));
        }

        if (isset($this->seen[$key])) {
            return;
        }

        $this->entries[] = $normalized;
        $this->seen[$key] = true;
    }

    /**
     * @param array<string, mixed> $schema
     * @return array<string, mixed>
     */
    private function normalize_schema(array $schema): array {
        $normalized = [];
        foreach ($schema as $key => $value) {
            if (is_array($value)) {
                $value = $this->normalize_schema_array($value);
                if ($value === []) {
                    continue;
                }
            } elseif ($value === null || $value === '') {
                continue;
            }

            $normalized[$key] = $value;
        }

        return $normalized;
    }

    /**
     * @param array<mixed> $value
     * @return array<mixed>
     */
    private function normalize_schema_array(array $value): array {
        if ($this->is_list($value)) {
            $list = [];
            foreach ($value as $item) {
                if (is_array($item)) {
                    $item = $this->normalize_schema($item);
                    if ($item === []) {
                        continue;
                    }
                } elseif ($item === null || $item === '') {
                    continue;
                }
                $list[] = $item;
            }
            return $list;
        }

        return $this->normalize_schema($value);
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>|null
     */
    private function build_faq_schema(array $attributes): ?array {
        $items = $attributes['items'] ?? [];
        if (!is_array($items)) {
            return null;
        }

        $entities = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $question = $this->clean_text((string) ($item['question'] ?? ''));
            $answer = $this->clean_text((string) ($item['answer'] ?? ''));
            if ($question === '' || $answer === '') {
                continue;
            }
            $entities[] = [
                '@type' => 'Question',
                'name' => $question,
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $answer,
                ],
            ];
        }

        if (empty($entities)) {
            return null;
        }

        $id = $this->make_context_id('faq', $entities);

        $schema = [
            '@context' => self::SCHEMA_CONTEXT,
            '@type' => 'FAQPage',
            '@id' => $id,
            'mainEntity' => $entities,
        ];

        return apply_filters('renderkit_schema_jsonld_faq', $schema, $attributes);
    }

    /**
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>|null
     */
    private function build_product_grid_schema(array $attributes): ?array {
        $products = $attributes['products'] ?? [];
        if (!is_array($products) || $products === []) {
            return null;
        }

        $list_items = [];
        $position = 1;
        foreach ($products as $product) {
            if (!is_array($product)) {
                continue;
            }
            $schema = $this->build_product_schema_from_data($product);
            if (!$schema) {
                continue;
            }
            $this->add_schema($schema);
            $list_items[] = [
                '@type' => 'ListItem',
                'position' => $position,
                'item' => ['@id' => $schema['@id']],
            ];
            $position++;
        }

        if (empty($list_items)) {
            return null;
        }

        $list_id = $this->make_context_id('product-grid', $list_items);
        $schema = [
            '@context' => self::SCHEMA_CONTEXT,
            '@type' => 'ItemList',
            '@id' => $list_id,
            'itemListElement' => $list_items,
        ];

        return apply_filters('renderkit_schema_jsonld_product_grid', $schema, $attributes);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function build_product_archive_schema(): ?array {
        global $wp_query;
        if (!$wp_query || empty($wp_query->posts)) {
            return null;
        }

        $products = [];
        foreach ($wp_query->posts as $post) {
            if (!$post instanceof \WP_Post) {
                continue;
            }
            $products[] = $this->build_product_data_from_post($post);
        }

        if (empty($products)) {
            return null;
        }

        $list_items = [];
        $position = 1;
        foreach ($products as $product) {
            $schema = $this->build_product_schema_from_data($product);
            if (!$schema) {
                continue;
            }
            $this->add_schema($schema);
            $list_items[] = [
                '@type' => 'ListItem',
                'position' => $position,
                'item' => ['@id' => $schema['@id']],
            ];
            $position++;
        }

        if (empty($list_items)) {
            return null;
        }

        $list_id = $this->make_context_id('product-archive', $list_items);
        $schema = [
            '@context' => self::SCHEMA_CONTEXT,
            '@type' => 'ItemList',
            '@id' => $list_id,
            'itemListElement' => $list_items,
        ];

        return apply_filters('renderkit_schema_jsonld_product_archive', $schema, $products);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function build_product_schema_from_post_id(int $post_id): ?array {
        if ($post_id <= 0) {
            return null;
        }

        $post = get_post($post_id);
        if (!$post instanceof \WP_Post) {
            return null;
        }

        $data = $this->build_product_data_from_post($post);
        $data['description'] = $this->build_product_description($post);

        return apply_filters('renderkit_schema_jsonld_product', $this->build_product_schema_from_data($data), $post_id);
    }

    /**
     * @param array<string, mixed> $product
     * @return array<string, mixed>|null
     */
    private function build_product_schema_from_data(array $product): ?array {
        $url = (string) ($product['url'] ?? '');
        $name = $this->clean_text((string) ($product['title'] ?? ''));
        if ($url === '' || $name === '') {
            return null;
        }

        $description = $this->clean_text((string) ($product['description'] ?? $product['excerpt'] ?? ''));
        $sku = $this->clean_text((string) ($product['sku'] ?? ''));
        $image = $this->extract_image_url($product['image'] ?? null);
        $price = isset($product['price']) ? (float) $product['price'] : 0.0;
        $sale_price = isset($product['sale_price']) ? (float) $product['sale_price'] : 0.0;
        $stock_status = $this->clean_text((string) ($product['stock_status'] ?? 'instock'));

        $schema = [
            '@context' => self::SCHEMA_CONTEXT,
            '@type' => 'Product',
            '@id' => $this->make_product_id($url),
            'name' => $name,
            'description' => $description !== '' ? $description : null,
            'sku' => $sku !== '' ? $sku : null,
            'url' => $url,
            'image' => $image ? [$image] : null,
            'brand' => $this->build_brand_schema(),
        ];

        $final_price = $sale_price > 0 ? $sale_price : $price;
        if ($final_price > 0) {
            $schema['offers'] = [
                '@type' => 'Offer',
                'priceCurrency' => $this->get_currency_code(),
                'price' => $this->format_price($final_price),
                'availability' => $this->map_availability($stock_status),
                'url' => $url,
            ];
        }

        return $schema;
    }

    private function build_product_description(\WP_Post $post): string {
        $excerpt = (string) $post->post_excerpt;
        if ($excerpt !== '') {
            return $this->clean_text($excerpt);
        }

        $content = (string) get_post_field('post_content', $post->ID);
        return $this->clean_text($content);
    }

    /**
     * @return array<string, mixed>
     */
    private function build_product_data_from_post(\WP_Post $post): array {
        return [
            'id' => (int) $post->ID,
            'title' => (string) $post->post_title,
            'excerpt' => (string) $post->post_excerpt,
            'url' => (string) get_permalink($post),
            'price' => (float) get_post_meta($post->ID, '_rk_price', true),
            'sale_price' => (float) get_post_meta($post->ID, '_rk_sale_price', true),
            'sku' => (string) get_post_meta($post->ID, '_rk_sku', true),
            'stock_status' => (string) (get_post_meta($post->ID, '_rk_stock_status', true) ?: 'instock'),
            'image' => get_the_post_thumbnail_url($post->ID, 'full'),
        ];
    }

    private function build_brand_schema(): ?array {
        $brand = $this->clean_text((string) get_bloginfo('name'));
        if ($brand === '') {
            return null;
        }

        return [
            '@type' => 'Brand',
            'name' => $brand,
        ];
    }

    private function get_currency_code(): string {
        $currency = '';
        if (defined('RENDERKIT_CURRENCY')) {
            $currency = (string) RENDERKIT_CURRENCY;
        }
        if ($currency === '' && function_exists('get_woocommerce_currency')) {
            $currency = (string) get_woocommerce_currency();
        }
        if ($currency === '') {
            $currency = (string) get_option('woocommerce_currency');
        }
        if ($currency === '') {
            $currency = (string) get_option('renderkit_currency');
        }

        $currency = strtoupper(trim($currency));
        $currency = apply_filters('renderkit_schema_jsonld_currency', $currency);

        if ($currency === '') {
            $currency = 'EUR';
        }

        return $currency;
    }

    private function map_availability(string $status): string {
        $map = [
            'instock' => self::SCHEMA_CONTEXT . '/InStock',
            'outofstock' => self::SCHEMA_CONTEXT . '/OutOfStock',
            'onorder' => self::SCHEMA_CONTEXT . '/PreOrder',
        ];

        return $map[$status] ?? self::SCHEMA_CONTEXT . '/InStock';
    }

    private function format_price(float $value): string {
        return number_format($value, 2, '.', '');
    }

    /**
     * @param mixed $image
     */
    private function extract_image_url($image): string {
        if (is_string($image)) {
            return $image;
        }

        if (is_array($image)) {
            $url = $image['fullSrc'] ?? $image['src'] ?? $image['url'] ?? '';
            return is_string($url) ? $url : '';
        }

        return '';
    }

    /**
     * @param array<mixed> $seed
     */
    private function make_context_id(string $suffix, array $seed): string {
        $base = $this->current_url();
        if ($base === '') {
            return self::SCHEMA_CONTEXT . '/' . $suffix;
        }

        $hash = substr(md5(wp_json_encode($seed)), 0, 8);
        return $base . '#' . $suffix . '-' . $hash;
    }

    private function make_product_id(string $url): string {
        return rtrim($url, '/') . '#product';
    }

    private function current_url(): string {
        return (string) home_url(add_query_arg([]));
    }

    private function clean_text(string $value): string {
        $clean = trim(wp_strip_all_tags($value));
        if ($clean === '') {
            return '';
        }
        $clean = preg_replace('/\s+/', ' ', $clean);
        return is_string($clean) ? $clean : '';
    }

    /**
     * @param array<mixed> $value
     */
    private function is_list(array $value): bool {
        $count = count($value);
        if ($count === 0) {
            return true;
        }
        $expected = range(0, $count - 1);
        return $expected === array_keys($value);
    }
}
