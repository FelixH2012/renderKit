/**
 * Footer Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 * Optional InnerBlocks rendered HTML is passed as `content`.
 */

import React from 'react';
import type { FooterViewAttributes } from './types';
import { hasNonEmptyHtmlText } from '../../utils/html';

interface ViewProps {
    attributes: FooterViewAttributes;
    content?: string;
    className?: string;
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
    const hasExtra = hasNonEmptyHtmlText(content);
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
            <div className="rk-footer__shell">
                <div className="rk-footer__inner rk-container-wide">
                    <div className="rk-footer__content">
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
                            <nav className="rk-footer__nav" aria-label="Footer Navigation">
                                <ul className="rk-footer__nav-list">
                                    {menuItems.map((item) => (
                                        <li key={item.id}>
                                            <a className="rk-footer__nav-link" href={item.url}>
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
                        <span className="rk-footer__copyright">© {year} {siteName}</span>
                        <button type="button" className="rk-footer__cookie-btn" data-rk-cookie-open>
                            Cookie-Einstellungen
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default View;
