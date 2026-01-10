<?php
/**
 * Hero Block - Server-Side Render Template
 * 
 * Outputs initial HTML for React hydration.
 */

declare(strict_types=1);

if (!defined('ABSPATH')) exit;

// Theme colors
$is_dark = ($attributes['theme'] ?? 'dark') === 'dark';
$bg = $is_dark ? '#000000' : '#FFFEF9';
$text = $is_dark ? '#FFFEF9' : '#1A1816';
$muted = $is_dark ? 'rgba(255,254,249,0.6)' : 'rgba(26,24,22,0.6)';

$wrapper = get_block_wrapper_attributes([
    'class' => 'renderkit-block renderkit-hero renderkit-hero--' . ($is_dark ? 'dark' : 'light'),
    'data-renderkit-block' => 'hero',
    'data-renderkit-props' => wp_json_encode($attributes),
    'style' => "background-color:$bg;color:$text",
]);

$heading_lines = explode("\n", $attributes['heading'] ?? '');
?>
<section <?php echo $wrapper; ?>>
    <div class="absolute inset-0">
        <div class="absolute inset-0 opacity-[0.02]" style="background-image:radial-gradient(circle at 2px 2px,currentColor 1px,transparent 0);background-size:64px 64px"></div>
    </div>

    <div class="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-16 py-32">
        <div class="mb-16"><div class="w-12 h-px" style="background:#B8975A"></div></div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div class="lg:col-span-8">
                <h1 class="rk-heading-display mb-8"><?php 
                    foreach ($heading_lines as $i => $line) {
                        echo esc_html($line);
                        if ($i < count($heading_lines) - 1) echo '<br>';
                    }
                ?></h1>
            </div>
            <div class="lg:col-span-4 space-y-8">
                <p class="max-w-sm" style="color:<?php echo $muted; ?>;font-size:1.125rem;line-height:1.8"><?php echo esc_html($attributes['description'] ?? ''); ?></p>
                <a href="<?php echo esc_url($attributes['buttonUrl'] ?? '#'); ?>" class="inline-flex items-center gap-4">
                    <span class="text-sm tracking-[0.2em] uppercase font-medium"><?php echo esc_html($attributes['buttonText'] ?? 'Entdecken'); ?></span>
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
            </div>
        </div>

        <div class="mt-32 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-start-9 lg:col-span-4">
                <div class="flex items-baseline gap-6" style="color:<?php echo $muted; ?>">
                    <div>
                        <span class="block text-xs tracking-wider uppercase mb-1"><?php echo esc_html($attributes['stat1Label'] ?? ''); ?></span>
                        <span class="text-2xl font-light" style="color:<?php echo $text; ?>"><?php echo esc_html($attributes['stat1Value'] ?? ''); ?></span>
                    </div>
                    <div class="w-px h-12" style="background:<?php echo $muted; ?>"></div>
                    <div>
                        <span class="block text-xs tracking-wider uppercase mb-1"><?php echo esc_html($attributes['stat2Label'] ?? ''); ?></span>
                        <span class="text-2xl font-light" style="color:<?php echo $text; ?>"><?php echo esc_html($attributes['stat2Value'] ?? ''); ?></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
