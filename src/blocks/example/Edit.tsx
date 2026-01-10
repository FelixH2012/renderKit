/**
 * Example Block - Editor Component
 *
 * This component renders in the WordPress Block Editor (Gutenberg)
 */

import { __ } from '@wordpress/i18n';
import {
    useBlockProps,
    InspectorControls,
    RichText,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ToggleControl,
    SelectControl,
} from '@wordpress/components';

import type { ExampleEditProps } from './types';

/**
 * Editor component for the Example block
 */
export function Edit({
    attributes,
    setAttributes,
    className,
}: ExampleEditProps): JSX.Element {
    const { title, description, buttonText, showCounter, variant } = attributes;

    const blockProps = useBlockProps({
        className: `renderkit-block renderkit-example ${className || ''}`,
    });

    const variantClasses = {
        primary: 'rk-bg-gradient-to-br rk-from-indigo-500 rk-to-purple-600',
        secondary: 'rk-bg-gradient-to-br rk-from-purple-500 rk-to-pink-500',
        accent: 'rk-bg-gradient-to-br rk-from-cyan-500 rk-to-blue-500',
    };

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Block Settings', 'renderkit')} initialOpen={true}>
                    <TextControl
                        label={__('Button Text', 'renderkit')}
                        value={buttonText}
                        onChange={(value: string) => setAttributes({ buttonText: value })}
                    />

                    <ToggleControl
                        label={__('Show Click Counter', 'renderkit')}
                        checked={showCounter}
                        onChange={(value: boolean) => setAttributes({ showCounter: value })}
                    />

                    <SelectControl
                        label={__('Color Variant', 'renderkit')}
                        value={variant}
                        options={[
                            { label: __('Primary', 'renderkit'), value: 'primary' },
                            { label: __('Secondary', 'renderkit'), value: 'secondary' },
                            { label: __('Accent', 'renderkit'), value: 'accent' },
                        ]}
                        onChange={(value: string) =>
                            setAttributes({ variant: value as 'primary' | 'secondary' | 'accent' })
                        }
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div
                    className={`rk-rounded-xl rk-p-8 rk-text-white rk-shadow-xl ${variantClasses[variant]}`}
                >
                    <RichText
                        tagName="h2"
                        className="rk-text-3xl rk-font-bold rk-mb-4"
                        value={title}
                        onChange={(value: string) => setAttributes({ title: value })}
                        placeholder={__('Enter title...', 'renderkit')}
                    />

                    <RichText
                        tagName="p"
                        className="rk-text-lg rk-opacity-90 rk-mb-6"
                        value={description}
                        onChange={(value: string) => setAttributes({ description: value })}
                        placeholder={__('Enter description...', 'renderkit')}
                    />

                    <div className="rk-flex rk-items-center rk-gap-4">
                        <button
                            type="button"
                            className="rk-px-6 rk-py-3 rk-bg-white rk-text-gray-900 rk-rounded-lg rk-font-semibold rk-shadow-md rk-transition-transform hover:rk-scale-105"
                        >
                            {buttonText}
                        </button>

                        {showCounter && (
                            <span className="rk-text-sm rk-opacity-75">
                                {__('Clicks will be tracked on frontend', 'renderkit')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Edit;
