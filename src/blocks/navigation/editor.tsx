/**
 * Navigation Block - Editor Component
 */

import React from 'react';
import * as blockEditor from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import type { NavigationAttributes, NavigationTheme } from './types';

const { InspectorControls, MediaUpload } = blockEditor;
const MediaUploadCheck =
    ((blockEditor as any).MediaUploadCheck as React.ComponentType<any>) ||
    (({ children }: { children: React.ReactNode }) => <>{children}</>);
const WPButton = Button as unknown as React.ComponentType<any>;

interface EditorProps {
    attributes: NavigationAttributes;
    setAttributes: (attrs: Partial<NavigationAttributes>) => void;
}

const THEME_OPTIONS = [
    { label: 'Light (Cream)', value: 'light' },
    { label: 'Dark (Anthracite)', value: 'dark' },
];

export function Edit({ attributes, setAttributes }: EditorProps) {
    const {
        menuSlug,
        showLogo,
        logoUrl,
        siteName,
        sticky,
        theme = 'light',
        showCart
    } = attributes;

    // Fetch available menus
    const menus = useSelect((select) => {
        // @ts-ignore
        return select('core').getEntityRecords('root', 'menu', { per_page: -1 });
    }, []) || [];

    const menuOptions = [
        { label: 'Select a Menu', value: '' },
        ...menus.map((menu: any) => ({ label: menu.name, value: menu.slug }))
    ];

    // Mock items for editor preview
    const mockMenuItems = [
        { id: 1, title: 'Shop', url: '#' },
        { id: 2, title: 'Über uns', url: '#' },
        { id: 3, title: 'Kontakt', url: '#' },
    ];

    const navClasses = [
        'renderkit-block',
        'renderkit-nav',
        `renderkit-nav--${theme}`,
        sticky && 'is-sticky',
        // In editor, we show it "scrolled" style to make it visible
        'is-scrolled',
    ].filter(Boolean).join(' ');

    return (
        <div className={navClasses}>
            <InspectorControls>
                <PanelBody title="Navigation Settings">
                    <SelectControl
                        label="Menu"
                        value={menuSlug}
                        options={menuOptions}
                        onChange={(value) => setAttributes({ menuSlug: value })}
                    />
                    <SelectControl
                        label="Theme"
                        value={theme}
                        options={THEME_OPTIONS}
                        onChange={(value) => setAttributes({ theme: value as NavigationTheme })}
                    />
                    <ToggleControl
                        label="Sticky Header"
                        help="Fixiert die Navigation am oberen Bildschirmrand"
                        checked={sticky}
                        onChange={(value) => setAttributes({ sticky: value })}
                    />
                    <ToggleControl
                        label="Show Shopping Cart"
                        checked={showCart}
                        onChange={(value) => setAttributes({ showCart: value })}
                    />
                </PanelBody>

                <PanelBody title="Logo Settings">
                    <ToggleControl
                        label="Show Logo"
                        checked={showLogo}
                        onChange={(value) => setAttributes({ showLogo: value })}
                    />
                    {showLogo && (
                        <>
                            <TextControl
                                label="Site Name"
                                value={siteName}
                                onChange={(value) => setAttributes({ siteName: value })}
                            />
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={(media: any) => setAttributes({ logoUrl: media.url })}
                                    allowedTypes={['image']}
                                    value={logoUrl}
                                    render={({ open }: { open: () => void }) => (
                                        <WPButton variant="secondary" onClick={open} className="is-full-width">
                                            {logoUrl ? 'Change Logo' : 'Upload Logo'}
                                        </WPButton>
                                    )}
                                />
                            </MediaUploadCheck>
                            {logoUrl && (
                                <WPButton
                                    isDestructive
                                    variant="link"
                                    onClick={() => setAttributes({ logoUrl: '' })}
                                >
                                    Remove Logo
                                </WPButton>
                            )}
                        </>
                    )}
                </PanelBody>
            </InspectorControls>

            <div className="renderkit-nav__shell">
                <div className="renderkit-nav__inner">
                    {/* Logo Preview */}
                    {showLogo && (
                        <div className="renderkit-nav__logo">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="renderkit-nav__logo-img" />
                            ) : (
                                <span className="renderkit-nav__logo-text">{siteName || 'Site Name'}</span>
                            )}
                        </div>
                    )}

                    {/* Menu Preview */}
                    <div className="renderkit-nav__menu">
                        {mockMenuItems.map((item) => (
                            <span key={item.id} className="renderkit-nav__link">
                                {item.title}
                            </span>
                        ))}
                    </div>

                    {/* Actions Preview */}
                    <div className="renderkit-nav__actions">
                        {showCart && (
                            <button className="renderkit-nav__icon-button">
                                <i className="renderkit-nav__icon fa-solid fa-bag-shopping" aria-hidden="true"></i>
                                <span className="renderkit-nav__dot" />
                            </button>
                        )}
                        <button className="renderkit-nav__icon-button renderkit-nav__mobile-toggle">
                            <i className="renderkit-nav__icon fa-solid fa-bars" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
