/**
 * Navigation Block - Frontend View Component
 *
 * Modern, minimal navigation with sticky behavior and mobile menu.
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

    // Normalize URL path for comparison
    const normalizePath = (url: string): string => {
        try {
            const parsed = new URL(url, 'http://placeholder.local');
            return parsed.pathname.replace(/\/+$/, '') || '/';
        } catch {
            return url.replace(/\/+$/, '') || '/';
        }
    };

    const currentPath = currentUrl ? normalizePath(currentUrl) : '';

    return (
        <nav
            className={['rk-nav', className].filter(Boolean).join(' ')}
            data-rk-nav
            data-sticky={sticky || undefined}
            data-theme={theme}
        >
            <div className="rk-nav__container">
                {/* Logo */}
                {showLogo && (
                    <a href="/" className="rk-nav__logo">
                        {logoUrl && (
                            <img
                                src={logoUrl}
                                alt={siteName}
                                className="rk-nav__logo-img"
                                loading="eager"
                            />
                        )}
                        <span className="rk-nav__logo-text">{siteName}</span>
                    </a>
                )}

                {/* Desktop Menu */}
                <ul className="rk-nav__menu" role="menubar">
                    {menuItems.map((item) => {
                        const itemPath = normalizePath(item.url);
                        const isActive = currentPath !== '' && currentPath === itemPath;
                        return (
                            <li key={item.id} role="none">
                                <a
                                    href={item.url}
                                    className="rk-nav__link"
                                    role="menuitem"
                                    aria-current={isActive ? 'page' : undefined}
                                    data-active={isActive || undefined}
                                >
                                    {item.title}
                                </a>
                            </li>
                        );
                    })}
                </ul>

                {/* Actions */}
                <div className="rk-nav__actions">
                    {/* Cart */}
                    {showCart && (
                        <a
                            href={cartUrl}
                            className="rk-nav__action"
                            aria-label={`Warenkorb${cartCount > 0 ? ` (${cartCount} Artikel)` : ''}`}
                        >
                            <svg
                                className="rk-nav__icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            <span
                                className="rk-nav__badge"
                                data-rk-cart-count
                                data-empty={cartCount === 0 || undefined}
                            >
                                {cartCount}
                            </span>
                        </a>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        type="button"
                        className="rk-nav__toggle"
                        data-rk-menu-toggle
                        aria-label="Menü öffnen"
                        aria-expanded="false"
                        aria-controls="rk-mobile-menu"
                    >
                        <span className="rk-nav__hamburger">
                            <span />
                            <span />
                            <span />
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className="rk-nav__mobile"
                id="rk-mobile-menu"
                data-rk-mobile-menu
                aria-hidden="true"
            >
                <div className="rk-nav__mobile-inner">
                    <ul className="rk-nav__mobile-list">
                        {menuItems.map((item, index) => {
                            const itemPath = normalizePath(item.url);
                            const isActive = currentPath !== '' && currentPath === itemPath;
                            return (
                                <li
                                    key={item.id}
                                    style={{ '--delay': `${index * 50}ms` } as React.CSSProperties}
                                >
                                    <a
                                        href={item.url}
                                        className="rk-nav__mobile-link"
                                        data-rk-mobile-link
                                        aria-current={isActive ? 'page' : undefined}
                                        data-active={isActive || undefined}
                                    >
                                        {item.title}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default View;
