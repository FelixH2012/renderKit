/**
 * Product Page (CPT: rk_product) - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 * This is used by the PHP template to keep TSX as the single source of truth
 * for the page layout, while PHP keeps control of wp_head/wp_footer.
 */

import React from 'react';
import { View as NavigationView } from '../../blocks/navigation/view';
import { View as HeroView } from '../../blocks/hero/view';
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
}

export interface ProductPageAttributes {
    navigation: ProductPageNavigation;
    hero: ProductPageHero;
    product: ProductPageProduct;
    footer: ProductPageFooter;
    labels: ProductPageLabels;
}

interface ViewProps {
    attributes: ProductPageAttributes;
    content?: string;
    className?: string;
}

export function View({ attributes, content = '', className }: ViewProps): JSX.Element {
    const { navigation, hero, product, footer, labels } = attributes as any;
    const gallery = Array.isArray(product?.gallery) ? (product.gallery as ProductImage[]) : [];

    const rootClasses = ['wp-site-blocks', 'rk-site', className].filter(Boolean).join(' ');
    const hasGallery = gallery.length > 1;
    const hasFeatured = Boolean(product?.featuredImage && product.featuredImage.src);
    const showSale = Number(product?.salePrice || 0) > 0;
    const showPrice = Number(product?.price || 0) > 0;

    return (
        <div className={rootClasses}>
            <NavigationView attributes={navigation} />

            <main className="rk-product-main">
                <HeroView attributes={hero} />

                <section className="rk-product-stage" aria-label={product?.title || 'Product'}>
                    <div className="rk-product-stage__inner">
                        <div className="rk-product-stage__grid">
                            <aside className="rk-product-stage__aside">
                                {product?.archiveUrl ? (
                                    <a className="rk-product-stage__back" href={product.archiveUrl}>
                                        <span aria-hidden="true">←</span>
                                        <span>{labels?.backToProducts || 'Back to products'}</span>
                                    </a>
                                ) : null}

                                <div className="rk-product-stage__meta-top">
                                    {product?.sku ? (
                                        <p className="rk-product-stage__eyebrow">
                                            <span>{labels?.sku || 'SKU'}</span>
                                            <span>{product.sku}</span>
                                        </p>
                                    ) : null}

                                    {product?.stockLabel ? (
                                        <span className={`rk-product-stage__badge rk-product-stage__badge--${product.stockStatus || 'instock'}`}>
                                            {product.stockLabel}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="rk-product-stage__price">
                                    {showSale ? (
                                        <p className="rk-product-stage__price-row">
                                            <span className="rk-product-stage__price-sale">€{product.salePriceFormatted}</span>
                                            {showPrice ? (
                                                <span className="rk-product-stage__price-was">€{product.priceFormatted}</span>
                                            ) : null}
                                        </p>
                                    ) : showPrice ? (
                                        <p className="rk-product-stage__price-row">
                                            <span className="rk-product-stage__price-regular">€{product.priceFormatted}</span>
                                        </p>
                                    ) : (
                                        <p className="rk-product-stage__price-row">
                                            <span className="rk-product-stage__price-regular">
                                                {labels?.priceOnRequest || 'Price on request'}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {product?.excerpt ? <p className="rk-product-stage__lead">{product.excerpt}</p> : null}

                                <dl className="rk-product-stage__facts">
                                    {product?.sku ? (
                                        <div className="rk-product-stage__fact">
                                            <dt>{labels?.sku || 'SKU'}</dt>
                                            <dd>{product.sku}</dd>
                                        </div>
                                    ) : null}
                                    {product?.stockLabel ? (
                                        <div className="rk-product-stage__fact">
                                            <dt>{labels?.availability || 'Availability'}</dt>
                                            <dd>{product.stockLabel}</dd>
                                        </div>
                                    ) : null}
                                </dl>

                                <a className="rk-product-stage__cta" href="#rk-product-description">
                                    <span>{labels?.readDescription || 'Read description'}</span>
                                    <svg
                                        className="rk-product-stage__cta-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    >
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                </a>
                            </aside>

                            <div className="rk-product-stage__media" data-rk-product-hero aria-hidden={hasFeatured ? undefined : true}>
                                {hasFeatured ? (
                                    <img
                                        className="rk-product-stage__img"
                                        src={product.featuredImage!.src}
                                        alt={product.featuredImage!.alt || product.title || 'Product'}
                                        loading="eager"
                                        decoding="async"
                                        width={product.featuredImage!.width}
                                        height={product.featuredImage!.height}
                                        srcSet={product.featuredImage!.srcSet}
                                        sizes={product.featuredImage!.sizes}
                                    />
                                ) : (
                                    <div className="rk-product-stage__placeholder" aria-hidden="true">
                                        🕯️
                                    </div>
                                )}
                                <div className="rk-product-stage__scrim" aria-hidden="true" />
                            </div>
                        </div>

                        {hasGallery ? (
                            <div className="rk-product-gallery" aria-label={labels?.gallery || 'Product gallery'}>
                                {gallery.map((image) => {
                                    if (!image || !image.src) return null;
                                    const href = image.fullSrc || image.src;
                                    return (
                                        <a
                                            key={String(image.id) + ':' + href}
                                            className="rk-product-gallery__item"
                                            href={href}
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            <img
                                                className="rk-product-gallery__img"
                                                src={image.src}
                                                alt={image.alt || product.title || 'Gallery image'}
                                                loading="lazy"
                                                decoding="async"
                                                width={image.width}
                                                height={image.height}
                                                srcSet={image.srcSet}
                                                sizes={image.sizes}
                                            />
                                        </a>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="rk-product-content" id="rk-product-description">
                    <div className="rk-product-content__inner">
                        {product?.hasRenderkitBlocks ? (
                            <div dangerouslySetInnerHTML={{ __html: content }} />
                        ) : (
                            <div className="rk-product-content__prose rk-prose" dangerouslySetInnerHTML={{ __html: content }} />
                        )}
                    </div>
                </section>
            </main>

            <FooterView attributes={footer} />
        </div>
    );
}

export default View;
