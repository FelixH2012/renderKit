/**
 * Product Grid Block - Scattered Artisan Layout
 * Cards at slight angles like handmade labels on a table
 */

import React from 'react';

interface Product {
	id: number;
	title: string;
	excerpt: string;
	url: string;
	price: number;
	sale_price: number;
	image: string | null;
	stock_status: string;
}

interface ProductGridAttributes {
	products: Product[];
	showPrice: boolean;
}

interface ViewProps {
	attributes: ProductGridAttributes;
	className?: string;
}

function formatPrice(value: number): string {
	return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

// Predefined subtle rotations for organic feel
const rotations = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.8];
const yOffsets = [0, 8, -4, 12, -8, 4, 10, -6];

export function View({ attributes, className }: ViewProps): JSX.Element {
    const { products = [], showPrice = true } = attributes;

    return (
        <section className={['renderkit-block', 'renderkit-product-grid', className].filter(Boolean).join(' ')}>
            <div className="rk-product-grid__shell">
                <div className="rk-product-grid__inner rk-container-wide">
                    {/* Header */}
                    <header className="rk-product-grid__header">
                        <h2 className="rk-product-grid__title rk-heading-section">Unsere Produkte</h2>
                    </header>

                    {/* Scattered Grid */}
                    <div className="rk-scatter-grid">
                        {products.map((product, index) => {
                            const rotation = rotations[index % rotations.length];
                            const yOffset = yOffsets[index % yOffsets.length];
                            const displayPrice = product.sale_price > 0 ? product.sale_price : product.price;

                            return (
                                <article
                                    key={product.id}
                                    className="rk-scatter-card"
                                    style={{
                                        '--scatter-rotate': `${rotation}deg`,
                                        '--scatter-y': `${yOffset}px`,
                                    } as React.CSSProperties}
                                >
                                    <a
                                        href={product.url}
                                        className="rk-scatter-card__link"
                                    >
                                        {/* Quick Add - inside link to tilt with card */}
                                        <button
                                            className="rk-scatter-card__add"
                                            type="button"
                                            data-rk-add-to-cart={product.id}
                                            data-rk-product-title={product.title}
                                            data-rk-product-price={displayPrice}
                                            aria-label={`${product.title} in den Warenkorb`}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M4.5 4.5H15L13.5 10.5H6L4.5 4.5ZM4.5 4.5L4 2.5H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="6.5" cy="14" r="1" fill="currentColor" />
                                                <circle cx="13" cy="14" r="1" fill="currentColor" />
                                            </svg>
                                        </button>

                                        {/* Image */}
                                        <div className="rk-scatter-card__media">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.title}
                                                    className="rk-scatter-card__img"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="rk-scatter-card__placeholder">
                                                    <span aria-hidden="true">🕯️</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="rk-scatter-card__content">
                                            <h3 className="rk-scatter-card__title">
                                                {product.title}
                                            </h3>

                                        {showPrice && product.price > 0 && (
                                                <div className="rk-scatter-card__price">
                                                    {product.sale_price > 0 ? (
                                                        <>
                                                            <span className="rk-scatter-card__price-current">€{formatPrice(product.sale_price)}</span>
                                                            <span className="rk-scatter-card__price-old">€{formatPrice(product.price)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="rk-scatter-card__price-current">€{formatPrice(product.price)}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* CTA */}
                                            <span
                                                className="rk-scatter-card__cta rk-cta rk-cta--responsive"
                                            >
                                                <span className="rk-scatter-card__cta-text rk-cta__text">Ansehen</span>
                                                <svg className="rk-scatter-card__cta-arrow rk-cta__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                        </div>
                                    </a>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
	);
}

export default View;
