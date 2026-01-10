/**
 * Footer Block - Editor Component
 */

import React from 'react';
import * as blockEditor from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Button, PanelBody, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import type { FooterAttributes, FooterTheme } from './types';

const { InspectorControls, InnerBlocks, MediaUpload, useBlockProps } = blockEditor;
const MediaUploadCheck =
    ((blockEditor as any).MediaUploadCheck as React.ComponentType<any>) ||
    (({ children }: { children: React.ReactNode }) => <>{children}</>);
const WPButton = Button as unknown as React.ComponentType<any>;

interface EditorProps {
    attributes: FooterAttributes;
    setAttributes: (attrs: Partial<FooterAttributes>) => void;
    className?: string;
}

const MENU_LOCATION_OPTIONS = [
    { label: __('Footer Menu (renderkit-footer)', 'renderkit'), value: 'renderkit-footer' },
    { label: __('Primary Menu (renderkit-primary)', 'renderkit'), value: 'renderkit-primary' },
    { label: __('Secondary Menu (renderkit-secondary)', 'renderkit'), value: 'renderkit-secondary' },
];

const EXTRA_ALLOWED_BLOCKS = [
    'core/heading',
    'core/paragraph',
    'core/list',
    'core/buttons',
    'core/social-links',
    'core/separator',
];

export function Edit({ attributes, setAttributes, className }: EditorProps): JSX.Element {
    const {
        menuSlug,
        showLogo,
        logoUrl,
        siteName,
        tagline,
        theme = 'dark',
    } = attributes as any;

    const themeOptions = [
        { label: 'Light (Cream)', value: 'light' },
        { label: 'Dark (Anthracite)', value: 'dark' },
    ];

    const mockMenuItems = [
        { id: 1, title: __('Shop', 'renderkit'), url: '#' },
        { id: 2, title: __('Über uns', 'renderkit'), url: '#' },
        { id: 3, title: __('Kontakt', 'renderkit'), url: '#' },
    ];

    const blockProps = useBlockProps({
        className: [
            'renderkit-block',
            'renderkit-footer',
            `renderkit-footer--${theme}`,
            className,
        ]
            .filter(Boolean)
            .join(' '),
    });

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Footer Settings', 'renderkit')} initialOpen>
                    <SelectControl
                        label={__('Theme', 'renderkit')}
                        value={theme}
                        options={themeOptions}
                        onChange={(value) => setAttributes({ theme: value as FooterTheme })}
                    />
                    <SelectControl
                        label={__('Menu Location', 'renderkit')}
                        value={menuSlug}
                        options={MENU_LOCATION_OPTIONS}
                        onChange={(value) => setAttributes({ menuSlug: value })}
                        help={__('Uses the WordPress menu location (recommended).', 'renderkit')}
                    />
                </PanelBody>

                <PanelBody title={__('Brand', 'renderkit')} initialOpen={false}>
                    <ToggleControl
                        label={__('Show Logo', 'renderkit')}
                        checked={showLogo}
                        onChange={(value) => setAttributes({ showLogo: value })}
                    />
                    <TextControl
                        label={__('Site Name (optional)', 'renderkit')}
                        value={siteName}
                        onChange={(value) => setAttributes({ siteName: value })}
                        help={__('Leave empty to use the WordPress site title.', 'renderkit')}
                    />
                    <TextControl
                        label={__('Tagline', 'renderkit')}
                        value={tagline}
                        onChange={(value) => setAttributes({ tagline: value })}
                    />

                    {showLogo ? (
                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={(media: any) => setAttributes({ logoUrl: String(media?.url || '') })}
                                allowedTypes={['image']}
                                value={logoUrl}
                                render={({ open }: { open: () => void }) => (
                                    <WPButton variant="secondary" onClick={open} className="is-full-width">
                                        {logoUrl ? __('Change Logo', 'renderkit') : __('Upload Logo', 'renderkit')}
                                    </WPButton>
                                )}
                            />
                        </MediaUploadCheck>
                    ) : null}

                    {logoUrl ? (
                        <WPButton isDestructive variant="link" onClick={() => setAttributes({ logoUrl: '' })}>
                            {__('Remove Logo', 'renderkit')}
                        </WPButton>
                    ) : null}
                </PanelBody>
            </InspectorControls>

            <footer {...blockProps}>
                <div className="rk-footer__inner">
                    <div className="rk-footer__top">
                        <div className="rk-footer__bar" aria-hidden="true" />
                    </div>

                    <div className="rk-footer__grid">
                        <div className="rk-footer__brand">
                            <div className="rk-footer__logo">
                                {showLogo && logoUrl ? (
                                    <img className="rk-footer__logo-img" src={logoUrl} alt="" />
                                ) : null}
                                <span className="rk-footer__logo-text">{siteName || __('Site Name', 'renderkit')}</span>
                            </div>
                            {tagline ? <p className="rk-footer__tagline">{tagline}</p> : null}
                        </div>

                        <div className="rk-footer__nav">
                            <p className="rk-footer__label">{__('Links', 'renderkit')}</p>
                            <ul className="rk-footer__list">
                                {mockMenuItems.map((item) => (
                                    <li key={item.id} className="rk-footer__item">
                                        <span className="rk-footer__link">{item.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rk-footer__extra">
                            <div className="rk-prose">
                                <InnerBlocks allowedBlocks={EXTRA_ALLOWED_BLOCKS} />
                            </div>
                        </div>
                    </div>

                    <div className="rk-footer__bottom">
                        <span className="rk-footer__fineprint">© {new Date().getFullYear()} {siteName || __('Site Name', 'renderkit')}</span>
                    </div>
                </div>
            </footer>
        </>
    );
}

export function save(): JSX.Element {
    const InnerBlocksContent = (blockEditor as any).InnerBlocks.Content as React.ComponentType<any>;
    return <InnerBlocksContent />;
}

export default Edit;
