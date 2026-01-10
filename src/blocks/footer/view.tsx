/**
 * Footer Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 * Optional InnerBlocks rendered HTML is passed as `content`.
 */

import React from 'react';
import type { FooterViewAttributes } from './types';

interface ViewProps {
    attributes: FooterViewAttributes;
    content?: string;
    className?: string;
}

function isNonEmptyHtml(value: string): boolean {
    const stripped = value.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
    return stripped.length > 0;
}

export function View({ attributes, content = '', className }: ViewProps): JSX.Element {
    const {
        menuItems = [],
        showLogo,
        logoUrl,
        siteName,
        tagline,
        theme = 'dark',
    } = attributes as any;

    const year = new Date().getFullYear();
    const hasExtra = isNonEmptyHtml(content);
    const hasMenu = Array.isArray(menuItems) && menuItems.length > 0;

    const footerClasses = [
        'renderkit-block',
        'renderkit-footer',
        `renderkit-footer--${theme}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <footer className={footerClasses} data-rk-footer="1">
            <div className="rk-footer__inner">
                <div className="rk-footer__top">
                    <div className="rk-footer__bar" aria-hidden="true" />
                </div>

                <div
                    className={[
                        'rk-footer__grid',
                        !hasMenu && 'rk-footer__grid--no-menu',
                        !hasExtra && 'rk-footer__grid--no-extra',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    <div className="rk-footer__brand">
                        <a href="/" className="rk-footer__logo">
                            {showLogo && logoUrl ? (
                                <img className="rk-footer__logo-img" src={logoUrl} alt={siteName} />
                            ) : null}
                            <span className="rk-footer__logo-text">{siteName}</span>
                        </a>
                        {tagline ? <p className="rk-footer__tagline">{tagline}</p> : null}
                    </div>

                    {hasMenu ? (
                        <nav className="rk-footer__nav" aria-label="Footer">
                            <p className="rk-footer__label">Links</p>
                            <ul className="rk-footer__list">
                                {menuItems.map((item) => (
                                    <li key={item.id} className="rk-footer__item">
                                        <a className="rk-footer__link" href={item.url}>
                                            {item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ) : null}

                    {hasExtra ? (
                        <div className="rk-footer__extra">
                            <div className="rk-prose" dangerouslySetInnerHTML={{ __html: content }} />
                        </div>
                    ) : null}
                </div>

                <div className="rk-footer__bottom">
                    <span className="rk-footer__fineprint">
                        © {year} {siteName}
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default View;

