<?php
/**
 * Plugin Name: renderKit
 * Plugin URI: https://renderkit.dev
 * Description: Premium Gutenberg block system with React frontend rendering and Tailwind CSS styling. Build beautiful, interactive blocks with ease.
 * Version: 1.3.0
 * Author: renderKit Team
 * Author URI: https://renderkit.dev
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: renderkit
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 */

declare(strict_types=1);

namespace RenderKit;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('RENDERKIT_VERSION', '1.3.0');
define('RENDERKIT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('RENDERKIT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('RENDERKIT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Load dependencies
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-relay-settings.php';
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-renderkit.php';
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-block-loader.php';
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-relay-client.php';
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-products.php';
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-image-optimizer.php';

/**
 * Initialize the plugin
 */
function init(): void {
    $plugin = new RenderKit();
    $plugin->init();

    // Relay settings UI (admin)
    if (is_admin()) {
        $relay_settings = new RelaySettings();
        $relay_settings->init();
    }

    // Initialize Products CPT
    $products = new Products();
    $products->init();

    // Initialize Image Optimizer
    $optimizer = new ImageOptimizer();
    $optimizer->init();
}

add_action('plugins_loaded', __NAMESPACE__ . '\\init');

/**
 * Add Clear Cache button to admin bar
 */
function add_clear_cache_button(\WP_Admin_Bar $admin_bar): void {
    if (!current_user_can('manage_options')) {
        return;
    }

    $admin_bar->add_node([
        'id'    => 'renderkit-clear-cache',
        'title' => '<span class="ab-icon dashicons dashicons-trash" style="margin-top:2px;"></span> Cache leeren',
        'href'  => wp_nonce_url(admin_url('admin-post.php?action=rk_clear_cache'), 'rk_clear_cache'),
        'meta'  => [
            'title' => 'Alle Caches leeren (Browser, WordPress, OPcache)',
        ],
    ]);
}

add_action('admin_bar_menu', __NAMESPACE__ . '\\add_clear_cache_button', 100);

/**
 * Handle cache clear action
 */
function handle_clear_cache(): void {
    if (!current_user_can('manage_options')) {
        wp_die('Keine Berechtigung');
    }

    if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'rk_clear_cache')) {
        wp_die('Ungültige Anfrage');
    }

    $cleared = [];

    // Clear WordPress transients
    global $wpdb;
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_site_transient_%'");
    $cleared[] = 'WordPress Transients';

    // Clear object cache
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
        $cleared[] = 'Object Cache';
    }

    // Clear OPcache
    if (function_exists('opcache_reset')) {
        @opcache_reset();
        $cleared[] = 'OPcache';
    }

    // Clear popular cache plugins
    // WP Super Cache
    if (function_exists('wp_cache_clear_cache')) {
        wp_cache_clear_cache();
        $cleared[] = 'WP Super Cache';
    }

    // W3 Total Cache
    if (function_exists('w3tc_flush_all')) {
        w3tc_flush_all();
        $cleared[] = 'W3 Total Cache';
    }

    // LiteSpeed Cache
    if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
        \LiteSpeed_Cache_API::purge_all();
        $cleared[] = 'LiteSpeed Cache';
    }

    // WP Fastest Cache
    if (function_exists('wpfc_clear_all_cache')) {
        wpfc_clear_all_cache(true);
        $cleared[] = 'WP Fastest Cache';
    }

    // Autoptimize
    if (class_exists('autoptimizeCache') && method_exists('autoptimizeCache', 'clearall')) {
        \autoptimizeCache::clearall();
        $cleared[] = 'Autoptimize';
    }

    // Store message for admin notice
    set_transient('rk_cache_cleared', implode(', ', $cleared), 30);

    // Redirect back
    wp_safe_redirect(wp_get_referer() ?: admin_url());
    exit;
}

add_action('admin_post_rk_clear_cache', __NAMESPACE__ . '\\handle_clear_cache');

/**
 * Show cache cleared notice
 */
function show_cache_cleared_notice(): void {
    $cleared = get_transient('rk_cache_cleared');
    if (!$cleared) {
        return;
    }
    delete_transient('rk_cache_cleared');
    ?>
    <div class="notice notice-success is-dismissible" style="border-left-color: #B8975A;">
        <p>
            <strong style="color: #B8975A;">🧹 RenderKit:</strong>
            Cache erfolgreich geleert! (<?php echo esc_html($cleared); ?>)
        </p>
    </div>
    <?php
}

add_action('admin_notices', __NAMESPACE__ . '\\show_cache_cleared_notice');

/**
 * Register navigation menu locations
 */
function register_menus(): void {
    register_nav_menus([
        'renderkit-primary'   => __('RenderKit Primary Menu', 'renderkit'),
        'renderkit-secondary' => __('RenderKit Secondary Menu', 'renderkit'),
        'renderkit-footer'    => __('RenderKit Footer Menu', 'renderkit'),
    ]);
}

add_action('after_setup_theme', __NAMESPACE__ . '\\register_menus');

/**
 * Add theme-color meta tags for iOS Safari
 * This controls the color of the rubber-band overscroll area
 */
function add_theme_color_meta(): void {
    // Only on frontend
    if (is_admin()) return;
    
    // Light mode (cream) and dark mode support
    ?>
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#FFFEF9" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#FFFEF9">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <?php
}

add_action('wp_head', __NAMESPACE__ . '\\add_theme_color_meta', 1);

/**
 * Add font preload and font-display:swap for performance
 */
function add_font_optimizations(): void {
    if (is_admin()) return;
    ?>
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <style>
        /* Font display optimization */
        @font-face {
            font-family: 'Cormorant Garamond';
            font-display: swap;
        }
        @font-face {
            font-family: 'DM Sans';
            font-display: swap;
        }
        @font-face {
            font-family: 'Manrope';
            font-display: swap;
        }
    </style>
    <?php
}

