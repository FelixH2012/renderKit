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

    const hasButton = buttonText?.trim();
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
                        <h2 className="rk-text-image__heading">{heading}</h2>
                        <p className="rk-text-image__description">{description}</p>
                        {hasButton && (
                            <a href={buttonUrl || '#'} className="rk-text-image__cta">
                                <span className="rk-text-image__cta-text">{buttonText}</span>
                                <svg
                                    className="rk-text-image__cta-arrow"
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
