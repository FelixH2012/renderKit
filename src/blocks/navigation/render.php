<?php
/**
 * Navigation Block - Server-Side Render
 * 
 * Premium rounded navigation with sticky option
 */

declare(strict_types=1);

if (!defined('ABSPATH')) exit;

// Get attributes
$menu_slug   = $attributes['menuSlug'] ?? 'renderkit-primary';
$show_logo   = $attributes['showLogo'] ?? true;
$logo_url    = $attributes['logoUrl'] ?? '';
$site_name   = !empty($attributes['siteName']) ? (string) $attributes['siteName'] : get_bloginfo('name');
$sticky      = $attributes['sticky'] ?? true;
$theme       = $attributes['theme'] ?? 'light';
$show_cart   = $attributes['showCart'] ?? false;

// Get menu items
$menu_items = [];
$locations = get_nav_menu_locations();

if (!empty($locations[$menu_slug])) {
    $menu = wp_get_nav_menu_object($locations[$menu_slug]);
    if ($menu) {
        $items = wp_get_nav_menu_items($menu->term_id);
        if ($items) {
            foreach ($items as $item) {
                if ($item->menu_item_parent == 0) {
                    $menu_items[] = [
                        'id'    => $item->ID,
                        'title' => $item->title,
                        'url'   => $item->url,
                    ];
                }
            }
        }
    }
}

// Build classes
$nav_classes = [
    'renderkit-block',
    'renderkit-nav',
    'renderkit-nav--' . $theme,
];

if ($sticky) {
    $nav_classes[] = 'is-sticky';
}

// Props for hydration
$props = array_merge($attributes, [
    'menuItems' => $menu_items,
    'siteName'  => $site_name,
]);

$wrapper = get_block_wrapper_attributes([
    'class' => implode(' ', $nav_classes),
    'data-renderkit-block' => 'navigation',
    'data-renderkit-props' => wp_json_encode($props),
]);
?>
<nav <?php echo $wrapper; ?>>
    <div class="renderkit-nav__shell">
        <div class="renderkit-nav__inner">
            <?php if ($show_logo): ?>
            <a href="<?php echo esc_url(home_url('/')); ?>" class="renderkit-nav__logo">
                <?php if ($logo_url): ?>
                <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr($site_name); ?>" class="renderkit-nav__logo-img" />
                <?php endif; ?>
                <span class="renderkit-nav__logo-text"><?php echo esc_html($site_name); ?></span>
            </a>
            <?php endif; ?>

            <div class="renderkit-nav__menu">
                <?php foreach ($menu_items as $item): ?>
                <a href="<?php echo esc_url($item['url']); ?>" class="renderkit-nav__link">
                    <?php echo esc_html($item['title']); ?>
                </a>
                <?php endforeach; ?>
            </div>

            <div class="renderkit-nav__actions">
                <?php if ($show_cart): ?>
                <button class="renderkit-nav__icon-button" type="button">
                    <i class="renderkit-nav__icon fa-solid fa-bag-shopping" aria-hidden="true"></i>
                    <span class="renderkit-nav__dot"></span>
                </button>
                <?php endif; ?>
            </div>
        </div>
    </div>
</nav>
