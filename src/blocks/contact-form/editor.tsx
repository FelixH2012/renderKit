/**
 * Contact Form Block - Editor Component
 */

import React from 'react';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import type { ContactFormAttributes } from './types';

interface EditProps {
    attributes: ContactFormAttributes;
    setAttributes: (attrs: Partial<ContactFormAttributes>) => void;
}

export function Edit({ attributes, setAttributes }: EditProps): JSX.Element {
    const {
        nameLabel,
        emailLabel,
        subjectLabel,
        messageLabel,
        submitButtonText,
        theme,
        privacyLabel,
        privacyRequired,
        successMessage,
        errorMessage,
    } = attributes;

    const blockProps = useBlockProps({
        className: [
            'renderkit-contact-form',
            `renderkit-contact-form--${theme}`,
        ]
            .filter(Boolean)
            .join(' '),
    });

    return (
        <>
            <InspectorControls>
                <PanelBody title="Form Labels" initialOpen={true}>
                    <TextControl
                        label="Name Label"
                        value={nameLabel ?? ''}
                        onChange={(value) => setAttributes({ nameLabel: value })}
                    />
                    <TextControl
                        label="Email Label"
                        value={emailLabel ?? ''}
                        onChange={(value) => setAttributes({ emailLabel: value })}
                    />
                    <TextControl
                        label="Subject Label"
                        value={subjectLabel ?? ''}
                        onChange={(value) => setAttributes({ subjectLabel: value })}
                    />
                    <TextControl
                        label="Message Label"
                        value={messageLabel ?? ''}
                        onChange={(value) => setAttributes({ messageLabel: value })}
                    />
                </PanelBody>
                <PanelBody title="Submit Button" initialOpen={false}>
                    <TextControl
                        label="Button Text"
                        value={submitButtonText ?? ''}
                        onChange={(value) => setAttributes({ submitButtonText: value })}
                    />
                </PanelBody>
                <PanelBody title="Messages" initialOpen={false}>
                    <TextControl
                        label="Success Message"
                        value={successMessage ?? ''}
                        onChange={(value) => setAttributes({ successMessage: value })}
                    />
                    <TextControl
                        label="Error Message"
                        value={errorMessage ?? ''}
                        onChange={(value) => setAttributes({ errorMessage: value })}
                    />
                </PanelBody>
                <PanelBody title="Privacy" initialOpen={false}>
                    <TextControl
                        label="Privacy Label"
                        value={privacyLabel ?? ''}
                        onChange={(value) => setAttributes({ privacyLabel: value })}
                    />
                    <SelectControl
                        label="Privacy Required"
                        value={privacyRequired ? 'yes' : 'no'}
                        options={[
                            { label: 'Yes', value: 'yes' },
                            { label: 'No', value: 'no' },
                        ]}
                        onChange={(value) => setAttributes({ privacyRequired: value === 'yes' })}
                    />
                </PanelBody>
                <PanelBody title="Appearance" initialOpen={false}>
                    <SelectControl
                        label="Theme"
                        value={theme}
                        options={[
                            { label: 'Light', value: 'light' },
                            { label: 'Dark', value: 'dark' },
                        ]}
                        onChange={(value) =>
                            setAttributes({ theme: value as 'light' | 'dark' })
                        }
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="rk-contact-form__inner">
                    <div className="rk-contact-form__panel">
                        <form className="rk-contact-form__form" onSubmit={(e) => e.preventDefault()}>
                            <div className="rk-contact-form__grid">
                                <div className="rk-contact-form__group">
                                    <label className="rk-contact-form__label">{nameLabel}</label>
                                    <input type="text" className="rk-contact-form__input" disabled placeholder="Name input..." />
                                </div>

                                <div className="rk-contact-form__group">
                                    <label className="rk-contact-form__label">{emailLabel}</label>
                                    <input type="email" className="rk-contact-form__input" disabled placeholder="Email input..." />
                                </div>

                                <div className="rk-contact-form__group rk-contact-form__group--full">
                                    <label className="rk-contact-form__label">{subjectLabel}</label>
                                    <input type="text" className="rk-contact-form__input" disabled placeholder="Subject input..." />
                                </div>

                                <div className="rk-contact-form__group rk-contact-form__group--full">
                                    <label className="rk-contact-form__label">{messageLabel}</label>
                                    <textarea className="rk-contact-form__textarea" rows={3} disabled placeholder="Message area..." />
                                </div>
                            </div>

                            <div className="rk-contact-form__recaptcha rk-contact-form__recaptcha--placeholder">
                                <div className="rk-contact-form__recaptcha-box">reCAPTCHA v3 aktiv</div>
                            </div>

                            <div className="rk-contact-form__checkbox">
                                <input type="checkbox" checked={privacyRequired} disabled />
                                <label>{privacyLabel}</label>
                            </div>

                            <div className="rk-contact-form__actions">
                                <button className="rk-contact-form__submit" disabled>
                                    <span>{submitButtonText}</span>
                                    <i className="rk-contact-form__submit-icon fa-solid fa-paper-plane" aria-hidden="true"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Edit;
