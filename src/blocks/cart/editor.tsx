/**
 * Cart Block - Editor Component
 */

import React from 'react';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import type { CartAttributes } from './types';

interface EditProps {
    attributes: CartAttributes;
    setAttributes: (attrs: Partial<CartAttributes>) => void;
}

export function Edit({ attributes, setAttributes }: EditProps): JSX.Element {
    const { emptyMessage, emptyButtonText, continueUrl, theme } = attributes;

    const blockProps = useBlockProps({
        className: `renderkit-cart renderkit-cart--${theme}`,
    });

    return (
        <>
            <InspectorControls>
                <PanelBody title="Warenkorb Einstellungen">
                    <TextControl
                        label="Leerer Warenkorb Text"
                        value={emptyMessage}
                        onChange={(value: string) => setAttributes({ emptyMessage: value })}
                    />
                    <TextControl
                        label="Weiter einkaufen Button"
                        value={emptyButtonText}
                        onChange={(value: string) => setAttributes({ emptyButtonText: value })}
                    />
                    <TextControl
                        label="Weiter einkaufen URL"
                        value={continueUrl}
                        onChange={(value: string) => setAttributes({ continueUrl: value })}
                    />
                    <SelectControl
                        label="Theme"
                        value={theme}
                        options={[
                            { label: 'Hell', value: 'light' },
                            { label: 'Dunkel', value: 'dark' },
                        ]}
                        onChange={(value: string) => setAttributes({ theme: value as 'light' | 'dark' })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="rk-cart__editor-preview">
                    <div className="rk-cart__editor-icon">
                        <i className="fa-solid fa-shopping-cart" aria-hidden="true"></i>
                    </div>
                    <p className="rk-cart__editor-title">Warenkorb Block</p>
                    <p className="rk-cart__editor-description">
                        Zeigt den Warenkorb mit Produkten, Mengensteuerung und Gesamtsumme an.
                    </p>
                </div>
            </div>
        </>
    );
}

export default Edit;
