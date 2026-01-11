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
                                <i className="renderkit-nav__icon fa-solid fa-bag-shopping" aria-hidden="true"></i>
                                <span className="renderkit-nav__dot" />
                            </button>
                        )}

                        <details className="renderkit-nav__mobile-details">
                            <summary className="renderkit-nav__icon-button renderkit-nav__mobile-toggle" aria-label="Menü" role="button">
                                <i className="renderkit-nav__icon renderkit-nav__icon--menu fa-solid fa-bars" aria-hidden="true"></i>
                                <i className="renderkit-nav__icon renderkit-nav__icon--close fa-solid fa-xmark" aria-hidden="true"></i>
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
