/**
 * Product Grid Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
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

export function View({ attributes, className }: ViewProps): JSX.Element {
	const { products = [], showPrice = true } = attributes;

	return (
		<section className={`renderkit-block renderkit-product-grid ${className || ''}`.trim()}>
			<div className="rk-product-grid__inner">
				{/* Header */}
				<header className="rk-product-grid__header">
					<h2 className="rk-product-grid__title">Unsere Kollektion</h2>
				</header>

				{/* Grid */}
				<div className="rk-bento-grid">
					{products.map((product, index) => {
						const isFirst = index === 0;
						const cardClass = `rk-bento-item${isFirst ? ' rk-bento-item--featured' : ''}`;

						return (
							<details
								key={product.id}
								className={cardClass}
								data-rk-bento="1"
								data-rk-bento-id={String(product.id)}
								data-rk-bento-index={index}
							>
								<summary className="rk-bento-summary">
									<span className="rk-sr-only rk-bento-sr-open">Open {product.title}</span>
									<span className="rk-sr-only rk-bento-sr-close">Close {product.title}</span>

									<div className="rk-bento-card" data-rk-bento-card>
										{/* Image */}
										<div className="rk-bento-image" data-rk-bento-card-media>
											{product.image ? (
												<img
													src={product.image}
													alt={product.title}
													className="rk-bento-img"
													data-rk-bento-img
													loading="lazy"
												/>
											) : (
												<div className="rk-bento-placeholder">
													<span aria-hidden="true">🕯️</span>
												</div>
											)}
										</div>

										{/* Overlay */}
										<div className="rk-bento-overlay" aria-hidden="true" />

										{/* Content */}
										<div className="rk-bento-content">
											{/* Arrow button */}
											<div className="rk-bento-action">
												<span className="rk-bento-arrow" aria-hidden="true">
													<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
														<path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
												</span>
											</div>

											{/* Text */}
											<div className="rk-bento-text">
												<h3 className="rk-bento-title">{product.title}</h3>
												{showPrice && product.price > 0 && (
													<p className="rk-bento-price">
														{product.sale_price > 0 ? (
															<>
																<span className="rk-bento-price--sale">€{formatPrice(product.sale_price)}</span>
																<span className="rk-bento-price--was">€{formatPrice(product.price)}</span>
															</>
														) : (
															<>€{formatPrice(product.price)}</>
														)}
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Close button (visible when open) */}
									<span className="rk-bento-close" aria-hidden="true">
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
											<path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
									</span>
								</summary>

								{/* Modal */}
								<div className="rk-bento-modal" data-rk-bento-modal role="dialog" aria-modal="true" aria-label={product.title}>
									<div className="rk-bento-modal__backdrop" aria-hidden="true" data-rk-bento-backdrop />

									<div className="rk-bento-modal__surface" data-rk-bento-surface>
										{/* Media */}
										<div className="rk-bento-modal__media" data-rk-bento-media>
											{product.image ? (
												<img
													className="rk-bento-modal__img"
													src={product.image}
													alt={product.title}
													data-rk-bento-modal-img
												/>
											) : (
												<div className="rk-bento-modal__placeholder" aria-hidden="true">
													🕯️
												</div>
											)}
											<div className="rk-bento-modal__scrim" aria-hidden="true" />
										</div>

										{/* Aside */}
										<aside className="rk-bento-modal__aside" data-rk-bento-aside>
											<div className="rk-bento-modal__aside-inner">
												<h3 className="rk-bento-modal__title">{product.title}</h3>

												{showPrice && product.price > 0 && (
													<p className="rk-bento-modal__price">
														{product.sale_price > 0 ? (
															<>
																<span className="rk-bento-modal__price-sale">€{formatPrice(product.sale_price)}</span>
																<span className="rk-bento-modal__price-was">€{formatPrice(product.price)}</span>
															</>
														) : (
															<>€{formatPrice(product.price)}</>
														)}
													</p>
												)}

												<div className="rk-bento-modal__actions">
													<button
														className="rk-bento-modal__cart-btn"
														type="button"
														data-rk-add-to-cart={product.id}
														data-rk-product-title={product.title}
														data-rk-product-price={product.sale_price > 0 ? product.sale_price : product.price}
													>
														<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
															<path d="M4.5 4.5H15L13.5 10.5H6L4.5 4.5ZM4.5 4.5L4 2.5H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
															<circle cx="6.5" cy="14" r="1" fill="currentColor" />
															<circle cx="13" cy="14" r="1" fill="currentColor" />
														</svg>
														In den Warenkorb
													</button>
													<a className="rk-bento-modal__link" href={product.url} data-rk-product-link>
														Zum Produkt
														<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
															<path d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
														</svg>
													</a>
												</div>
											</div>
										</aside>
									</div>
								</div>
							</details>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default View;
