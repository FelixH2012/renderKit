/**
 * Product Page (CPT: rk_product) - Frontend View Component
 *
 * Premium product page design with pill-style section navigation.
 * Bold typography, organized content, rewarding interactions.
 */

import React from 'react';
import { View as NavigationView } from '../../blocks/navigation/view';
import { View as FooterView } from '../../blocks/footer/view';

type StockStatus = 'instock' | 'outofstock' | 'onorder' | string;

interface ProductImage {
    id: number;
    src: string;
    fullSrc?: string;
    alt: string;
    width?: number;
    height?: number;
    srcSet?: string;
    sizes?: string;
}

interface ProductPageNavigation {
    menuSlug: string;
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    sticky: boolean;
    theme: 'light' | 'dark';
    showCart: boolean;
    menuItems: Array<{ id: number; title: string; url: string }>;
}

interface ProductPageFooter {
    menuSlug: string;
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    tagline: string;
    theme: 'light' | 'dark';
    menuItems: Array<{ id: number; title: string; url: string }>;
}

interface ProductPageHero {
    heading: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    theme: 'light' | 'dark';
    variant: 'full' | 'minimal';
    enableAnimations: boolean;
}

interface ProductPageProduct {
    id: number;
    title: string;
    excerpt: string;
    archiveUrl: string;
    sku: string;
    stockStatus: StockStatus;
    stockLabel: string;
    price: number;
    salePrice: number;
    priceFormatted: string;
    salePriceFormatted: string;
    featuredImage: ProductImage | null;
    gallery: ProductImage[];
    hasRenderkitBlocks: boolean;
}

interface ProductPageLabels {
    backToProducts: string;
    sku: string;
    availability: string;
    readDescription: string;
    priceOnRequest: string;
    gallery: string;
    relatedHeading: string;
}

interface ProductPageRelatedProduct {
    id: number;
    title: string;
    excerpt: string;
    url: string;
    image: string;
    price: number;
    salePrice: number;
    priceFormatted: string;
    salePriceFormatted: string;
}

export interface ProductPageAttributes {
    navigation: ProductPageNavigation;
    hero: ProductPageHero;
    product: ProductPageProduct;
    footer: ProductPageFooter;
    labels: ProductPageLabels;
    relatedProducts: ProductPageRelatedProduct[];
}

interface ViewProps {
    attributes: ProductPageAttributes;
    content?: string;
    className?: string;
}

