<?php
/**
 * Navigation Block - Server-Side Render Template
 */

declare(strict_types=1);

if (!defined('ABSPATH')) exit;

// Get attributes
$menu_id = $attributes['menuId'] ?? 0;
$show_logo = $attributes['showLogo'] ?? true;
$logo_url = $attributes['logoUrl'] ?? '';
$site_name = $attributes['siteName'] ?? get_bloginfo('name');
$sticky = $attributes['sticky'] ?? true;
$show_cart = $attributes['showCart'] ?? true;

// Colors
$text_color = '#1A1816';
$text_muted = 'rgba(26, 24, 22, 0.6)';
$accent_color = '#B8975A';

// Get menu items
$menu_items = [];
if ($menu_id) {
    $items = wp_get_nav_menu_items($menu_id);
    if ($items) {
        foreach ($items as $item) {
            if ($item->menu_item_parent == 0) {
                $menu_items[] = [
                    'id' => $item->ID,
                    'title' => $item->title,
                    'url' => $item->url,
                ];
            }
        }
    }
}

// Prepare props for React hydration
$props = array_merge($attributes, [
    'menuItems' => $menu_items,
    'siteName' => $site_name,
]);

$wrapper = get_block_wrapper_attributes([
    'class' => 'renderkit-block renderkit-nav',
    'data-renderkit-block' => 'navigation',
    'data-renderkit-props' => wp_json_encode($props),
]);

$sticky_style = $sticky ? 'position:fixed;top:0;left:0;right:0;z-index:50;' : 'position:relative;';
?>
<nav <?php echo $wrapper; ?> style="<?php echo $sticky_style; ?>background-color:rgba(255,254,249,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
    <div style="max-width:1600px;margin:0 auto;padding:1.5rem 2rem;display:flex;align-items:center;justify-content:space-between;">
        <?php if ($show_logo): ?>
        <a href="<?php echo esc_url(home_url('/')); ?>" style="display:flex;align-items:center;gap:0.75rem;text-decoration:none;">
            <?php if ($logo_url): ?>
            <img src="<?php echo esc_url($logo_url); ?>" alt="<?php echo esc_attr($site_name); ?>" style="height:2rem;width:auto;" />
            <?php endif; ?>
            <span style="font-size:0.875rem;letter-spacing:0.3em;text-transform:uppercase;color:<?php echo $text_color; ?>;font-weight:500;">
                <?php echo esc_html($site_name); ?>
            </span>
        </a>
        <?php endif; ?>

        <div style="display:flex;gap:3rem;align-items:center;">
            <?php foreach ($menu_items as $item): ?>
            <a href="<?php echo esc_url($item['url']); ?>" 
               style="font-size:0.875rem;letter-spacing:0.1em;text-transform:uppercase;color:<?php echo $text_muted; ?>;text-decoration:none;transition:color 0.5s ease;">
                <?php echo esc_html($item['title']); ?>
            </a>
            <?php endforeach; ?>
        </div>

        <div style="display:flex;align-items:center;gap:1rem;">
            <?php if ($show_cart): ?>
            <button style="position:relative;background:none;border:none;cursor:pointer;padding:0.5rem;">
                <svg style="width:1.25rem;height:1.25rem;color:<?php echo $text_color; ?>;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M6 2 L3 6 v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
            </button>
            <?php endif; ?>
        </div>
    </div>
</nav>
