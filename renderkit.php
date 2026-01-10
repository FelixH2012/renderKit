<?php
/**
 * Plugin Name: renderKit
 * Plugin URI: https://renderkit.dev
 * Description: Premium Gutenberg block system with React frontend rendering and Tailwind CSS styling. Build beautiful, interactive blocks with ease.
 * Version: 1.1.0
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
define('RENDERKIT_VERSION', '1.1.0');
define('RENDERKIT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('RENDERKIT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('RENDERKIT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Load dependencies
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-renderkit.php';
require_once RENDERKIT_PLUGIN_DIR . 'includes/class-block-loader.php';

/**
 * Initialize the plugin
 */
function init(): void {
    $plugin = new RenderKit();
    $plugin->init();
}

add_action('plugins_loaded', __NAMESPACE__ . '\\init');

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

    // Create a fake plugin info object
    $changelog_file = RENDERKIT_PLUGIN_DIR . 'CHANGELOG.md';
    $changelog = file_exists($changelog_file) ? file_get_contents($changelog_file) : '';
    
    // Convert markdown to HTML (basic conversion)
    $changelog_html = preg_replace('/^## \[(.+?)\]/m', '<h4>$1</h4>', $changelog);
    $changelog_html = preg_replace('/^### (.+)/m', '<h5>$1</h5>', $changelog_html);
    $changelog_html = preg_replace('/^- (.+)/m', '<li>$1</li>', $changelog_html);
    $changelog_html = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $changelog_html);
    $changelog_html = nl2br($changelog_html);

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
