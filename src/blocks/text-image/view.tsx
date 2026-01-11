/**
 * Text-Image Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 */

import React from 'react';
import type { TextImageAttributes } from './types';

interface ViewProps {
    attributes: TextImageAttributes;
    className?: string;
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const {
        heading,
        description,
        imageUrl,
        imageAlt,
        imagePosition = 'right',
        buttonText,
        buttonUrl,
        theme = 'light',
    } = attributes;

    const hasButton = buttonText && buttonUrl && buttonUrl !== '#';
    const isImageLeft = imagePosition === 'left';

    const sectionClasses = [
        'renderkit-block',
        'renderkit-text-image',
        `renderkit-text-image--${theme}`,
        isImageLeft && 'renderkit-text-image--image-left',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className={sectionClasses} data-rk-text-image="1">
            <div className="rk-text-image__inner">
                <div className="rk-text-image__grid">
                    <div className="rk-text-image__content">
                        <div className="rk-text-image__bar" aria-hidden="true" />
                        <h2 className="rk-text-image__heading">{heading}</h2>
                        <p className="rk-text-image__description">{description}</p>
                        {hasButton ? (
                            <a href={buttonUrl} className="rk-text-image__cta">
                                <span>{buttonText}</span>
                                <svg
                                    className="rk-text-image__cta-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </a>
                        ) : null}
                    </div>
                    <div className="rk-text-image__media">
                        {imageUrl ? (
                            <img
                                className="rk-text-image__img"
                                src={imageUrl}
                                alt={imageAlt || ''}
                                loading="lazy"
                            />
                        ) : (
                            <div className="rk-text-image__placeholder" aria-hidden="true" />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default View;
