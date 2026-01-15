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
        currentUrl = '',
        cartCount = 0,
        cartUrl = '/warenkorb/',
    } = attributes;

    const normalizePath = (url: string) => {
        try {
            const parsed = new URL(url, 'http://placeholder.local');
            return parsed.pathname.replace(/\/+$/, '') || '/';
        } catch {
            return url.replace(/\/+$/, '') || '/';
        }
    };

    const currentPath = currentUrl ? normalizePath(currentUrl) : '';

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
                        {menuItems.map((item) => {
                            const itemPath = normalizePath(item.url);
                            const isActive = currentPath !== '' && currentPath === itemPath;
                            return (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    className={[
                                        'renderkit-nav__link',
                                        isActive && 'renderkit-nav__link--active',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {item.title}
                                </a>
                            );
                        })}
                    </div>

                    <div className="renderkit-nav__actions">
                        {showCart && (
                            <a
                                href={cartUrl}
                                className="renderkit-nav__icon-button renderkit-nav__cart"
                                aria-label={`Warenkorb${cartCount > 0 ? ` (${cartCount} Artikel)` : ''}`}
                                data-rk-cart-trigger
                            >
                                <i className="renderkit-nav__icon fa-solid fa-bag-shopping" aria-hidden="true"></i>
                                <span
                                    className={`renderkit-nav__cart-count${cartCount === 0 ? ' is-empty' : ''}`}
                                    data-rk-cart-count
                                >
                                    {cartCount}
                                </span>
                            </a>
                        )}

                        <details className="renderkit-nav__mobile-details">
                            <summary className="renderkit-nav__icon-button renderkit-nav__mobile-toggle" aria-label="Menü" role="button">
                                <i className="renderkit-nav__icon renderkit-nav__icon--menu fa-solid fa-bars" aria-hidden="true"></i>
                                <i className="renderkit-nav__icon renderkit-nav__icon--close fa-solid fa-xmark" aria-hidden="true"></i>
                            </summary>

                            <div className={`renderkit-nav__mobile renderkit-nav--${theme}`}>
                                <div className="renderkit-nav__mobile-links">
                                    {menuItems.map((item) => {
                                        const itemPath = normalizePath(item.url);
                                        const isActive = currentPath !== '' && currentPath === itemPath;
                                        return (
                                            <a
                                                key={item.id}
                                                href={item.url}
                                                className={[
                                                    'renderkit-nav__mobile-link',
                                                    isActive && 'renderkit-nav__mobile-link--active',
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                {item.title}
                                            </a>
                                        );
                                    })}
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
