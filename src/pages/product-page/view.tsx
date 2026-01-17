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
    const hasGallery = gallery.length > 1;
    const showSale = Number(product?.salePrice || 0) > 0;
    const showPrice = Number(product?.price || 0) > 0;
    const hasContent = content && content.trim().length > 0;

    // Section IDs for navigation
    const sections = [
        { id: 'overview', label: 'Übersicht', show: true },
        { id: 'gallery', label: 'Galerie', show: hasGallery },
        { id: 'details', label: 'Details', show: hasContent },
        { id: 'related', label: 'Ähnliche', show: related.length > 0 },
    ].filter(s => s.show);

    return (
        <div className={rootClasses}>
            <NavigationView attributes={navigation} />

            <main className="rk-pdp">
                {/* Compact Header */}
                <header className="rk-pdp__header">
                    <div className="rk-pdp__header-inner">
                        {product?.archiveUrl && (
                            <a className="rk-pdp__breadcrumb" href={product.archiveUrl}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                {labels?.backToProducts || 'Alle Produkte'}
                            </a>
                        )}
                        <h1 className="rk-pdp__title">{product?.title || 'Produkt'}</h1>
                        {product?.excerpt && (
                            <p className="rk-pdp__subtitle">{product.excerpt}</p>
                        )}
                    </div>
                </header>

                {/* Pill Navigation */}
                <nav className="rk-pdp__pills" aria-label="Sektionen">
                    <div className="rk-pdp__pills-track">
                        {sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="rk-pdp__pill"
                            >
                                {section.label}
                            </a>
                        ))}
                    </div>
                </nav>

                {/* Overview Section */}
                <section className="rk-pdp__section" id="overview">
                    <div className="rk-pdp__overview">
                        {/* Image */}
                        <div className="rk-pdp__image">
                            {hasFeatured ? (
                                <img
                                    src={product.featuredImage!.src}
                                    alt={product.featuredImage!.alt || product.title}
                                    loading="eager"
                                    width={product.featuredImage!.width}
                                    height={product.featuredImage!.height}
                                    srcSet={product.featuredImage!.srcSet}
                                    sizes="(min-width: 768px) 50vw, 100vw"
                                />
                            ) : (
                                <div className="rk-pdp__image-placeholder">
                                    <span>🎁</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="rk-pdp__info">
                            {/* Badge */}
                            {product?.stockLabel && (
                                <span className={`rk-pdp__badge rk-pdp__badge--${product.stockStatus}`}>
                                    {product.stockLabel}
                                </span>
                            )}

                            {/* Price Card */}
                            <div className="rk-pdp__price-card">
                                <div className="rk-pdp__price">
                                    {showSale ? (
                                        <>
                                            <span className="rk-pdp__price-current">€{product.salePriceFormatted}</span>
                                            {showPrice && (
                                                <span className="rk-pdp__price-original">€{product.priceFormatted}</span>
                                            )}
                                        </>
                                    ) : showPrice ? (
                                        <span className="rk-pdp__price-current">€{product.priceFormatted}</span>
                                    ) : (
                                        <span className="rk-pdp__price-current">{labels?.priceOnRequest || 'Preis auf Anfrage'}</span>
                                    )}
                                </div>

                                {/* Quick Info Pills */}
                                <div className="rk-pdp__quick-info">
                                    {product?.sku && (
                                        <span className="rk-pdp__info-pill">
                                            <span className="rk-pdp__info-pill-label">{labels?.sku || 'Art.'}</span>
                                            <span className="rk-pdp__info-pill-value">{product.sku}</span>
                                        </span>
                                    )}
                                    {product?.stockLabel && (
                                        <span className="rk-pdp__info-pill">
                                            <span className="rk-pdp__info-pill-label">{labels?.availability || 'Status'}</span>
                                            <span className="rk-pdp__info-pill-value">{product.stockLabel}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* CTA */}
                            {hasContent && (
                                <a className="rk-pdp__cta" href="#details">
                                    <span>{labels?.readDescription || 'Details ansehen'}</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Gallery Section */}
                {hasGallery && (
                    <section className="rk-pdp__section rk-pdp__section--alt" id="gallery">
                        <div className="rk-pdp__section-header">
                            <h2 className="rk-pdp__section-title">{labels?.gallery || 'Galerie'}</h2>
                        </div>
                        <div className="rk-pdp__gallery-grid">
                            {gallery.map((image, index) => {
                                if (!image?.src) return null;
                                return (
                                    <a
                                        key={image.id || index}
                                        className="rk-pdp__gallery-item"
                                        href={image.fullSrc || image.src}
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        <img
                                            src={image.src}
                                            alt={image.alt || `${product.title} - Bild ${index + 1}`}
                                            loading="lazy"
                                            width={image.width}
                                            height={image.height}
                                        />
                                    </a>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Details Section */}
                {hasContent && (
                    <section className="rk-pdp__section" id="details">
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
                    </section>
                )}

                {/* Related Products Section */}
                {related.length > 0 && (
                    <section className="rk-pdp__section rk-pdp__section--alt" id="related">
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
                                        <div className="rk-pdp__related-media">
                                            {item.image ? (
                                                <img src={item.image} alt={item.title} loading="lazy" />
                                            ) : (
                                                <div className="rk-pdp__related-placeholder">🎁</div>
                                            )}
                                        </div>
                                        <div className="rk-pdp__related-body">
                                            <h3 className="rk-pdp__related-name">{item.title}</h3>
                                            <p className="rk-pdp__related-price">
                                                {itemHasSale ? (
                                                    <>
                                                        <span className="rk-pdp__price-sale">€{item.salePriceFormatted}</span>
                                                        {itemHasPrice && <span className="rk-pdp__price-was">€{item.priceFormatted}</span>}
                                                    </>
                                                ) : itemHasPrice ? (
                                                    <span>€{item.priceFormatted}</span>
                                                ) : null}
                                            </p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>

            <FooterView attributes={footer} />
        </div>
    );
}

export default View;
