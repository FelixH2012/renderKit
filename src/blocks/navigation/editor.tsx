/**
 * Navigation Block - Editor Component
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl, TextControl, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

// Types
export interface NavAttributes {
    menuId: number;
    menuLocation: string;
    theme: 'dark' | 'light' | 'transparent';
    showLogo: boolean;
    logoUrl: string;
    siteName: string;
    sticky: boolean;
    transparent: boolean;
}

interface EditProps {
    attributes: NavAttributes;
    setAttributes: (attrs: Partial<NavAttributes>) => void;
    className?: string;
}

export function Edit({ attributes, setAttributes, className }: EditProps): JSX.Element {
    const { menuId, theme, showLogo, logoUrl, siteName, sticky, transparent } = attributes;

    const blockProps = useBlockProps({
        className: `renderkit-block renderkit-nav renderkit-nav--${theme} ${className || ''}`,
    });

    // Fetch available menus from WordPress
    const menus = useSelect((select) => {
        const { getEntityRecords } = select(coreStore) as any;
        return getEntityRecords('root', 'menu', { per_page: 100 }) || [];
    }, []);

    // Fetch menu items for selected menu
    const menuItems = useSelect((select) => {
        if (!menuId) return [];
        const { getEntityRecords } = select(coreStore) as any;
        return getEntityRecords('root', 'menuItem', { menus: menuId, per_page: 100 }) || [];
    }, [menuId]);

    const menuOptions = [
        { label: __('Select a menu...', 'renderkit'), value: 0 },
        ...(menus?.map((menu: any) => ({ label: menu.name, value: menu.id })) || []),
    ];

    const isDark = theme === 'dark';
    const textColor = isDark ? '#FFFEF9' : '#1A1816';
    const bgColor = transparent ? 'transparent' : (isDark ? '#000000' : '#FFFEF9');

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Menu Settings', 'renderkit')} initialOpen>
                    <SelectControl
                        label={__('Select Menu', 'renderkit')}
                        value={menuId}
                        options={menuOptions}
                        onChange={(v) => setAttributes({ menuId: Number(v) })}
                    />
                </PanelBody>

                <PanelBody title={__('Appearance', 'renderkit')} initialOpen={false}>
                    <SelectControl
                        label={__('Theme', 'renderkit')}
                        value={theme}
                        options={[
                            { label: 'Dark', value: 'dark' },
                            { label: 'Light', value: 'light' },
                        ]}
                        onChange={(v) => setAttributes({ theme: v as 'dark' | 'light' })}
                    />
                    <ToggleControl
                        label={__('Transparent Background', 'renderkit')}
                        checked={transparent}
                        onChange={(v) => setAttributes({ transparent: v })}
                    />
                    <ToggleControl
                        label={__('Sticky Navigation', 'renderkit')}
                        checked={sticky}
                        onChange={(v) => setAttributes({ sticky: v })}
                    />
                </PanelBody>

                <PanelBody title={__('Logo & Branding', 'renderkit')} initialOpen={false}>
                    <ToggleControl
                        label={__('Show Logo', 'renderkit')}
                        checked={showLogo}
                        onChange={(v) => setAttributes({ showLogo: v })}
                    />
                    {showLogo && (
                        <>
                            <TextControl
                                label={__('Site Name', 'renderkit')}
                                value={siteName}
                                onChange={(v) => setAttributes({ siteName: v })}
                            />
                            <MediaUploadCheck>
                                <MediaUpload
                                    onSelect={(media: any) => setAttributes({ logoUrl: media.url })}
                                    allowedTypes={['image']}
                                    render={({ open }) => (
                                        <div style={{ marginTop: 8 }}>
                                            {logoUrl ? (
                                                <div>
                                                    <img src={logoUrl} alt="Logo" style={{ maxWidth: 150, marginBottom: 8 }} />
                                                    <br />
                                                    <Button variant="secondary" onClick={open}>{__('Change Logo', 'renderkit')}</Button>
                                                    <Button variant="link" onClick={() => setAttributes({ logoUrl: '' })}>{__('Remove', 'renderkit')}</Button>
                                                </div>
                                            ) : (
                                                <Button variant="secondary" onClick={open}>{__('Upload Logo', 'renderkit')}</Button>
                                            )}
                                        </div>
                                    )}
                                />
                            </MediaUploadCheck>
                        </>
                    )}
                </PanelBody>
            </InspectorControls>

            <nav {...blockProps} style={{ backgroundColor: bgColor, color: textColor }}>
                <div className="w-full max-w-[1600px] mx-auto px-8 lg:px-16 py-6">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        {showLogo && (
                            <div className="flex items-center gap-4">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={siteName} className="h-10 w-auto" />
                                ) : (
                                    <div className="w-10 h-10 bg-current opacity-20 rounded" />
                                )}
                                {siteName && (
                                    <span className="text-lg font-medium tracking-wide">{siteName}</span>
                                )}
                            </div>
                        )}

                        {/* Menu Items */}
                        <div className="flex items-center gap-8">
                            {menuItems?.length > 0 ? (
                                menuItems.map((item: any) => (
                                    <a
                                        key={item.id}
                                        href="#"
                                        className="text-sm tracking-[0.1em] uppercase font-medium opacity-80 hover:opacity-100 transition-opacity"
                                        style={{ color: textColor }}
                                    >
                                        {item.title?.rendered || item.title}
                                    </a>
                                ))
                            ) : (
                                <>
                                    <span className="text-sm tracking-[0.1em] uppercase font-medium opacity-60">Menu Item 1</span>
                                    <span className="text-sm tracking-[0.1em] uppercase font-medium opacity-60">Menu Item 2</span>
                                    <span className="text-sm tracking-[0.1em] uppercase font-medium opacity-60">Menu Item 3</span>
                                </>
                            )}
                        </div>

                        {/* CTA */}
                        <div className="w-8 h-px" style={{ backgroundColor: '#B8975A' }} />
                    </div>
                </div>
            </nav>
        </>
    );
}

export default Edit;
