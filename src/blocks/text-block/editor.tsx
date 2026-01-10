/**
 * Text Block - Editor Component
 */

import React from 'react';
import * as blockEditor from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { PanelBody, SelectControl } from '@wordpress/components';
import type { TextBlockAttributes, TextBlockTheme, TextBlockWidth } from './types';

const { InspectorControls, InnerBlocks, useBlockProps } = blockEditor;

interface EditorProps {
    attributes: TextBlockAttributes;
    setAttributes: (attrs: Partial<TextBlockAttributes>) => void;
    className?: string;
}

const ALLOWED_BLOCKS = [
    'core/heading',
    'core/paragraph',
    'core/list',
    'core/quote',
    'core/buttons',
    'core/separator',
];

const TEMPLATE: any[] = [
    ['core/heading', { level: 2, placeholder: __('Title…', 'renderkit') }],
    ['core/paragraph', { placeholder: __('Write your text…', 'renderkit') }],
];

export function Edit({ attributes, setAttributes, className }: EditorProps): JSX.Element {
    const { theme = 'light', width = 'narrow' } = attributes as any;

    const blockProps = useBlockProps({
        className: [
            'renderkit-block',
            'renderkit-text-block',
            `renderkit-text-block--${theme}`,
            `renderkit-text-block--${width}`,
            className,
        ]
            .filter(Boolean)
            .join(' '),
    });

    const themeOptions = [
        { label: 'Light (Cream)', value: 'light' },
        { label: 'Dark (Anthracite)', value: 'dark' },
    ];

    const widthOptions = [
        { label: __('Narrow (reading width)', 'renderkit'), value: 'narrow' },
        { label: __('Wide', 'renderkit'), value: 'wide' },
    ];

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Text Block Settings', 'renderkit')} initialOpen>
                    <SelectControl
                        label={__('Theme', 'renderkit')}
                        value={theme}
                        options={themeOptions}
                        onChange={(value) => setAttributes({ theme: value as TextBlockTheme })}
                    />
                    <SelectControl
                        label={__('Width', 'renderkit')}
                        value={width}
                        options={widthOptions}
                        onChange={(value) => setAttributes({ width: value as TextBlockWidth })}
                    />
                </PanelBody>
            </InspectorControls>

            <section {...blockProps}>
                <div className="rk-text-block__inner">
                    <div className="rk-prose">
                        <InnerBlocks allowedBlocks={ALLOWED_BLOCKS} template={TEMPLATE} />
                    </div>
                </div>
            </section>
        </>
    );
}

export function save(): JSX.Element {
    const InnerBlocksContent = (blockEditor as any).InnerBlocks.Content as React.ComponentType<any>;
    return <InnerBlocksContent />;
}

export default Edit;
