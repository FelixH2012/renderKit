<?php
/**
 * Main Plugin Class
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Main plugin orchestrator class
 */
class RenderKit {

    /**
     * Block Loader instance
     *
     * @var BlockLoader
     */
    private BlockLoader $block_loader;

    /**
     * Plugin configuration
     *
     * @var array<string, mixed>
     */
    private array $config;

    /**
     * Constructor
     */
    public function __construct() {
        $this->config = $this->get_default_config();
        $this->block_loader = new BlockLoader($this->config);
    }

    /**
     * Get default plugin configuration
     *
     * @return array<string, mixed>
     */
    private function get_default_config(): array {
        $relay = class_exists(__NAMESPACE__ . '\\RelaySettings')
            ? RelaySettings::get_effective_settings()
            : [
                'url'     => defined('RENDERKIT_RELAY_URL') ? (string) RENDERKIT_RELAY_URL : 'http://127.0.0.1:8787',
                'secret'  => defined('RENDERKIT_RELAY_SECRET') ? (string) RENDERKIT_RELAY_SECRET : '',
                'timeout' => defined('RENDERKIT_RELAY_TIMEOUT') ? (float) RENDERKIT_RELAY_TIMEOUT : 1.5,
                'syncEnv' => 0,
            ];

        return [
            'namespace'      => 'renderkit',
            'text_domain'    => 'renderkit',
            'category'       => 'renderkit',
            'category_title' => __('RenderKit', 'renderkit'),
            'category_icon'  => 'layout',
            'blocks_dir'     => RENDERKIT_PLUGIN_DIR . 'src/blocks',
            'build_dir'      => RENDERKIT_PLUGIN_DIR . 'build',
            'build_url'      => RENDERKIT_PLUGIN_URL . 'build',
            'version'        => RENDERKIT_VERSION,
            'relay'          => [
                'url'     => (string) ($relay['url'] ?? 'http://127.0.0.1:8787'),
                'secret'  => (string) ($relay['secret'] ?? ''),
                'timeout' => (float) ($relay['timeout'] ?? 1.5),
            ],
            'assets'         => [
                'editor' => [
                    'js'       => 'editor.js',
                    'css'      => 'style.css',
                    'handle'   => 'renderkit-editor',
                    'deps_js'  => ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-data', 'wp-core-data'],
                    'deps_css' => [],
                ],
                'view' => [
                    'js'       => 'view.js',
                    'css'      => 'style.css',
                    'handle'   => 'renderkit-view',
                    'deps_js'  => [],
                    'deps_css' => [],
                ],
            ],
        ];
    }

    /**
     * Initialize the plugin
     */
    public function init(): void {
        // Register block category
        add_filter('block_categories_all', [$this, 'register_block_category'], 10, 2);

        // Initialize block loader
        $this->block_loader->init();

        // Register assets
        add_action('init', [$this, 'register_assets']);

        // Enqueue editor assets
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_assets']);

        // Enqueue frontend assets (only when blocks are present)
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
    }

    /**
     * Register custom block category
     *
     * @param array<int, array<string, mixed>> $categories Block categories.
     * @return array<int, array<string, mixed>>
     */
    public function register_block_category(array $categories): array {
        return array_merge(
            [
                [
                    'slug'  => $this->config['category'],
                    'title' => $this->config['category_title'],
                    'icon'  => $this->config['category_icon'],
                ],
            ],
            $categories
        );
    }

    /**
     * Register all plugin assets
     */
    public function register_assets(): void {
        $build_url = $this->config['build_url'];
        $build_dir = $this->config['build_dir'];
        $version   = $this->config['version'];

        // Register editor script
        $editor_config = $this->config['assets']['editor'];
        $editor_js_path = $build_dir . '/' . $editor_config['js'];
        
        if (file_exists($editor_js_path)) {
            wp_register_script(
                $editor_config['handle'],
                $build_url . '/' . $editor_config['js'],
                $editor_config['deps_js'],
                $version,
                true
            );
        }

        // Register frontend script
        $view_config = $this->config['assets']['view'];
        $view_js_path = $build_dir . '/' . $view_config['js'];
        
        if (file_exists($view_js_path)) {
            wp_register_script(
                $view_config['handle'],
                $build_url . '/' . $view_config['js'],
                $view_config['deps_js'],
                $version,
                true
            );
        }

        // Register styles
        $css_path = $build_dir . '/' . $editor_config['css'];
        
        if (file_exists($css_path)) {
            wp_register_style(
                $this->config['namespace'] . '-style',
                $build_url . '/' . $editor_config['css'],
                [],
                $version
            );
        }
    }

    /**
     * Enqueue editor assets
     */
    public function enqueue_editor_assets(): void {
        $editor_handle = $this->config['assets']['editor']['handle'];
        
        if (wp_script_is($editor_handle, 'registered')) {
            wp_enqueue_script($editor_handle);
        }

        $style_handle = $this->config['namespace'] . '-style';
        
        if (wp_style_is($style_handle, 'registered')) {
            wp_enqueue_style($style_handle);
        }

        // Localize script data
        wp_localize_script($editor_handle, 'renderKitData', [
            'pluginUrl' => RENDERKIT_PLUGIN_URL,
            'version'   => $this->config['version'],
            'namespace' => $this->config['namespace'],
        ]);
    }

    /**
     * Enqueue frontend assets when blocks are present
     */
    public function enqueue_frontend_assets(): void {
        $view_handle = $this->config['assets']['view']['handle'];
        
        if (wp_script_is($view_handle, 'registered')) {
            wp_enqueue_script($view_handle);
        }

        $style_handle = $this->config['namespace'] . '-style';
        
        if (wp_style_is($style_handle, 'registered')) {
            wp_enqueue_style($style_handle);
        }
    }

    /**
     * Check if current content has renderKit blocks
     *
     * @return bool
     */
    private function has_renderkit_blocks(): bool {
        if (!is_singular()) {
            return false;
        }

        $post = get_post();
        
        if (!$post instanceof \WP_Post) {
            return false;
        }

        $blocks = $this->block_loader->get_registered_block_names();
        
        foreach ($blocks as $block_name) {
            if (has_block($block_name, $post)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get plugin configuration
     *
     * @return array<string, mixed>
     */
    public function get_config(): array {
        return $this->config;
    }
}
