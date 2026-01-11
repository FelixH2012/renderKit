/**
 * Cookie Gate Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import type { CookieGateAttributes } from './types';

interface ViewProps {
    attributes: CookieGateAttributes;
    content?: string;
    className?: string;
}

export function View({ attributes, content = '', className }: ViewProps): JSX.Element {
    const {
        requiredSetting = 'analytics',
        consentVersion = '1',
        fallbackText = 'Bitte akzeptiere die passenden Cookies, um diesen Inhalt zu sehen.',
    } = attributes;

    const sectionClasses = [
        'renderkit-block',
        'renderkit-cookie-gate',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section
            className={sectionClasses}
            data-rk-cookie-gate="1"
            data-rk-cookie-requires={requiredSetting}
            data-rk-cookie-version={consentVersion}
        >
            <div className="rk-cookie-gate__inner" dangerouslySetInnerHTML={{ __html: content }} />
            {fallbackText ? (
                <div className="rk-cookie-gate__fallback">
                    <p>{fallbackText}</p>
                    <button type="button" className="rk-cookie-gate__fallback-button" data-rk-cookie-open>
                        Cookie-Einstellungen
                    </button>
                </div>
            ) : null}
        </section>
    );
}

export default View;