export function View({ attributes, content = '', className }: ViewProps): JSX.Element {
    const { navigation, product, footer, labels, relatedProducts } = attributes;
    const gallery = Array.isArray(product?.gallery) ? product.gallery : [];
    const related = Array.isArray(relatedProducts) ? relatedProducts : [];

    const rootClasses = ['wp-site-blocks', 'rk-site', className].filter(Boolean).join(' ');
    const hasFeatured = Boolean(product?.featuredImage?.src);
    const allImages = hasFeatured ? [product.featuredImage!, ...gallery] : gallery;
    const hasGallery = allImages.length > 0;
    const showSale = Number(product?.salePrice || 0) > 0;
    const showPrice = Number(product?.price || 0) > 0;
    const hasContent = content && content.trim().length > 0;

    return (
        <div className={rootClasses}>
            <NavigationView attributes={navigation} />

            <main className="rk-pdp">
                {/* Breadcrumb Bar */}
                {product?.archiveUrl && (
                    <div className="rk-pdp__breadcrumb-bar">
                        <div className="rk-pdp__container">
                            <a className="rk-pdp__breadcrumb" href={product.archiveUrl}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                <span>{labels?.backToProducts || 'Alle Produkte'}</span>
                            </a>
                        </div>
                    </div>
                )}

                {/* Main Product Section */}
                <section className="rk-pdp__main">
                    <div className="rk-pdp__container">
                        <div className="rk-pdp__grid">
                            {/* Left: Image Gallery */}
                            <div className="rk-pdp__gallery">
                                {hasGallery ? (
                                    <div className="rk-pdp__gallery-wrapper">
                                        {allImages.map((image, index) => {
                                            if (!image?.src) return null;
                                            return (
                                                <div key={image.id || index} className="rk-pdp__gallery-slide">
                                                    <div className="rk-pdp__gallery-image">
                                                        <img
                                                            src={image.src}
                                                            alt={image.alt || `${product.title} - Bild ${index + 1}`}
                                                            loading={index === 0 ? 'eager' : 'lazy'}
                                                            width={image.width}
                                                            height={image.height}
                                                            srcSet={image.srcSet}
                                                            sizes="(min-width: 1024px) 60vw, 100vw"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rk-pdp__gallery-placeholder">
                                        <span>🎁</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Product Info Sidebar */}
                            <div className="rk-pdp__sidebar">
                                <div className="rk-pdp__sidebar-sticky">
                                    {/* Title & Excerpt */}
                                    <div className="rk-pdp__header">
                                        <h1 className="rk-pdp__title">{product?.title || 'Produkt'}</h1>
                                        {product?.excerpt && (
                                            <p className="rk-pdp__excerpt">{product.excerpt}</p>
                                        )}
                                    </div>

                                    {/* Price Section */}
                                    <div className="rk-pdp__price-section">
                                        <div className="rk-pdp__price">
                                            {showSale ? (
                                                <>
                                                    <span className="rk-pdp__price-sale">€{product.salePriceFormatted}</span>
                                                    {showPrice && (
                                                        <span className="rk-pdp__price-original">€{product.priceFormatted}</span>
                                                    )}
                                                    <span className="rk-pdp__price-badge">Sale</span>
                                                </>
                                            ) : showPrice ? (
                                                <span className="rk-pdp__price-current">€{product.priceFormatted}</span>
                                            ) : (
                                                <span className="rk-pdp__price-request">{labels?.priceOnRequest || 'Preis auf Anfrage'}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stock Badge */}
                                    {product?.stockLabel && (
                                        <div className="rk-pdp__stock">
                                            <span className={`rk-pdp__stock-badge rk-pdp__stock-badge--${product.stockStatus}`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    {product.stockStatus === 'instock' ? (
                                                        <path d="M20 6L9 17l-5-5" />
                                                    ) : product.stockStatus === 'outofstock' ? (
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    ) : (
                                                        <path d="M12 8v4M12 16h.01" />
                                                    )}
                                                </svg>
                                                <span>{product.stockLabel}</span>
                                            </span>
                                        </div>
                                    )}

                                    {/* Product Meta */}
                                    <div className="rk-pdp__meta">
                                        {product?.sku && (
                                            <div className="rk-pdp__meta-item">
                                                <span className="rk-pdp__meta-label">{labels?.sku || 'Artikelnummer'}</span>
                                                <span className="rk-pdp__meta-value">{product.sku}</span>
                                            </div>
                                        )}
                                        {product?.stockLabel && (
                                            <div className="rk-pdp__meta-item">
                                                <span className="rk-pdp__meta-label">{labels?.availability || 'Verfügbarkeit'}</span>
                                                <span className="rk-pdp__meta-value">{product.stockLabel}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    {hasContent && (
                                        <a className="rk-pdp__cta rk-cta rk-cta--lg" href="#details">
                                            <span className="rk-cta__text">{labels?.readDescription || 'Details ansehen'}</span>
                                            <svg className="rk-cta__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Details Section */}
                {hasContent && (
                    <section className="rk-pdp__section rk-pdp__section--details" id="details">
                        <div className="rk-pdp__container rk-pdp__container--narrow">
                            <div className="rk-pdp__section-header">
                                <h2 className="rk-pdp__section-title">Produktdetails</h2>
                            </div>
                            <div className="rk-pdp__content">
                                {product?.hasRenderkitBlocks ? (
                                    <div dangerouslySetInnerHTML={{ __html: content }} />
                                ) : (
                                    <div className="rk-pdp__prose" dangerouslySetInnerHTML={{ __html: content }} />
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Related Products Section */}
                {related.length > 0 && (
                    <section className="rk-pdp__section rk-pdp__section--related" id="related">
                        <div className="rk-pdp__container">
                            <div className="rk-pdp__section-header">
                                <h2 className="rk-pdp__section-title">
                                    {labels?.relatedHeading || 'Das könnte dir auch gefallen'}
                                </h2>
                            </div>
                            <div className="rk-pdp__related-grid">
                                {related.map((item) => {
                                    const itemHasSale = Number(item.salePrice || 0) > 0;
                                    const itemHasPrice = Number(item.price || 0) > 0;

                                    return (
                                        <a key={item.id} className="rk-pdp__related-card" href={item.url}>
                                            <div className="rk-pdp__related-image">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.title} loading="lazy" />
                                                ) : (
                                                    <div className="rk-pdp__related-placeholder">
                                                        <span>🎁</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rk-pdp__related-content">
                                                <h3 className="rk-pdp__related-title">{item.title}</h3>
                                                {(itemHasSale || itemHasPrice) && (
                                                    <div className="rk-pdp__related-price">
                                                        {itemHasSale ? (
                                                            <>
                                                                <span className="rk-pdp__related-price-sale">€{item.salePriceFormatted}</span>
                                                                {itemHasPrice && (
                                                                    <span className="rk-pdp__related-price-original">€{item.priceFormatted}</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="rk-pdp__related-price-current">€{item.priceFormatted}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <FooterView attributes={footer} />
        </div>
    );
}

export default View;
