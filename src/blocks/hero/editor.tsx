/**
 * Hero Block - Editor Component
 * 
 * Editor component.
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import type { HeroAttributes, HeroTheme, HeroVariant } from './types';

interface EditProps {
    attributes: HeroAttributes;
    setAttributes: (attrs: Partial<HeroAttributes>) => void;
    className?: string;
}

export function Edit({ attributes, setAttributes, className }: EditProps): JSX.Element {
    const { heading, description, buttonText, buttonUrl, theme: colorTheme, variant = 'full' } = attributes as any;

    const blockProps = useBlockProps({
        className: `renderkit-block renderkit-hero renderkit-hero--${colorTheme} renderkit-hero--${variant} ${className || ''}`.trim(),
    });

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
                </PanelBody>

                <PanelBody title={__('Call to Action', 'renderkit')} initialOpen={false}>
                    <TextControl
                        label={__('Button Text', 'renderkit')}
                        value={buttonText}
                        onChange={(v) => setAttributes({ buttonText: v })}
                    />
                    <TextControl
                        label={__('Button URL', 'renderkit')}
                        value={buttonUrl}
                        onChange={(v) => setAttributes({ buttonUrl: v })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="rk-hero__bg" aria-hidden="true" />
                <div className="rk-hero__content">
                    <div className="rk-hero__inner">
                        <RichText
                            tagName="h1"
                            className={variant === 'minimal' ? 'rk-heading-page' : 'rk-heading-display'}
                            value={heading}
                            onChange={(v: string) => setAttributes({ heading: v })}
                            placeholder={__('Your headline here...', 'renderkit')}
                        />

                        <RichText
                            tagName="p"
                            className="rk-hero__description"
                            value={description}
                            onChange={(v: string) => setAttributes({ description: v })}
                            placeholder={__('A brief, compelling description...', 'renderkit')}
                        />

                        <span className="rk-hero__cta">
                            <span className="rk-hero__cta-text">
                                {buttonText || __('Entdecken', 'renderkit')}
                            </span>
                            <svg
                                className="rk-hero__cta-arrow"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Edit;