add_action('wp_head', __NAMESPACE__ . '\\add_font_optimizations', 2);

/**
 * Add custom styling to the plugins page
 */
function plugins_page_styles(): void {
    $screen = get_current_screen();
    if ($screen && $screen->id === 'plugins') {
        $logo_url = RENDERKIT_PLUGIN_URL . 'resources/renderKitLogo.png';
        ?>
        <style>
            tr[data-plugin="renderkit/renderkit.php"] .plugin-title strong {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            tr[data-plugin="renderkit/renderkit.php"] .plugin-title strong::before {
                content: '';
                display: inline-block;
                width: 24px;
                height: 24px;
                background: url('<?php echo esc_url($logo_url); ?>') no-repeat center;
                background-size: contain;
            }
            tr[data-plugin="renderkit/renderkit.php"] {
                background: linear-gradient(135deg, rgba(184, 151, 90, 0.03) 0%, transparent 100%);
            }
            tr[data-plugin="renderkit/renderkit.php"]:hover {
                background: linear-gradient(135deg, rgba(184, 151, 90, 0.08) 0%, transparent 100%);
            }
        </style>
        <?php
    }
}

add_action('admin_head', __NAMESPACE__ . '\\plugins_page_styles');

/**
 * Add action links on the plugins page
 */
function plugin_action_links(array $links): array {
    $changelog_url = add_query_arg([
        'tab' => 'plugin-information',
        'plugin' => 'renderkit',
        'section' => 'changelog',
        'TB_iframe' => 'true',
        'width' => '772',
        'height' => '840',
    ], admin_url('plugin-install.php'));

    $custom_links = [
        '<a href="' . admin_url('edit.php?post_type=page') . '">' . __('Add Block', 'renderkit') . '</a>',
        '<a href="' . admin_url('options-general.php?page=renderkit-relay') . '">' . __('Relay Settings', 'renderkit') . '</a>',
        '<a href="' . esc_url($changelog_url) . '" class="thickbox open-plugin-details-modal">' . __('Changelog', 'renderkit') . '</a>',
    ];
    return array_merge($custom_links, $links);
}

add_filter('plugin_action_links_' . RENDERKIT_PLUGIN_BASENAME, __NAMESPACE__ . '\\plugin_action_links');

/**
 * Inject changelog into plugin information modal
 */
function plugin_information(object|false $result, string $action, object $args): object|false {
    if ($action !== 'plugin_information' || ($args->slug ?? '') !== 'renderkit') {
        return $result;
    }

    // Parse readme.txt for Changelog
    $readme_file = RENDERKIT_PLUGIN_DIR . 'readme.txt';
    $readme = file_exists($readme_file) ? file_get_contents($readme_file) : '';
    
    $changelog_content = '';
    if (preg_match('/== Changelog ==(.*?)(?:$|==)/s', $readme, $matches)) {
        $changelog_content = trim($matches[1]);
    }

    // Convert readme format to HTML
    // 1. Version headers: = 1.0.0 =
    $changelog_html = preg_replace('/^= (.+?) =/m', '<h4>$1</h4>', $changelog_content);
    
    // 2. List items: * Item
    // We need to wrap adjacent li items in ul. A simple way for this context:
    $changelog_html = preg_replace('/^\* (.+)/m', '<li>$1</li>', $changelog_html);
    
    // 3. Bold text: **Text**
    $changelog_html = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $changelog_html);
    
    // 4. Line breaks aren't needed for <li> structure mostly, but helps with spacing
    // We want to wrap log items in <ul> per version block. 
    // Quick hack: just output list items. But better to make it nicer.
    
    // Improve formatting: Wrap lists in UL
    // Find blocks of <li>...</li> and wrap them
    $changelog_html = preg_replace_callback('/(<li>.*?<\/li>\s*)+/s', function($m) {
        return '<ul style="list-style-type: disc; margin-left: 20px;">' . $m[0] . '</ul>';
    }, $changelog_html);

    // Filter empty lines
    $changelog_html = preg_replace('/\n\s*\n/', "\n", $changelog_html);

    return (object) [
        'name' => 'renderKit',
        'slug' => 'renderkit',
        'version' => RENDERKIT_VERSION,
        'author' => '<a href="https://renderkit.dev">renderKit Team</a>',
        'requires' => '6.0',
        'tested' => '6.4',
        'requires_php' => '8.0',
        'sections' => [
            'description' => 'Premium Gutenberg block system with React frontend rendering and Tailwind CSS styling.',
            'changelog' => '<div style="padding:20px;">' . $changelog_html . '</div>',
        ],
        'banners' => [],
    ];
}

add_filter('plugins_api', __NAMESPACE__ . '\\plugin_information', 10, 3);

/**
 * Add row meta on the plugins page
 */
function plugin_row_meta(array $links, string $file): array {
    if ($file === RENDERKIT_PLUGIN_BASENAME) {
        $links[] = '<span style="color: #B8975A;">v' . RENDERKIT_VERSION . '</span>';
    }
    return $links;
}

add_filter('plugin_row_meta', __NAMESPACE__ . '\\plugin_row_meta', 10, 2);

/**
 * Activation hook
 */
function activate(): void {
    flush_rewrite_rules();
}

register_activation_hook(__FILE__, __NAMESPACE__ . '\\activate');

/**
 * Deactivation hook
 */
function deactivate(): void {
    flush_rewrite_rules();
}

register_deactivation_hook(__FILE__, __NAMESPACE__ . '\\deactivate');
