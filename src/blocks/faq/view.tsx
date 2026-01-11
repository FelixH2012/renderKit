/**
 * FAQ Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import type { FaqAttributes } from './types';

interface ViewProps {
    attributes: FaqAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const {
        heading,
        intro,
        theme = 'light',
        openFirst = false,
        items = [],
    } = attributes;

    const sectionClasses = [
        'renderkit-block',
        'renderkit-faq',
        `renderkit-faq--${theme}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className={sectionClasses} data-rk-faq="1">
            <div className="rk-faq__inner">
                <div className="rk-faq__header">
                    <div className="rk-faq__bar" aria-hidden="true" />
                    <h2 className="rk-faq__heading">{heading}</h2>
                    {intro ? <p className="rk-faq__intro">{intro}</p> : null}
                </div>

                <div className="rk-faq__list">
                    {items.map((item, index) => (
                        <details
                            key={`${item.question}-${index}`}
                            className="rk-faq__item"
                            open={openFirst && index === 0}
                        >
                            <summary className="rk-faq__question">
                                <span>{item.question}</span>
                                <i className="rk-faq__icon fa-solid fa-plus" aria-hidden="true" />
                            </summary>
                            <div className="rk-faq__answer">{item.answer}</div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default View;
