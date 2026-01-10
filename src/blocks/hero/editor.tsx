/**
 * Hero Block - Editor Component
 * 
 * Combined editor component with inline types for simpler structure.
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { ArrowRight } from 'lucide-react';

// Types (inline instead of separate file)
export interface HeroAttributes {
    heading: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    stat1Label: string;
    stat1Value: string;
    stat2Label: string;
    stat2Value: string;
    theme: 'dark' | 'light';
    enableAnimations: boolean;
}

interface EditProps {
    attributes: HeroAttributes;
    setAttributes: (attrs: Partial<HeroAttributes>) => void;
    className?: string;
}

export function Edit({ attributes, setAttributes, className }: EditProps): JSX.Element {
    const { heading, description, buttonText, buttonUrl, stat1Label, stat1Value, stat2Label, stat2Value, theme: colorTheme, enableAnimations } = attributes;

    const blockProps = useBlockProps({
        className: `renderkit-block renderkit-hero renderkit-hero--${colorTheme} ${className || ''}`,
    });

    const isDark = colorTheme === 'dark';
    const textColor = isDark ? 'var(--rk-cream)' : 'var(--rk-anthracite)';
    const mutedColor = isDark ? 'rgba(255,254,249,0.6)' : 'rgba(26,24,22,0.6)';

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
                        onChange={(v) => setAttributes({ theme: v as 'dark' | 'light' })}
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
                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 lg:px-16 py-32" style={{ color: textColor }}>
                    {/* Gold bar */}
                    <div className="mb-16">
                        <div className="w-12 h-px" style={{ backgroundColor: 'var(--rk-gold)' }} />
                    </div>

                    {/* Grid layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-8">
                            <RichText
                                tagName="h1"
                                className="rk-heading-display"
                                value={heading}
                                onChange={(v: string) => setAttributes({ heading: v })}
                                placeholder={__('Enter heading...', 'renderkit')}
                            />
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <RichText
                                tagName="p"
                                className="max-w-sm"
                                value={description}
                                onChange={(v: string) => setAttributes({ description: v })}
                                placeholder={__('Enter description...', 'renderkit')}
                            />

                            <button className="inline-flex items-center gap-4 transition-colors" style={{ color: textColor }}>
                                <span className="text-sm tracking-[0.2em] uppercase font-medium">{buttonText}</span>
                                <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                            </button>
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
