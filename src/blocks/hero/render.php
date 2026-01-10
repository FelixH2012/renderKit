<?php
/**
 * Hero Block - Server-Side Render Template
 * 
 * Outputs initial HTML for React hydration.
 */

declare(strict_types=1);

if (!defined('ABSPATH')) exit;

$theme = ($attributes['theme'] ?? 'dark') === 'light' ? 'light' : 'dark';
$wrapper = get_block_wrapper_attributes([
    'class' => 'renderkit-block renderkit-hero min-h-screen flex flex-col justify-center relative overflow-hidden renderkit-hero--' . $theme,
    'data-renderkit-block' => 'hero',
    'data-renderkit-props' => wp_json_encode($attributes),
]);

$heading_raw = (string) ($attributes['heading'] ?? '');
$heading_with_newlines = preg_replace('/<br\\s*\\/?\\s*>/i', "\n", $heading_raw) ?? $heading_raw;
$heading_plain = wp_strip_all_tags($heading_with_newlines);
$heading_lines = preg_split("/\\r\\n|\\r|\\n/", $heading_plain) ?: [''];
?>
<section <?php echo $wrapper; ?>>
    <div class="absolute inset-0">
        <div class="absolute inset-0 opacity-[0.02]" style="background-image:radial-gradient(circle at 2px 2px,currentColor 1px,transparent 0);background-size:64px 64px"></div>
    </div>

    <div class="w-full max-w-[1600px] mx-auto px-6 py-12 relative z-10">
        <div class="mb-16">
            <div class="w-12 h-px" style="background:var(--rk-gold)"></div>
        </div>

        <div class="max-w-4xl flex flex-col gap-8">
            <h1 class="rk-heading-display mb-8">
                <?php foreach ($heading_lines as $i => $line) : ?>
                    <?php echo esc_html($line); ?>
                    <?php if ($i < count($heading_lines) - 1) : ?><br><?php endif; ?>
                <?php endforeach; ?>
            </h1>
            <div class="space-y-8">
                <p class="max-w-lg text-[1.125rem] leading-[1.8]" style="color:var(--rk-hero-muted)">
                    <?php echo esc_html($attributes['description'] ?? ''); ?>
                </p>
                <a href="<?php echo esc_url($attributes['buttonUrl'] ?? '#'); ?>" class="inline-flex items-center gap-4 transition-colors">
                    <span class="text-sm tracking-[0.2em] uppercase font-medium"><?php echo esc_html($attributes['buttonText'] ?? 'Entdecken'); ?></span>
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
            </div>
        </div>
    </div>
</section>
