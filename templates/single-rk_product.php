<?php
/**
 * RenderKit: Single Product Template
 *
 * Renders product pages without the active theme's header/navigation.
 *
 * @package RenderKit
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

use RenderKit\Products;
use RenderKit\RelayClient;
use RenderKit\RelaySettings;

/**
 * Build menu items from a theme menu location.
 *
 * @return array<int, array{id:int,title:string,url:string}>
 */
function rk_renderkit_menu_items(string $menu_slug): array {
    $items_out = [];
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
                    $items_out[] = [
                        'id' => (int) $item->ID,
                        'title' => (string) $item->title,
                        'url' => (string) $item->url,
                    ];
                }
            }
        }
    }

    return $items_out;
}

/**
 * Build an image payload for Relay (src + responsive metadata).
 *
 * @return array{id:int,src:string,fullSrc:string,alt:string,width?:int,height?:int,srcSet?:string,sizes?:string}
 */
function rk_renderkit_image_payload(int $image_id, string $size, string $full_size = 'full'): array {
    $src = '';
    $width = null;
    $height = null;

    $image_src = wp_get_attachment_image_src($image_id, $size);
    if (is_array($image_src)) {
        $src = (string) ($image_src[0] ?? '');
        $width = isset($image_src[1]) ? (int) $image_src[1] : null;
        $height = isset($image_src[2]) ? (int) $image_src[2] : null;
    }

    $srcset = wp_get_attachment_image_srcset($image_id, $size);
    $sizes = wp_get_attachment_image_sizes($image_id, $size);
    $alt = (string) get_post_meta($image_id, '_wp_attachment_image_alt', true);
    $full_src = (string) wp_get_attachment_image_url($image_id, $full_size);

    return array_filter([
        'id' => $image_id,
        'src' => $src,
        'fullSrc' => $full_src,
        'alt' => $alt,
        'width' => $width,
        'height' => $height,
        'srcSet' => is_string($srcset) ? $srcset : '',
        'sizes' => is_string($sizes) ? $sizes : '',
    ], static fn($value) => $value !== null);
}

// For <head> metadata (don't advance the loop).
$rk_product_id = (int) get_queried_object_id();
$rk_title = $rk_product_id > 0 ? (string) get_the_title($rk_product_id) : '';
$rk_excerpt = $rk_product_id > 0 ? (string) get_the_excerpt($rk_product_id) : '';
$rk_price = $rk_product_id > 0 ? (float) get_post_meta($rk_product_id, '_rk_price', true) : 0.0;
$rk_sale_price = $rk_product_id > 0 ? (float) get_post_meta($rk_product_id, '_rk_sale_price', true) : 0.0;
$rk_sku = $rk_product_id > 0 ? (string) get_post_meta($rk_product_id, '_rk_sku', true) : '';
$rk_stock_status = $rk_product_id > 0 ? (string) get_post_meta($rk_product_id, '_rk_stock_status', true) : 'instock';
$rk_featured_image_id = $rk_product_id > 0 ? (int) get_post_thumbnail_id($rk_product_id) : 0;

// Relay-driven product page content.
$rk_post = $rk_product_id > 0 ? get_post($rk_product_id) : null;
$rk_content_html = '';
$rk_has_renderkit_blocks = false;

if ($rk_post instanceof WP_Post) {
    setup_postdata($rk_post);
    $rk_raw_content = (string) $rk_post->post_content;
    $rk_content_html = (string) apply_filters('the_content', $rk_raw_content);
    $rk_has_renderkit_blocks = strpos($rk_raw_content, '<!-- wp:renderkit/') !== false;
    wp_reset_postdata();
}

$rk_site_name = (string) get_bloginfo('name');
$rk_logo_id = (int) get_theme_mod('custom_logo');
$rk_logo_url = $rk_logo_id > 0 ? (string) wp_get_attachment_image_url($rk_logo_id, 'full') : '';

$rk_navigation_attrs = [
    'menuSlug' => 'renderkit-primary',
    'showLogo' => true,
    'logoUrl' => $rk_logo_url,
    'siteName' => $rk_site_name,
    'sticky' => true,
    'theme' => 'light',
    'showCart' => false,
    'menuItems' => rk_renderkit_menu_items('renderkit-primary'),
    'currentUrl' => home_url(add_query_arg([])),
];

$rk_footer_attrs = [
    'menuSlug' => 'renderkit-footer',
    'showLogo' => true,
    'logoUrl' => $rk_logo_url,
    'siteName' => $rk_site_name,
    'tagline' => __('Handgemacht. Minimal. Zeitlos.', 'renderkit'),
    'theme' => 'dark',
    'menuItems' => rk_renderkit_menu_items('renderkit-footer'),
];

$rk_hero_attrs = [
    'heading' => $rk_title,
    'description' => $rk_excerpt,
    'buttonText' => '',
    'buttonUrl' => '#',
    'theme' => 'dark',
    'variant' => 'minimal',
    'enableAnimations' => true,
];

