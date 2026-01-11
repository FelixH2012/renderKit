/**
 * Cookie Banner Block - Editor Component
 */

import React from 'react';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    TextareaControl,
    SelectControl,
    ToggleControl,
    Button,
} from '@wordpress/components';
import type { CookieBannerAttributes, CookieBannerSetting } from './types';

interface EditProps {
    attributes: CookieBannerAttributes;
    setAttributes: (attrs: Partial<CookieBannerAttributes>) => void;
}

export function Edit({ attributes, setAttributes }: EditProps): JSX.Element {
    const {
        message,
        policyLabel,
        policyUrl,
        acceptLabel,
        rejectLabel,
        manageLabel,
        saveLabel,
        theme = 'dark',
        consentVersion,
        settings,
    } = attributes;

    const blockProps = useBlockProps({
        className: [
            'renderkit-cookie-banner',
            `renderkit-cookie-banner--${theme}`,
        ]
            .filter(Boolean)
            .join(' '),
    });

    const updateSetting = (index: number, patch: Partial<CookieBannerSetting>) => {
        const next = settings.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
        setAttributes({ settings: next });
    };

    const removeSetting = (index: number) => {
        const next = settings.filter((_, idx) => idx !== index);
        setAttributes({ settings: next });
    };

    const addSetting = () => {
        const next = [
            ...settings,
            {
                id: `setting-${settings.length + 1}`,
                label: 'New setting',
                description: 'Describe what this setting does.',
                required: false,
                enabledByDefault: false,
            },
        ];
        setAttributes({ settings: next });
    };

    return (
        <>
            <InspectorControls>
                <PanelBody title="Copy" initialOpen={true}>
                    <TextareaControl
                        label="Message"
                        value={message}
                        onChange={(value) => setAttributes({ message: value })}
                    />
                    <TextControl
                        label="Policy Label"
                        value={policyLabel}
                        onChange={(value) => setAttributes({ policyLabel: value })}
                    />
                    <TextControl
                        label="Policy URL"
                        value={policyUrl}
                        onChange={(value) => setAttributes({ policyUrl: value })}
                    />
                </PanelBody>
                <PanelBody title="Buttons" initialOpen={false}>
                    <TextControl
                        label="Accept Label"
                        value={acceptLabel}
                        onChange={(value) => setAttributes({ acceptLabel: value })}
                    />
                    <TextControl
                        label="Reject Label"
                        value={rejectLabel}
                        onChange={(value) => setAttributes({ rejectLabel: value })}
                    />
                    <TextControl
                        label="Manage Label"
                        value={manageLabel}
                        onChange={(value) => setAttributes({ manageLabel: value })}
                    />
                    <TextControl
                        label="Save Label"
                        value={saveLabel}
                        onChange={(value) => setAttributes({ saveLabel: value })}
                    />
                </PanelBody>
                <PanelBody title="Settings" initialOpen={false}>
                    {settings.map((setting, index) => (
                        <div key={`${setting.id}-${index}`} style={{ marginBottom: '1rem' }}>
                            <TextControl
                                label="ID"
                                value={setting.id}
                                onChange={(value) => updateSetting(index, { id: value })}
                            />
                            <TextControl
                                label="Label"
                                value={setting.label}
                                onChange={(value) => updateSetting(index, { label: value })}
                            />
                            <TextareaControl
                                label="Description"
                                value={setting.description}
                                onChange={(value) => updateSetting(index, { description: value })}
                            />
                            <ToggleControl
                                label="Required"
                                checked={Boolean(setting.required)}
                                onChange={(value) => updateSetting(index, { required: value })}
                            />
                            <ToggleControl
                                label="Enabled by default"
                                checked={Boolean(setting.enabledByDefault)}
                                onChange={(value) => updateSetting(index, { enabledByDefault: value })}
                            />
                            <Button isDestructive onClick={() => removeSetting(index)}>
                                Remove setting
                            </Button>
                        </div>
                    ))}
                    <Button variant="secondary" onClick={addSetting}>
                        Add setting
                    </Button>
                </PanelBody>
                <PanelBody title="Appearance" initialOpen={false}>
                    <SelectControl
                        label="Theme"
                        value={theme}
                        options={[
                            { label: 'Dark', value: 'dark' },
                            { label: 'Light', value: 'light' },
                        ]}
                        onChange={(value) => setAttributes({ theme: value as 'light' | 'dark' })}
                    />
                    <TextControl
                        label="Consent Version"
                        value={consentVersion}
                        onChange={(value) => setAttributes({ consentVersion: value })}
                        help="Change this to re-prompt all users."
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="rk-cookie-banner__inner">
                    <div className="rk-cookie-banner__copy">
                        <p className="rk-cookie-banner__message">{message}</p>
                        {policyUrl ? (
                            <span className="rk-cookie-banner__policy">{policyLabel}</span>
                        ) : null}
                    </div>
                    <div className="rk-cookie-banner__actions">
                        <button type="button" className="rk-cookie-banner__button rk-cookie-banner__button--ghost">
                            {manageLabel}
                        </button>
                        <button type="button" className="rk-cookie-banner__button rk-cookie-banner__button--ghost">
                            {rejectLabel}
                        </button>
                        <button type="button" className="rk-cookie-banner__button rk-cookie-banner__button--primary">
                            {acceptLabel}
                        </button>
                    </div>
                </div>
                <div className="rk-cookie-banner__settings rk-cookie-banner__settings--editor">
                    {settings.map((setting) => (
                        <div key={setting.id} className="rk-cookie-banner__setting">
                            <span className="rk-cookie-banner__setting-info">
                                <span className="rk-cookie-banner__setting-title">{setting.label}</span>
                                <span className="rk-cookie-banner__setting-desc">{setting.description}</span>
                            </span>
                            <input
                                type="checkbox"
                                className="rk-cookie-banner__setting-toggle"
                                checked={Boolean(setting.required || setting.enabledByDefault)}
                                disabled
                                readOnly
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Edit;
