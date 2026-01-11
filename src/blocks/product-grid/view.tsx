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
		<section
			className={`renderkit-block renderkit-product-grid ${className || ''}`.trim()}
			style={{
				background: 'linear-gradient(180deg, #FFFEF9 0%, #F5F4F2 100%)',
				padding: '8rem 0',
				overflow: 'hidden',
			}}
		>
			<div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 1.5rem' }}>
				<div style={{ marginBottom: '5rem' }}>
					<p
						style={{
							color: '#B8975A',
							fontSize: '0.875rem',
							letterSpacing: '0.4em',
							textTransform: 'uppercase',
							fontWeight: 500,
							marginBottom: '1.5rem',
						}}
					>
						Entdecken
					</p>
					<h2
						style={{
							fontSize: 'clamp(2.5rem, 6vw, 5rem)',
							fontWeight: 200,
							color: '#1A1816',
							letterSpacing: '-0.04em',
							lineHeight: 1,
							fontFamily: "'Cormorant Garamond', Georgia, serif",
							margin: 0,
						}}
					>
						Unsere Kollektion
					</h2>
					<div
						style={{
							width: 80,
							height: 1,
							background: 'linear-gradient(90deg, #B8975A, transparent)',
							marginTop: '2rem',
						}}
					/>
				</div>

				<div
					className="rk-bento-grid"
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(12, 1fr)',
						gap: 'clamp(1rem, 2vw, 1.5rem)',
						gridAutoRows: 'minmax(300px, auto)',
					}}
				>
					{products.map((product, index) => {
						const isFirst = index === 0;
						const colSpan = isFirst ? 7 : index === 1 || index === 2 ? 5 : index === 3 ? 7 : 4;
						const rowSpan = isFirst ? 2 : 1;
						const minHeight = isFirst
							? 'clamp(400px, 50vw, 600px)'
							: 'clamp(300px, 35vw, 450px)';
						const titleSize = isFirst
							? 'clamp(1.75rem, 4vw, 2.5rem)'
							: 'clamp(1.25rem, 2.5vw, 1.75rem)';

						return (
							<details
								key={product.id}
								className={`rk-bento-item${isFirst ? ' rk-bento-featured' : ''}`}
								data-rk-bento="1"
								data-rk-bento-id={String(product.id)}
								style={{
									position: 'relative',
									overflow: 'hidden',
									cursor: 'pointer',
									gridColumn: `span ${colSpan}`,
									gridRow: `span ${rowSpan}`,
									minHeight,
								}}
							>
								<summary className="rk-bento-summary">
									<span className="rk-sr-only rk-bento-sr-open">Open {product.title}</span>
									<span className="rk-sr-only rk-bento-sr-close">Close {product.title}</span>

									<div className="rk-bento-card" data-rk-bento-card>
										<div
											className="rk-bento-image"
											data-rk-bento-card-media
											style={{
												position: 'absolute',
												inset: 0,
												transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
											}}
										>
											{product.image ? (
												<img
													src={product.image}
													alt={product.title}
													data-rk-bento-img
													style={{ width: '100%', height: '100%', objectFit: 'cover' }}
												/>
											) : (
												<div
													style={{
														width: '100%',
														height: '100%',
														background:
															'linear-gradient(135deg, #E8E3DB 0%, #D4CEC4 100%)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: isFirst ? '6rem' : '4rem',
													}}
												>
													🕯️
												</div>
											)}
										</div>

										<div
											className="rk-bento-overlay"
											style={{
												position: 'absolute',
												inset: 0,
												background:
													'linear-gradient(180deg, transparent 0%, transparent 40%, rgba(26, 24, 22, 0.5) 70%, rgba(26, 24, 22, 0.95) 100%)',
												transition: 'background 0.5s',
											}}
										/>

										<div
											style={{
												position: 'absolute',
												inset: 0,
												padding: 'clamp(1.5rem, 3vw, 2.5rem)',
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'space-between',
											}}
										>
											<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
												<span
													className="rk-bento-arrow"
													aria-hidden="true"
													style={{
														width: 'clamp(3rem, 4vw, 3.5rem)',
														height: 'clamp(3rem, 4vw, 3.5rem)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														background: 'rgba(255, 254, 249, 0.1)',
														backdropFilter: 'blur(10px)',
														WebkitBackdropFilter: 'blur(10px)',
														borderRadius: '50%',
														color: '#FFFEF9',
														border: '1px solid rgba(255,254,249,0.1)',
														transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
													}}
												>
													<i className="rk-bento-arrow__icon fa-solid fa-arrow-right" aria-hidden="true" style={{ transform: 'rotate(-45deg)' }}></i>
												</span>
											</div>

											<div
												className="rk-bento-text"
												style={{
													transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
												}}
											>
												<p
													style={{
														fontSize: 'clamp(0.625rem, 1vw, 0.75rem)',
														letterSpacing: '0.25em',
														textTransform: 'uppercase',
														color: '#B8975A',
														marginBottom: '0.75rem',
														fontWeight: 500,
													}}
												>
													{product.excerpt || 'Handgefertigt'}
												</p>
												<h3
													style={{
														fontSize: titleSize,
														fontWeight: 300,
														color: '#FFFEF9',
														marginBottom: '0.75rem',
														letterSpacing: '-0.03em',
														fontFamily: "'Cormorant Garamond', Georgia, serif",
														lineHeight: 1.1,
													}}
												>
													{product.title}
												</h3>
												{showPrice && product.price > 0 ? (
													<p
														style={{
															fontSize: 'clamp(0.875rem, 1.2vw, 1rem)',
															color: 'rgba(255,254,249,0.7)',
														}}
													>
														{product.sale_price > 0 ? (
															<>
																<span style={{ color: '#B8975A', fontWeight: 500 }}>
																	€{formatPrice(product.sale_price)}
																</span>
																<span
																	style={{
																		marginLeft: '0.75rem',
																		textDecoration: 'line-through',
																		opacity: 0.5,
																	}}
																>
																	€{formatPrice(product.price)}
																</span>
															</>
														) : (
															<>ab €{formatPrice(product.price)}</>
														)}
													</p>
												) : null}
											</div>
										</div>
									</div>

									<span className="rk-bento-close" aria-hidden="true">
										<i className="rk-bento-close__icon fa-solid fa-xmark" aria-hidden="true"></i>
									</span>
								</summary>

								<div className="rk-bento-modal" data-rk-bento-modal role="dialog" aria-modal="true" aria-label={product.title}>
									<div className="rk-bento-modal__backdrop" aria-hidden="true" data-rk-bento-backdrop />

									<div className="rk-bento-modal__surface" data-rk-bento-surface>
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

										<aside className="rk-bento-modal__aside" data-rk-bento-aside>
											<div className="rk-bento-modal__aside-inner">
												<p className="rk-bento-modal__eyebrow">{product.excerpt || 'Handgefertigt'}</p>
												<h3 className="rk-bento-modal__title">{product.title}</h3>

												{showPrice && product.price > 0 ? (
													<p className="rk-bento-modal__price">
														{product.sale_price > 0 ? (
															<>
																<span className="rk-bento-modal__price-sale">€{formatPrice(product.sale_price)}</span>
																<span className="rk-bento-modal__price-was">€{formatPrice(product.price)}</span>
															</>
														) : (
															<>ab €{formatPrice(product.price)}</>
														)}
													</p>
												) : null}

												<a className="rk-bento-modal__cta" href={product.url} data-rk-product-link>
													Zum Produkt
												</a>
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