$rk_price_formatted = $rk_price > 0 ? (string) number_format_i18n($rk_price, 2) : '';
$rk_sale_price_formatted = $rk_sale_price > 0 ? (string) number_format_i18n($rk_sale_price, 2) : '';

$rk_featured_image = null;
if ($rk_featured_image_id > 0) {
    $rk_featured_image = rk_renderkit_image_payload($rk_featured_image_id, 'rk-product-hero');
}

$rk_gallery_ids = get_post_meta($rk_product_id, '_rk_gallery', true);
if (!is_array($rk_gallery_ids)) {
    $rk_gallery_ids = [];
}
$rk_gallery_ids = array_values(array_unique(array_filter(array_map('intval', $rk_gallery_ids))));
if ($rk_featured_image_id > 0 && !in_array($rk_featured_image_id, $rk_gallery_ids, true)) {
    array_unshift($rk_gallery_ids, $rk_featured_image_id);
}

$rk_gallery = [];
foreach ($rk_gallery_ids as $image_id) {
    if ($image_id <= 0) {
        continue;
    }
    $payload = rk_renderkit_image_payload($image_id, 'rk-product-thumb');
    if (($payload['src'] ?? '') === '') {
        continue;
    }
    $rk_gallery[] = $payload;
}

$rk_stock_labels = [
    'instock' => __('In stock', 'renderkit'),
    'outofstock' => __('Out of stock', 'renderkit'),
    'onorder' => __('On order', 'renderkit'),
];
$rk_stock_label = $rk_stock_labels[$rk_stock_status] ?? $rk_stock_status;

$rk_product_attrs = [
    'id' => $rk_product_id,
    'title' => $rk_title,
    'excerpt' => $rk_excerpt,
    'archiveUrl' => (string) (get_post_type_archive_link(Products::POST_TYPE) ?: ''),
    'sku' => $rk_sku,
    'stockStatus' => $rk_stock_status,
    'stockLabel' => $rk_stock_label,
    'price' => $rk_price,
    'salePrice' => $rk_sale_price,
    'priceFormatted' => $rk_price_formatted,
    'salePriceFormatted' => $rk_sale_price_formatted,
    'featuredImage' => $rk_featured_image,
    'gallery' => $rk_gallery,
    'hasRenderkitBlocks' => $rk_has_renderkit_blocks,
];

$rk_labels = [
    'backToProducts' => __('Back to products', 'renderkit'),
    'sku' => __('SKU', 'renderkit'),
    'availability' => __('Availability', 'renderkit'),
    'readDescription' => __('Zum Produkt', 'renderkit'),
    'priceOnRequest' => __('Price on request', 'renderkit'),
    'gallery' => __('Product gallery', 'renderkit'),
    'relatedHeading' => __('Weitere Produkte', 'renderkit'),
];

$rk_related_raw = Products::get_products([
    'posts_per_page' => 6,
    'post__not_in' => [$rk_product_id],
]);

$rk_related_products = array_map(function ($product) {
    $price = isset($product['price']) ? (float) $product['price'] : 0;
    $sale_price = isset($product['sale_price']) ? (float) $product['sale_price'] : 0;

    return [
        'id' => (int) ($product['id'] ?? 0),
        'title' => (string) ($product['title'] ?? ''),
        'excerpt' => (string) ($product['excerpt'] ?? ''),
        'url' => (string) ($product['url'] ?? ''),
        'image' => (string) ($product['image'] ?? ''),
        'price' => $price,
        'salePrice' => $sale_price,
        'priceFormatted' => $price > 0 ? number_format($price, 2, ',', '.') : '',
        'salePriceFormatted' => $sale_price > 0 ? number_format($sale_price, 2, ',', '.') : '',
    ];
}, $rk_related_raw);

$rk_relay_settings = class_exists(RelaySettings::class)
    ? RelaySettings::get_effective_settings()
    : ['url' => 'http://127.0.0.1:8787', 'secret' => '', 'timeout' => 1.5];

$rk_relay = new RelayClient([
    'url' => (string) ($rk_relay_settings['url'] ?? ''),
    'secret' => (string) ($rk_relay_settings['secret'] ?? ''),
    'timeout' => (float) ($rk_relay_settings['timeout'] ?? 1.5),
]);

$rk_page_props = [
    'attributes' => [
        'navigation' => $rk_navigation_attrs,
        'hero' => $rk_hero_attrs,
        'footer' => $rk_footer_attrs,
        'product' => $rk_product_attrs,
        'labels' => $rk_labels,
        'relatedProducts' => $rk_related_products,
    ],
    'content' => $rk_content_html,
];

$rk_page_html = $rk_relay->render('renderkit/product-page', $rk_page_props);

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class('rk-product-template'); ?>>
<?php wp_body_open(); ?>

<?php
if ($rk_page_html !== '') {
    echo $rk_page_html;
} elseif (current_user_can('manage_options')) {
    echo '<!-- renderKit-Relay: render failed for renderkit/product-page -->';
}
?>

<?php wp_footer(); ?>
</body>
</html>
