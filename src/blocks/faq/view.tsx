/**
 * FAQ Block - Frontend View Component
 * 
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import type { FaqAttributes, FaqItem } from './types';

interface ViewProps {
    attributes: FaqAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const { heading, intro, theme, openFirst, items } = attributes;

    const sectionClasses = [
        'renderkit-block',
        'renderkit-faq',
        `renderkit-faq--${theme}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <section className={sectionClasses} data-rk-animate>
            <div className="rk-faq__inner">
                <header className="rk-faq__header">
                    <h2 className="rk-faq__heading">{heading}</h2>
                    {intro && <p className="rk-faq__intro">{intro}</p>}
                </header>

                <div className="rk-faq__list">
                    {items.map((item: FaqItem, index: number) => (
                        <details
                            key={index}
                            className="rk-faq__item"
                            open={openFirst && index === 0}
                        >
                            <summary className="rk-faq__question">
                                <span className="rk-faq__question-text">{item.question}</span>
                                <span className="rk-faq__icon" aria-hidden="true">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <line className="rk-faq__icon-h" x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <line className="rk-faq__icon-v" x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </span>
                            </summary>
                            <div className="rk-faq__answer">
                                <div className="rk-faq__answer-inner">
                                    <div className="rk-faq__answer-content">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default View;
