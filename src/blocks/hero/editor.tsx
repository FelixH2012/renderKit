/**
 * Hero Block - Editor Component
 * 
 * Editor component.
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { ArrowRight } from 'lucide-react';
import type { HeroAttributes, HeroTheme, HeroVariant } from './types';

interface EditProps {
    attributes: HeroAttributes;
    setAttributes: (attrs: Partial<HeroAttributes>) => void;
    className?: string;
}

export function Edit({ attributes, setAttributes, className }: EditProps): JSX.Element {
    const { heading, description, buttonText, buttonUrl, stat1Label, stat1Value, stat2Label, stat2Value, theme: colorTheme, variant = 'full', enableAnimations } = attributes as any;

    const blockProps = useBlockProps({
        className: `renderkit-block renderkit-hero renderkit-hero--${colorTheme} renderkit-hero--${variant} ${className || ''}`.trim(),
    });

    const isDark = colorTheme === 'dark';
    const textColor = isDark ? 'var(--rk-cream)' : 'var(--rk-anthracite)';
    const mutedColor = isDark ? 'rgba(255,254,249,0.6)' : 'rgba(26,24,22,0.6)';
    const showCta = variant !== 'minimal' || (buttonText.trim() !== '' && buttonUrl.trim() !== '' && buttonUrl.trim() !== '#');

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Hero Settings', 'renderkit')} initialOpen>
                    <SelectControl
                        label={__('Theme', 'renderkit')}
                        value={colorTheme}
                        options={[
                            { label: 'Dark', value: 'dark' },
                            { label: 'Light', value: 'light' },
                        ]}
                        onChange={(v) => setAttributes({ theme: v as HeroTheme })}
                    />
                    <SelectControl
                        label={__('Variant', 'renderkit')}
                        value={variant}
                        options={[
                            { label: __('Full (Landing)', 'renderkit'), value: 'full' },
                            { label: __('Minimal (Subpages)', 'renderkit'), value: 'minimal' },
                        ]}
                        onChange={(v) => setAttributes({ variant: v as HeroVariant })}
                    />
                    <ToggleControl
                        label={__('Enable Animations', 'renderkit')}
                        checked={enableAnimations}
                        onChange={(v) => setAttributes({ enableAnimations: v })}
                    />
                </PanelBody>

                <PanelBody title={__('Button', 'renderkit')} initialOpen={false}>
                    <TextControl label={__('Text', 'renderkit')} value={buttonText} onChange={(v) => setAttributes({ buttonText: v })} />
                    <TextControl label={__('URL', 'renderkit')} value={buttonUrl} onChange={(v) => setAttributes({ buttonUrl: v })} />
                </PanelBody>

                <PanelBody title={__('Statistics', 'renderkit')} initialOpen={false}>
                    <TextControl label={__('Stat 1 Label', 'renderkit')} value={stat1Label} onChange={(v) => setAttributes({ stat1Label: v })} />
                    <TextControl label={__('Stat 1 Value', 'renderkit')} value={stat1Value} onChange={(v) => setAttributes({ stat1Value: v })} />
                    <TextControl label={__('Stat 2 Label', 'renderkit')} value={stat2Label} onChange={(v) => setAttributes({ stat2Label: v })} />
                    <TextControl label={__('Stat 2 Value', 'renderkit')} value={stat2Value} onChange={(v) => setAttributes({ stat2Value: v })} />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-16 py-12" style={{ color: textColor }}>
                    {/* Gold bar */}
                    <div className="mb-16">
                        <div className="w-12 h-px" style={{ backgroundColor: 'var(--rk-gold)' }} />
                    </div>

                    {/* Vertical layout */}
                    <div className="max-w-4xl" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <RichText
                            tagName="h1"
                            className={variant === 'minimal' ? 'rk-heading-page' : 'rk-heading-display'}
                            value={heading}
                            onChange={(v: string) => setAttributes({ heading: v })}
                            placeholder={__('Enter heading...', 'renderkit')}
                        />

                        <div className="space-y-8">
                            <RichText
                                tagName="p"
                                className={variant === 'minimal' ? 'max-w-2xl' : 'max-w-lg'}
                                value={description}
                                onChange={(v: string) => setAttributes({ description: v })}
                                placeholder={__('Enter description...', 'renderkit')}
                            />

                            {showCta ? (
                                <button
                                    type="button"
                                    className={[
                                        'inline-flex items-center gap-4 transition-colors',
                                        enableAnimations &&
                                            'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-2 focus-visible:translate-x-2 motion-reduce:transition-none motion-reduce:transform-none',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    style={{ color: textColor }}
                                >
                                    <span className="text-sm tracking-[0.2em] uppercase font-medium">{buttonText}</span>
                                    <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-32 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-start-9 lg:col-span-4">
                            <div className="flex items-baseline gap-6" style={{ color: mutedColor }}>
                                <div>
                                    <span className="block text-xs tracking-wider uppercase mb-1">{stat1Label}</span>
                                    <span className="text-2xl font-light" style={{ color: textColor }}>{stat1Value}</span>
                                </div>
                                <div className="w-px h-12" style={{ backgroundColor: mutedColor }} />
                                <div>
                                    <span className="block text-xs tracking-wider uppercase mb-1">{stat2Label}</span>
                                    <span className="text-2xl font-light" style={{ color: textColor }}>{stat2Value}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Edit;
