<?php
/**
 * Example Block - Server-Side Render Template
 *
 * This template outputs the initial HTML and sets up React hydration.
 *
 * Available variables:
 * @var array    $attributes Block attributes
 * @var string   $content    Block content
 * @var WP_Block $block      Block instance
 * @var array    $config     Plugin configuration
 *
 * @package RenderKit
 */

declare(strict_types=1);

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get block wrapper attributes
$wrapper_attributes = get_block_wrapper_attributes([
    'class'                  => 'renderkit-block renderkit-example',
    'data-renderkit-block'   => 'example',
    'data-renderkit-props'   => wp_json_encode($attributes),
]);

// Get variant class for SSR styling
$variant_classes = [
    'primary'   => 'rk-bg-gradient-to-br rk-from-indigo-500 rk-to-purple-600',
    'secondary' => 'rk-bg-gradient-to-br rk-from-purple-500 rk-to-pink-500',
    'accent'    => 'rk-bg-gradient-to-br rk-from-cyan-500 rk-to-blue-500',
];

$variant = $attributes['variant'] ?? 'primary';
$variant_class = $variant_classes[$variant] ?? $variant_classes['primary'];

// Sanitize output
$title        = esc_html($attributes['title'] ?? '');
$description  = esc_html($attributes['description'] ?? '');
$button_text  = esc_html($attributes['buttonText'] ?? 'Click Me');
$show_counter = $attributes['showCounter'] ?? true;
$click_count  = absint($attributes['clickCount'] ?? 0);
?>

<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
    <div class="rk-rounded-xl rk-p-8 rk-text-white rk-shadow-xl rk-relative rk-overflow-hidden <?php echo esc_attr($variant_class); ?>">
        <?php if ($title) : ?>
            <h2 class="rk-text-3xl rk-font-bold rk-mb-4">
                <?php echo $title; ?>
            </h2>
        <?php endif; ?>

        <?php if ($description) : ?>
            <p class="rk-text-lg rk-opacity-90 rk-mb-6">
                <?php echo $description; ?>
            </p>
        <?php endif; ?>

        <div class="rk-flex rk-items-center rk-gap-4 rk-flex-wrap">
            <button
                type="button"
                class="rk-px-6 rk-py-3 rk-bg-white rk-text-gray-900 rk-rounded-lg rk-font-semibold rk-shadow-md rk-transition-all rk-duration-200 hover:rk-scale-105 hover:rk-shadow-lg active:rk-scale-95"
            >
                <?php echo $button_text; ?>
            </button>

            <?php if ($show_counter) : ?>
                <div class="rk-flex rk-items-center rk-gap-2 rk-bg-white/20 rk-backdrop-blur-sm rk-px-4 rk-py-2 rk-rounded-full">
                    <span class="rk-text-2xl">🎉</span>
                    <span class="rk-font-mono rk-text-lg rk-font-bold">
                        <?php echo esc_html($click_count); ?>
                    </span>
                    <span class="rk-text-sm rk-opacity-75">
                        <?php echo $click_count === 1 ? 'click' : 'clicks'; ?>
                    </span>
                </div>
            <?php endif; ?>
        </div>

        <!-- Decorative elements -->
        <div class="rk-absolute rk-top-0 rk-right-0 rk-w-32 rk-h-32 rk-bg-white/10 rk-rounded-full rk-blur-2xl rk--translate-y-1/2 rk-translate-x-1/2"></div>
        <div class="rk-absolute rk-bottom-0 rk-left-0 rk-w-24 rk-h-24 rk-bg-white/10 rk-rounded-full rk-blur-xl rk-translate-y-1/2 rk--translate-x-1/2"></div>
    </div>
</div>
