<?php
/**
 * RenderKit: Product Archive Template
 *
 * Renders product archive pages without the active theme's header/navigation.
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
    'heading' => __('Handgefertigte Kerzen fuer ruhige Abende', 'renderkit'),
    'description' => __('Entdecke reduzierte Formen, sanfte Dufte und Materialien, die lange nachklingen. Unsere Kollektion vereint klare Linien mit ehrlicher Handarbeit.', 'renderkit'),
    'buttonText' => '',
    'buttonUrl' => '#',
    'theme' => 'light',
    'variant' => 'minimal',
    'enableAnimations' => true,
];

$rk_heading = (string) post_type_archive_title('', false);
if ($rk_heading === '') {
    $rk_heading = __('Produkte', 'renderkit');
}

$rk_intro = __('Unsere Auswahl handgefertigter Lieblingsstuecke.', 'renderkit');

$paged = max(1, (int) get_query_var('paged'));
$query = new WP_Query([
    'post_type' => Products::POST_TYPE,
    'post_status' => 'publish',
    'posts_per_page' => 12,
    'paged' => $paged,
]);

$rk_products = [];
foreach ($query->posts as $post) {
    if (!$post instanceof WP_Post) {
        continue;
    }
    $image_id = (int) get_post_thumbnail_id($post->ID);
    $image = null;
    if ($image_id > 0) {
        $image = rk_renderkit_image_payload($image_id, 'rk-product-thumb');
    }

    $price = (float) get_post_meta($post->ID, '_rk_price', true);
    $sale_price = (float) get_post_meta($post->ID, '_rk_sale_price', true);

    $rk_products[] = [
        'id' => (int) $post->ID,
        'title' => (string) $post->post_title,
        'excerpt' => (string) $post->post_excerpt,
        'url' => (string) get_permalink($post->ID),
        'image' => $image,
        'price' => $price,
        'salePrice' => $sale_price,
        'priceFormatted' => $price > 0 ? (string) number_format_i18n($price, 2) : '',
        'salePriceFormatted' => $sale_price > 0 ? (string) number_format_i18n($sale_price, 2) : '',
    ];
}

$total_pages = max(1, (int) $query->max_num_pages);
$pagination_links = [];
if ($total_pages > 1) {
    for ($i = 1; $i <= $total_pages; $i++) {
        $pagination_links[] = [
            'label' => (string) $i,
            'url' => (string) get_pagenum_link($i),
            'isCurrent' => $i === $paged,
        ];
    }
}

$rk_labels = [
    'heading' => $rk_heading,
    'intro' => $rk_intro,
    'priceOnRequest' => __('Price on request', 'renderkit'),
    'pagination' => __('Seite', 'renderkit'),
];

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
        'labels' => $rk_labels,
        'products' => $rk_products,
        'pagination' => [
            'current' => $paged,
            'total' => $total_pages,
            'links' => $pagination_links,
        ],
    ],
    'content' => '',
];

$rk_page_html = $rk_relay->render('renderkit/product-archive', $rk_page_props);

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class('rk-product-archive-template'); ?>>
<?php wp_body_open(); ?>

<?php
if ($rk_page_html !== '') {
    echo $rk_page_html;
} elseif (current_user_can('manage_options')) {
    echo '<!-- renderKit-Relay: render failed for renderkit/product-archive -->';
}
?>

<?php wp_footer(); ?>
</body>
</html>
