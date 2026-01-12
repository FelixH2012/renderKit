/**
 * Product Archive Page - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import { View as NavigationView } from '../../blocks/navigation/view';
import { View as FooterView } from '../../blocks/footer/view';
import { View as HeroView } from '../../blocks/hero/view';

interface ArchiveImage {
    id: number;
    src: string;
    fullSrc?: string;
    alt: string;
    width?: number;
    height?: number;
    srcSet?: string;
    sizes?: string;
}

interface ArchiveProduct {
    id: number;
    title: string;
    excerpt: string;
    url: string;
    image: ArchiveImage | null;
    price: number;
    salePrice: number;
    priceFormatted: string;
    salePriceFormatted: string;
}

interface ArchivePaginationLink {
    label: string;
    url: string;
    isCurrent: boolean;
}

interface ArchivePagination {
    current: number;
    total: number;
    links: ArchivePaginationLink[];
}

interface ArchiveLabels {
    heading: string;
    intro: string;
    priceOnRequest: string;
    pagination: string;
}

interface ArchiveNavigation {
    menuSlug: string;
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    sticky: boolean;
    theme: 'light' | 'dark';
    showCart: boolean;
    menuItems: Array<{ id: number; title: string; url: string }>;
}

interface ArchiveFooter {
    menuSlug: string;
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    tagline: string;
    theme: 'light' | 'dark';
    menuItems: Array<{ id: number; title: string; url: string }>;
}

interface ArchiveHero {
    heading: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    theme: 'light' | 'dark';
    variant: 'full' | 'minimal';
    enableAnimations: boolean;
}

export interface ProductArchiveAttributes {
    navigation: ArchiveNavigation;
    hero: ArchiveHero;
    footer: ArchiveFooter;
    labels: ArchiveLabels;
    products: ArchiveProduct[];
    pagination: ArchivePagination;
}

interface ViewProps {
    attributes: ProductArchiveAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const { navigation, hero, footer, labels, products, pagination } = attributes as any;
    const items = Array.isArray(products) ? (products as ArchiveProduct[]) : [];
    const links = Array.isArray(pagination?.links) ? (pagination.links as ArchivePaginationLink[]) : [];

    const rootClasses = ['wp-site-blocks', 'rk-site', className].filter(Boolean).join(' ');

    return (
        <div className={rootClasses}>
            <NavigationView attributes={navigation} />

            <main className="rk-product-archive">
                <HeroView attributes={hero} />
                <section className="rk-product-archive__header">
                    <div className="rk-product-archive__inner">
                        <div className="rk-product-archive__bar" aria-hidden="true" />
                        <h1 className="rk-product-archive__heading">{labels?.heading || 'Produkte'}</h1>
                        {labels?.intro ? <p className="rk-product-archive__intro">{labels.intro}</p> : null}
                    </div>
                </section>

                <section className="rk-product-archive__grid-section">
                    <div className="rk-product-archive__inner">
                        <div className="rk-product-archive__grid">
                            {items.map((product) => {
                                const showSale = Number(product.salePrice || 0) > 0;
                                const showPrice = Number(product.price || 0) > 0;
                                return (
                                    <a key={product.id} className="rk-product-archive__card" href={product.url}>
                                        <div className="rk-product-archive__media">
                                            {product.image?.src ? (
                                                <img
                                                    className="rk-product-archive__img"
                                                    src={product.image.src}
                                                    alt={product.image.alt || product.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    width={product.image.width}
                                                    height={product.image.height}
                                                    srcSet={product.image.srcSet}
                                                    sizes={product.image.sizes}
                                                />
                                            ) : (
                                                <div className="rk-product-archive__placeholder" aria-hidden="true">
                                                    🕯️
                                                </div>
                                            )}
                                        </div>
                                        <div className="rk-product-archive__body">
                                            <p className="rk-product-archive__eyebrow">{product.excerpt || 'Handgefertigt'}</p>
                                            <h2 className="rk-product-archive__title">{product.title}</h2>
                                            {showSale ? (
                                                <p className="rk-product-archive__price">
                                                    <span className="rk-product-archive__price-sale">€{product.salePriceFormatted}</span>
                                                    {showPrice ? (
                                                        <span className="rk-product-archive__price-was">€{product.priceFormatted}</span>
                                                    ) : null}
                                                </p>
                                            ) : showPrice ? (
                                                <p className="rk-product-archive__price">
                                                    <span className="rk-product-archive__price-regular">€{product.priceFormatted}</span>
                                                </p>
                                            ) : (
                                                <p className="rk-product-archive__price">
                                                    <span className="rk-product-archive__price-regular">
                                                        {labels?.priceOnRequest || 'Price on request'}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>

                        {links.length > 1 ? (
                            <nav className="rk-product-archive__pagination" aria-label={labels?.pagination || 'Seite'}>
                                {links.map((link) => (
                                    <a
                                        key={`${link.label}-${link.url}`}
                                        className={[
                                            'rk-product-archive__page',
                                            link.isCurrent && 'rk-product-archive__page--current',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        href={link.url}
                                        aria-current={link.isCurrent ? 'page' : undefined}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </nav>
                        ) : null}
                    </div>
                </section>
            </main>

            <FooterView attributes={footer} />
        </div>
    );
}

export default View;
