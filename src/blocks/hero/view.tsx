/**
 * Hero Block - Frontend View Component
 * 
 * Rendered server-side via renderKit-Relay.
 */

import React, { Fragment, useMemo } from 'react';
import type { HeroAttributes } from './types';

interface ViewProps {
    attributes: HeroAttributes;
    className?: string;
}

function toPlainTextWithNewlines(value: string): string {
    const withNewlines = value.replace(/<br\s*\/?>/gi, '\n');
    return withNewlines.replace(/<\/?[^>]+>/g, '');
}

function splitLines(value: string): string[] {
    const normalized = toPlainTextWithNewlines(value).replace(/\r\n?/g, '\n');
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
        enableAnimations,
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

    const contentClasses = isMinimal
        ? 'w-full max-w-[1600px] mx-auto px-6 pt-32 pb-20 relative z-10'
        : 'w-full max-w-[1600px] mx-auto px-6 py-40 min-h-screen flex items-center relative z-10';

    const showCta = !isMinimal || (buttonText.trim() !== '' && buttonUrl.trim() !== '' && buttonUrl.trim() !== '#');

    return (
        <section
            className={sectionClasses}
            data-rk-hero-render="view"
            data-rk-hero-variant={variant}
            data-rk-hero-animations={enableAnimations ? '1' : '0'}
        >
            <div className="absolute inset-0" data-rk-hero-bg>
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                        backgroundSize: '64px 64px',
                    }}
                />
            </div>

            <div className={contentClasses} data-rk-hero-content>
                <div className="w-full">
                    <div className={isMinimal ? 'mb-10' : 'mb-16'} data-rk-hero-anim="bar">
                        <div className="w-12 h-px" style={{ backgroundColor: 'var(--rk-gold)' }} />
                    </div>
                    <div className={`max-w-4xl flex flex-col ${isMinimal ? 'gap-6' : 'gap-8'}`}>
                        <h1 className={`${isMinimal ? 'rk-heading-page' : 'rk-heading-display'} mb-8`} data-rk-hero-anim="heading">
                            {headingLines.map((line, i) => (
                                <Fragment key={i}>
                                    {line}
                                    {i < headingLines.length - 1 && <br />}
                                </Fragment>
                            ))}
                        </h1>
                        <div className={isMinimal ? 'space-y-6' : 'space-y-8'} data-rk-hero-anim="copy">
                            <p
                                className={isMinimal ? 'max-w-2xl text-[1.0625rem] leading-[1.85]' : 'max-w-lg text-[1.125rem] leading-[1.8]'}
                                style={{ color: 'var(--rk-hero-muted)' }}
                            >
                                {description}
                            </p>
                            {showCta ? (
                                <a
                                    href={buttonUrl}
                                    className={[
                                        'inline-flex items-center gap-4 transition-colors',
                                        enableAnimations &&
                                        'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-2 focus-visible:translate-x-2 motion-reduce:transition-none motion-reduce:transform-none',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    data-rk-hero-cta
                                >
                                    <span className="text-sm tracking-[0.2em] uppercase font-medium">{buttonText}</span>
                                    <i className="rk-hero__cta-icon fa-solid fa-arrow-right" aria-hidden="true"></i>
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default View;
