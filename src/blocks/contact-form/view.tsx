/**
 * Contact Form Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import type { ContactFormAttributes } from './types';

interface ViewProps {
    attributes: ContactFormAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const {
        nameLabel,
        emailLabel,
        subjectLabel,
        messageLabel,
        submitButtonText,
        theme = 'light',
        recaptchaSiteKey = '',
        recaptchaEnabled = false,
        nonce = '',
        privacyLabel = 'I agree to the privacy policy.',
        privacyRequired = true,
        status = '',
        successMessage = 'Thanks! Your message has been sent.',
        errorMessage = 'Something went wrong. Please try again.',
    } = attributes;

    const sectionClasses = [
        'renderkit-block',
        'renderkit-contact-form',
        `renderkit-contact-form--${theme}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className={sectionClasses} data-rk-contact-form="1">
            <div className="rk-contact-form__inner">
                <div className="rk-contact-form__panel">
                    {status && (
                        <div
                            className={[
                                'rk-contact-form__status',
                                status === 'success' ? 'rk-contact-form__status--success' : 'rk-contact-form__status--error',
                            ].join(' ')}
                            role={status === 'success' ? 'status' : 'alert'}
                            aria-live="polite"
                        >
                            {status === 'success' ? successMessage : errorMessage}
                        </div>
                    )}
                    <form className="rk-contact-form__form" action="/wp-admin/admin-post.php" method="POST">
                        <input type="hidden" name="action" value="rk_contact_submission" />
                        {nonce && <input type="hidden" name="rk_contact_nonce" value={nonce} />}

                        <div className="rk-contact-form__grid">
                            <div className="rk-contact-form__group">
                                <label htmlFor="rk-contact-name" className="rk-contact-form__label">
                                    {nameLabel}
                                </label>
                                <input
                                    type="text"
                                    id="rk-contact-name"
                                    name="rk_name"
                                    className="rk-contact-form__input"
                                    required
                                />
                            </div>

                            <div className="rk-contact-form__group">
                                <label htmlFor="rk-contact-email" className="rk-contact-form__label">
                                    {emailLabel}
                                </label>
                                <input
                                    type="email"
                                    id="rk-contact-email"
                                    name="rk_email"
                                    className="rk-contact-form__input"
                                    required
                                />
                            </div>

                            <div className="rk-contact-form__group rk-contact-form__group--full">
                                <label htmlFor="rk-contact-subject" className="rk-contact-form__label">
                                    {subjectLabel}
                                </label>
                                <input
                                    type="text"
                                    id="rk-contact-subject"
                                    name="rk_subject"
                                    className="rk-contact-form__input"
                                    required
                                />
                            </div>

                            <div className="rk-contact-form__group rk-contact-form__group--full">
                                <label htmlFor="rk-contact-message" className="rk-contact-form__label">
                                    {messageLabel}
                                </label>
                                <textarea
                                    id="rk-contact-message"
                                    name="rk_message"
                                    className="rk-contact-form__textarea"
                                    rows={5}
                                    required
                                />
                            </div>
                        </div>

                        {recaptchaEnabled && recaptchaSiteKey && (
                            <div
                                className="rk-contact-form__recaptcha"
                                data-rk-recaptcha="v3"
                                data-sitekey={recaptchaSiteKey}
                                data-action="contact_form"
                            >
                                <input type="hidden" name="g-recaptcha-response" value="" />
                                <input type="hidden" name="rk_recaptcha_action" value="contact_form" />
                                <p className="rk-contact-form__recaptcha-note">
                                    This site is protected by reCAPTCHA and the Google{' '}
                                    <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                                        Privacy Policy
                                    </a>{' '}
                                    and{' '}
                                    <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
                                        Terms of Service
                                    </a>{' '}
                                    apply.
                                </p>
                                <noscript>
                                    <p className="rk-contact-form__recaptcha-fallback">
                                        Please enable JavaScript to submit this form.
                                    </p>
                                </noscript>
                            </div>
                        )}

                        <div className="rk-contact-form__checkbox">
                            {privacyRequired && <input type="hidden" name="rk_privacy_required" value="1" />}
                            <input
                                type="checkbox"
                                id="rk-contact-privacy"
                                name="rk_privacy_agree"
                                value="1"
                                required={privacyRequired}
                            />
                            <label htmlFor="rk-contact-privacy">{privacyLabel}</label>
                        </div>

                        <div className="rk-contact-form__actions">
                            <button type="submit" className="rk-contact-form__submit">
                                <span>{submitButtonText}</span>
                                <i className="rk-contact-form__submit-icon fa-solid fa-paper-plane" aria-hidden="true"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default View;
