/**
 * Cookie Gate Block - Editor Component
 */

import React from 'react';
import { InspectorControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, Notice, ToggleControl, TextareaControl } from '@wordpress/components';
import type { CookieGateAttributes } from './types';

interface EditProps {
    attributes: CookieGateAttributes;
    setAttributes: (attrs: Partial<CookieGateAttributes>) => void;
}

export function Edit({ attributes, setAttributes }: EditProps): JSX.Element {
    const {
        requiredSetting = 'analytics',
        consentVersion = '1',
        fallbackText,
        previewAccepted = false,
    } = attributes;

    const blockProps = useBlockProps({
        className: 'renderkit-cookie-gate',
    });

    return (
        <>
            <InspectorControls>
                <PanelBody title="Consent Gate" initialOpen={true}>
                    <TextControl
                        label="Required Setting ID"
                        value={requiredSetting}
                        onChange={(value) => setAttributes({ requiredSetting: value })}
                        help="Must match a setting ID from the Cookie Banner (e.g. analytics, marketing)."
                    />
                    <TextControl
                        label="Consent Version"
                        value={consentVersion}
                        onChange={(value) => setAttributes({ consentVersion: value })}
                    />
                    <TextareaControl
                        label="Fallback Text"
                        value={fallbackText}
                        onChange={(value) => setAttributes({ fallbackText: value })}
                    />
                    <ToggleControl
                        label="Preview as accepted"
                        checked={previewAccepted}
                        onChange={(value) => setAttributes({ previewAccepted: value })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {previewAccepted ? (
                    <>
                        <Notice status="info" isDismissible={false}>
                            Previewing accepted state for "{requiredSetting}".
                        </Notice>
                        <InnerBlocks />
                    </>
                ) : (
                    <>
                        <Notice status="warning" isDismissible={false}>
                            This block is only visible after consent for "{requiredSetting}".
                        </Notice>
                        {fallbackText ? <p>{fallbackText}</p> : null}
                    </>
                )}
            </div>
        </>
    );
}

export default Edit;
