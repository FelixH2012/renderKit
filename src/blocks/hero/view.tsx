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
    const { heading, description, buttonText, buttonUrl, theme: colorTheme, enableAnimations } = attributes;

    const headingLines = useMemo(() => splitLines(heading), [heading]);
    const sectionClasses = [
        'renderkit-block',
        'renderkit-hero',
        'relative',
        'overflow-hidden',
        `renderkit-hero--${colorTheme}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <section className={sectionClasses} data-rk-hero-animations={enableAnimations ? '1' : '0'}>
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

            <div className="w-full max-w-[1600px] mx-auto px-6 py-12 relative z-10" data-rk-hero-content>
                <div className="mb-16">
                    <div className="w-12 h-px" style={{ backgroundColor: 'var(--rk-gold)' }} />
                </div>
                <div className="max-w-4xl flex flex-col gap-8">
                    <h1 className="rk-heading-display mb-8">
                        {headingLines.map((line, i) => (
                            <Fragment key={i}>
                                {line}
                                {i < headingLines.length - 1 && <br />}
                            </Fragment>
                        ))}
                    </h1>
                    <div className="space-y-8">
                        <p className="max-w-lg text-[1.125rem] leading-[1.8]" style={{ color: 'var(--rk-hero-muted)' }}>
                            {description}
                        </p>
                        <a href={buttonUrl} className="inline-flex items-center gap-4 transition-colors" data-rk-hero-cta>
                            <span className="text-sm tracking-[0.2em] uppercase font-medium">{buttonText}</span>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default View;
