/**
 * Hero Block - Frontend View Component
 * 
 * Rendered server-side via renderKit-Relay.
 */

import React, { Fragment, useMemo } from 'react';
import type { HeroAttributes } from './types';
import { htmlToPlainText } from '../../utils/html';

interface ViewProps {
    attributes: HeroAttributes;
    className?: string;
}

function splitLines(value: string): string[] {
    const normalized = htmlToPlainText(value).replace(/\r\n?/g, '\n');
    return normalized.split('\n');
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const {
        heading,
        description,
        buttonText,
        buttonUrl,
        theme: colorTheme,
        variant = 'full',
        blockId,
    } = attributes as any;

    const headingLines = useMemo(() => splitLines(heading), [heading]);
    const isMinimal = variant === 'minimal';
    const sectionClasses = [
        'renderkit-block',
        'renderkit-hero',
        `renderkit-hero--${colorTheme}`,
        `renderkit-hero--${variant}`,
        className,
    ].filter(Boolean).join(' ');

    const hasCta = buttonText?.trim();

    return (
        <section
            id={blockId || undefined}
            className={sectionClasses}
            data-rk-hero-render="view"
            data-rk-hero-variant={variant}
            data-rk-hero-theme={colorTheme}
        >
            {/* Subtle background texture */}
            <div className="rk-hero__bg" aria-hidden="true" />

            <div className="rk-hero__content" data-rk-hero-content>
                <div className="rk-hero__inner">
                    <h1 className={isMinimal ? 'rk-heading-page' : 'rk-heading-display'} data-rk-hero-anim="heading">
                        {headingLines.map((line, i) => (
                            <Fragment key={i}>
                                {line}
                                {i < headingLines.length - 1 && <br />}
                            </Fragment>
                        ))}
                    </h1>

                    <p className="rk-hero__description" data-rk-hero-anim="copy">
                        {description}
                    </p>

                    {hasCta && (
                        <a
                            href={buttonUrl || '#'}
                            className="rk-hero__cta"
                            data-rk-hero-cta
                            data-rk-hero-anim="copy"
                        >
                            <span className="rk-hero__cta-text">{buttonText}</span>
                            <svg
                                className="rk-hero__cta-arrow"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}

export default View;
