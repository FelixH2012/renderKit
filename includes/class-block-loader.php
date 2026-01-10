<?php
/**
 * Block Loader Class
 *
 * Handles auto-discovery and registration of Gutenberg blocks
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Block Loader - Auto-discovers and registers blocks
 */
class BlockLoader {

    /**
     * Plugin configuration
     *
     * @var array<string, mixed>
     */
    private array $config;

    /**
     * Registered block names
     *
     * @var array<string>
     */
    private array $registered_blocks = [];

    /**
     * Constructor
     *
     * @param array<string, mixed> $config Plugin configuration.
     */
    public function __construct(array $config) {
        $this->config = $config;
    }

    /**
     * Initialize block loader
     */
    public function init(): void {
        add_action('init', [$this, 'discover_and_register_blocks'], 20);
    }

    /**
     * Discover and register all blocks
     */
    public function discover_and_register_blocks(): void {
        $blocks_dir = $this->config['blocks_dir'];

        if (!is_dir($blocks_dir)) {
            return;
        }

        $block_dirs = glob($blocks_dir . '/*/block.json');

        if (empty($block_dirs)) {
            return;
        }

        foreach ($block_dirs as $block_json_path) {
            $this->register_block($block_json_path);
        }
    }

    /**
     * Register a single block from its block.json file
     *
     * @param string $block_json_path Path to block.json file.
     */
    private function register_block(string $block_json_path): void {
        $block_dir = dirname($block_json_path);
        $block_data = $this->read_block_json($block_json_path);

        if (empty($block_data)) {
            return;
        }

        $block_name = $block_data['name'] ?? '';

        if (empty($block_name)) {
            return;
        }

        // Build registration arguments
        $args = $this->build_registration_args($block_dir, $block_data);

        // Register the block
        $result = register_block_type($block_json_path, $args);

        if ($result !== false) {
            $this->registered_blocks[] = $block_name;
        }
    }

    /**
     * Read and parse block.json file
     *
     * @param string $path Path to block.json.
     * @return array<string, mixed>
     */
    private function read_block_json(string $path): array {
        if (!file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);

        if ($content === false) {
            return [];
        }

        $data = json_decode($content, true);

        if (!is_array($data)) {
            return [];
        }

        return $data;
    }

    /**
     * Build block registration arguments
     *
     * @param string               $block_dir  Block directory path.
     * @param array<string, mixed> $block_data Block JSON data.
     * @return array<string, mixed>
     */
    private function build_registration_args(string $block_dir, array $block_data): array {
        $args = [];

        // Check for render.php for server-side rendering
        $render_file = $block_dir . '/render.php';

        if (file_exists($render_file)) {
            $args['render_callback'] = function (array $attributes, string $content, \WP_Block $block) use ($render_file, $block_data): string {
                return $this->render_block($render_file, $attributes, $content, $block, $block_data);
            };
        }

        return $args;
    }

    /**
     * Render a block using its render.php file
     *
     * @param string                $render_file Path to render.php.
     * @param array<string, mixed>  $attributes  Block attributes.
     * @param string                $content     Block content.
     * @param \WP_Block             $block       Block instance.
     * @param array<string, mixed>  $block_data  Block JSON data.
     * @return string
     */
    private function render_block(
        string $render_file,
        array $attributes,
        string $content,
        \WP_Block $block,
        array $block_data
    ): string {
        // Merge with default attributes from block.json
        $defaults = $this->get_attribute_defaults($block_data);
        $attributes = array_merge($defaults, $attributes);

        // Start output buffering
        ob_start();

        // Make variables available to the template
        // Using extract is intentional here for template variable scope
        $template_vars = [
            'attributes' => $attributes,
            'content'    => $content,
            'block'      => $block,
            'block_data' => $block_data,
            'config'     => $this->config,
        ];

        // phpcs:ignore WordPress.PHP.DontExtract.extract_extract
        extract($template_vars);

        include $render_file;

        return ob_get_clean() ?: '';
    }

    /**
     * Get default attribute values from block.json
     *
     * @param array<string, mixed> $block_data Block JSON data.
     * @return array<string, mixed>
     */
    private function get_attribute_defaults(array $block_data): array {
        $defaults = [];
        $attributes = $block_data['attributes'] ?? [];

        foreach ($attributes as $name => $schema) {
            if (isset($schema['default'])) {
                $defaults[$name] = $schema['default'];
            }
        }

        return $defaults;
    }

    /**
     * Get list of registered block names
     *
     * @return array<string>
     */
    public function get_registered_block_names(): array {
        return $this->registered_blocks;
    }
}
