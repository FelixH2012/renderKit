<?php
/**
 * Product Grid Block - Server-Side Render Template
 * 
 * Award-winning bento grid with responsive design
 */

declare(strict_types=1);

if (!defined('ABSPATH')) exit;

use RenderKit\Products;

$count = $attributes['count'] ?? 6;
$category = $attributes['category'] ?? 0;
$show_price = $attributes['showPrice'] ?? true;

$args = ['posts_per_page' => min($count, 6)];
if ($category > 0) {
    $args['tax_query'] = [[
        'taxonomy' => Products::TAXONOMY,
        'field' => 'term_id',
        'terms' => $category,
    ]];
}

$products = Products::get_products($args);
$props = array_merge($attributes, ['products' => $products]);

$wrapper = get_block_wrapper_attributes([
    'class' => 'renderkit-block renderkit-product-grid',
    'data-renderkit-block' => 'product-grid',
    'data-renderkit-props' => wp_json_encode($props),
]);
?>
<section <?php echo $wrapper; ?> style="background:linear-gradient(180deg,#FFFEF9 0%,#F5F4F2 100%);padding:8rem 0;overflow:hidden;">
    <div style="max-width:1600px;margin:0 auto;padding:0 1.5rem;">
        <!-- Header -->
        <div style="margin-bottom:5rem;">
            <p style="color:#B8975A;font-size:0.875rem;letter-spacing:0.4em;text-transform:uppercase;font-weight:500;margin-bottom:1.5rem;">
                Entdecken
            </p>
            <h2 style="font-size:clamp(2.5rem,6vw,5rem);font-weight:200;color:#1A1816;letter-spacing:-0.04em;line-height:1;font-family:'Cormorant Garamond',Georgia,serif;margin:0;">
                Unsere Kollektion
            </h2>
            <div style="width:80px;height:1px;background:linear-gradient(90deg,#B8975A,transparent);margin-top:2rem;"></div>
        </div>

        <!-- Bento Grid -->
        <div class="rk-bento-grid" style="display:grid;grid-template-columns:repeat(12,1fr);gap:clamp(1rem,2vw,1.5rem);grid-auto-rows:minmax(300px,auto);">
            <?php foreach ($products as $index => $product): 
                $is_first = $index === 0;
                $col_span = $is_first ? 7 : ($index === 1 || $index === 2 ? 5 : ($index === 3 ? 7 : 4));
                $row_span = $is_first ? 2 : 1;
                $min_height = $is_first ? 'clamp(400px,50vw,600px)' : 'clamp(300px,35vw,450px)';
            ?>
            <article class="rk-bento-item<?php echo $is_first ? ' rk-bento-featured' : ''; ?>" style="position:relative;overflow:hidden;border-radius:clamp(1rem,2vw,1.5rem);cursor:pointer;grid-column:span <?php echo $col_span; ?>;grid-row:span <?php echo $row_span; ?>;min-height:<?php echo $min_height; ?>;">
                <!-- Image -->
                <div style="position:absolute;inset:0;transition:transform 0.7s cubic-bezier(0.22,1,0.36,1);" class="rk-bento-image">
                    <?php if ($product['image']): ?>
                    <img src="<?php echo esc_url($product['image']); ?>" alt="<?php echo esc_attr($product['title']); ?>" style="width:100%;height:100%;object-fit:cover;">
                    <?php else: ?>
                    <div style="width:100%;height:100%;background:linear-gradient(135deg,#E8E3DB 0%,#D4CEC4 100%);display:flex;align-items:center;justify-content:center;font-size:<?php echo $is_first ? '6rem' : '4rem'; ?>;">🕯️</div>
                    <?php endif; ?>
                </div>

                <!-- Overlay -->
                <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 0%,transparent 40%,rgba(26,24,22,0.5) 70%,rgba(26,24,22,0.95) 100%);transition:background 0.5s;" class="rk-bento-overlay"></div>

                <!-- Content -->
                <div style="position:absolute;inset:0;padding:clamp(1.5rem,3vw,2.5rem);display:flex;flex-direction:column;justify-content:space-between;">
                    <!-- Arrow -->
                    <div style="display:flex;justify-content:flex-end;">
                        <a href="<?php echo esc_url($product['url']); ?>" class="rk-bento-arrow" style="width:clamp(3rem,4vw,3.5rem);height:clamp(3rem,4vw,3.5rem);display:flex;align-items:center;justify-content:center;background:rgba(255,254,249,0.1);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:50%;color:#FFFEF9;text-decoration:none;border:1px solid rgba(255,254,249,0.1);transition:all 0.4s cubic-bezier(0.22,1,0.36,1);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                        </a>
                    </div>

                    <!-- Text -->
                    <div class="rk-bento-text" style="transition:transform 0.5s cubic-bezier(0.22,1,0.36,1);">
                        <p style="font-size:clamp(0.625rem,1vw,0.75rem);letter-spacing:0.25em;text-transform:uppercase;color:#B8975A;margin-bottom:0.75rem;font-weight:500;">
                            <?php echo esc_html($product['excerpt'] ?: 'Handgefertigt'); ?>
                        </p>
                        <h3 style="font-size:<?php echo $is_first ? 'clamp(1.75rem,4vw,2.5rem)' : 'clamp(1.25rem,2.5vw,1.75rem)'; ?>;font-weight:300;color:#FFFEF9;margin-bottom:0.75rem;letter-spacing:-0.03em;font-family:'Cormorant Garamond',Georgia,serif;line-height:1.1;">
                            <?php echo esc_html($product['title']); ?>
                        </h3>
                        <?php if ($show_price && $product['price'] > 0): ?>
                        <p style="font-size:clamp(0.875rem,1.2vw,1rem);color:rgba(255,254,249,0.7);">
                            <?php if ($product['sale_price'] > 0): ?>
                            <span style="color:#B8975A;font-weight:500;">€<?php echo number_format($product['sale_price'], 2); ?></span>
                            <span style="margin-left:0.75rem;text-decoration:line-through;opacity:0.5;">€<?php echo number_format($product['price'], 2); ?></span>
                            <?php else: ?>
                            ab €<?php echo number_format($product['price'], 2); ?>
                            <?php endif; ?>
                        </p>
                        <?php endif; ?>
                    </div>
                </div>
            </article>
            <?php endforeach; ?>
        </div>
    </div>

    <style>
        .rk-bento-item:hover .rk-bento-image { transform: scale(1.08); }
        .rk-bento-item:hover .rk-bento-overlay { background: linear-gradient(180deg,rgba(26,24,22,0.1) 0%,rgba(26,24,22,0.3) 40%,rgba(26,24,22,0.7) 70%,rgba(26,24,22,0.98) 100%); }
        .rk-bento-item:hover .rk-bento-arrow { transform: scale(1.15) rotate(45deg); background: #B8975A; }
        .rk-bento-item:hover .rk-bento-text { transform: translateY(-10px); }
        @media (max-width: 767px) {
            .rk-bento-item { grid-column: span 12 !important; grid-row: span 1 !important; min-height: 350px !important; }
        }
    </style>
</section>
