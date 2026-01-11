/**
 * Cookie Banner Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import type { CookieBannerAttributes } from './types';

interface ViewProps {
    attributes: CookieBannerAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const {
        message,
        policyLabel,
        policyUrl,
        acceptLabel,
        rejectLabel,
        manageLabel,
        saveLabel,
        theme = 'dark',
        consentVersion = '1',
        settings = [],
    } = attributes;

    const sectionClasses = [
        'renderkit-block',
        'renderkit-cookie-banner',
        `renderkit-cookie-banner--${theme}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section
            className={sectionClasses}
            data-rk-cookie-banner="1"
            data-rk-cookie-version={consentVersion}
        >
            <div className="rk-cookie-banner__inner">
                <div className="rk-cookie-banner__copy">
                    <p className="rk-cookie-banner__message">{message}</p>
                    {policyUrl ? (
                        <a className="rk-cookie-banner__policy" href={policyUrl}>
                            {policyLabel}
                        </a>
                    ) : null}
                </div>

                <div className="rk-cookie-banner__actions">
                    <button type="button" className="rk-cookie-banner__button rk-cookie-banner__button--ghost" data-rk-cookie-manage>
                        {manageLabel}
                    </button>
                    <button type="button" className="rk-cookie-banner__button rk-cookie-banner__button--ghost" data-rk-cookie-reject>
                        {rejectLabel}
                    </button>
                    <button type="button" className="rk-cookie-banner__button rk-cookie-banner__button--primary" data-rk-cookie-accept>
                        {acceptLabel}
                    </button>
                </div>
            </div>

            <details className="rk-cookie-banner__settings" data-rk-cookie-settings>
                <summary className="rk-cookie-banner__settings-toggle">{manageLabel}</summary>
                <div className="rk-cookie-banner__settings-body">
                    {settings.map((setting) => {
                        const required = Boolean(setting.required);
                        return (
                            <label key={setting.id} className="rk-cookie-banner__setting">
                                <span className="rk-cookie-banner__setting-info">
                                    <span className="rk-cookie-banner__setting-title">{setting.label}</span>
                                    <span className="rk-cookie-banner__setting-desc">{setting.description}</span>
                                    {setting.linkUrl && setting.linkLabel ? (
                                        <a className="rk-cookie-banner__setting-link" href={setting.linkUrl}>
                                            {setting.linkLabel}
                                        </a>
                                    ) : null}
                                </span>
                                <input
                                    type="checkbox"
                                    className="rk-cookie-banner__setting-toggle"
                                    data-rk-cookie-setting={setting.id}
                                    defaultChecked={required || Boolean(setting.enabledByDefault)}
                                    disabled={required}
                                />
                            </label>
                        );
                    })}
                    <div className="rk-cookie-banner__settings-actions">
                        <button type="button" className="rk-cookie-banner__button rk-cookie-banner__button--primary" data-rk-cookie-save>
                            {saveLabel}
                        </button>
                    </div>
                </div>
            </details>
        </section>
    );
}

export default View;
