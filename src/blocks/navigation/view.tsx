/**
 * Navigation Block - Frontend View Component
 * 
 * Premium rounded navigation with sticky option
 */

import React from 'react';
import type { NavigationViewAttributes } from './types';

interface ViewProps {
    attributes: NavigationViewAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const {
        menuItems = [],
        showLogo,
        logoUrl,
        siteName,
        sticky,
        theme = 'light',
        showCart,
    } = attributes;

    const navClasses = [
        'renderkit-block',
        'renderkit-nav',
        `renderkit-nav--${theme}`,
        sticky && 'is-sticky',
        className,
    ].filter(Boolean).join(' ');

    return (
        <nav className={navClasses} data-rk-nav-sticky={sticky ? '1' : '0'}>
            <div className="renderkit-nav__shell">
                <div className="renderkit-nav__inner">
                    {showLogo && (
                        <a href="/" className="renderkit-nav__logo">
                            {logoUrl ? (
                                <img src={logoUrl} alt={siteName} className="renderkit-nav__logo-img" />
                            ) : null}
                            <span className="renderkit-nav__logo-text">{siteName}</span>
                        </a>
                    )}

                    <div className="renderkit-nav__menu">
                        {menuItems.map((item) => (
                            <a key={item.id} href={item.url} className="renderkit-nav__link">
                                {item.title}
                            </a>
                        ))}
                    </div>

                    <div className="renderkit-nav__actions">
                        {showCart && (
                            <button className="renderkit-nav__icon-button" type="button" aria-label="Warenkorb">
                                <svg className="renderkit-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M6 2 L3 6 v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                <span className="renderkit-nav__dot" />
                            </button>
                        )}

                        <details className="renderkit-nav__mobile-details">
                            <summary className="renderkit-nav__icon-button renderkit-nav__mobile-toggle" aria-label="Menü" role="button">
                                <svg className="renderkit-nav__icon renderkit-nav__icon--menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                                <svg className="renderkit-nav__icon renderkit-nav__icon--close" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                    <line x1="6" y1="18" x2="18" y2="6" />
                                </svg>
                            </summary>

                            <div className={`renderkit-nav__mobile renderkit-nav--${theme}`}>
                                <div className="renderkit-nav__mobile-links">
                                    {menuItems.map((item) => (
                                        <a key={item.id} href={item.url} className="renderkit-nav__mobile-link">
                                            {item.title}
                                        </a>
                                    ))}
                                </div>
                                <div className="renderkit-nav__mobile-rule" />
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default View;
