/**
 * Swiper Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 * No-JS fallback: horizontal scroll-snap.
 * JS enhancement: prev/next + dots (optional).
 */

import React from 'react';
import type { SwiperAttributes, SwiperSlide, SwiperTheme } from './types';

interface ViewProps {
    attributes: Partial<SwiperAttributes> & { slides?: unknown };
    className?: string;
}

function normalizeTheme(value: unknown): SwiperTheme {
    return value === 'dark' ? 'dark' : 'light';
}

function normalizeSlides(value: unknown): SwiperSlide[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((raw, index) => {
            const item = (raw || {}) as Partial<SwiperSlide> & Record<string, unknown>;
            const id = typeof item.id === 'string' && item.id.trim() !== '' ? item.id : `slide-${index + 1}`;

            return {
                id,
                eyebrow: typeof item.eyebrow === 'string' ? item.eyebrow : '',
                heading: typeof item.heading === 'string' ? item.heading : '',
                text: typeof item.text === 'string' ? item.text : '',
                linkText: typeof item.linkText === 'string' ? item.linkText : '',
                linkUrl: typeof item.linkUrl === 'string' ? item.linkUrl : '',
                imageId: typeof item.imageId === 'number' ? item.imageId : Number.parseInt(String(item.imageId || '0'), 10) || 0,
                imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
                imageAlt: typeof item.imageAlt === 'string' ? item.imageAlt : '',
                imageSrcSet: typeof item.imageSrcSet === 'string' ? item.imageSrcSet : undefined,
                imageSizes: typeof item.imageSizes === 'string' ? item.imageSizes : undefined,
                imageWidth: typeof item.imageWidth === 'number' ? item.imageWidth : undefined,
                imageHeight: typeof item.imageHeight === 'number' ? item.imageHeight : undefined,
            };
        })
        .filter((slide) => slide.heading.trim() !== '' || slide.text.trim() !== '' || slide.imageUrl.trim() !== '');
}

export function View({ attributes, className }: ViewProps): JSX.Element {
    const theme = normalizeTheme(attributes.theme);
    const ariaLabel = typeof attributes.ariaLabel === 'string' && attributes.ariaLabel.trim() !== '' ? attributes.ariaLabel : 'Carousel';
    const showArrows = attributes.showArrows !== false;
    const showDots = attributes.showDots !== false;
    const slides = normalizeSlides(attributes.slides);

    const rootClasses = [
        'renderkit-block',
        'renderkit-swiper',
        `renderkit-swiper--${theme}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    if (slides.length === 0) {
        return (
            <section className={rootClasses} data-rk-swiper="1">
                <div className="rk-swiper__empty">
                    <p className="rk-swiper__empty-title">Swiper</p>
                    <p className="rk-swiper__empty-text">Füge Slides im Editor hinzu.</p>
                </div>
            </section>
        );
    }

    return (
        <section className={rootClasses} data-rk-swiper="1" aria-label={ariaLabel}>
            <div className="rk-swiper__viewport">
                <div
                    className="rk-swiper__track"
                    data-rk-swiper-track
                    tabIndex={0}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label={ariaLabel}
                >
                    {slides.map((slide, index) => {
                        const total = slides.length;
                        const label = `${index + 1} / ${total}`;

                        return (
                            <article
                                key={slide.id}
                                className="rk-swiper__slide"
                                data-rk-swiper-slide
                                data-rk-swiper-index={index}
                                aria-roledescription="slide"
                                aria-label={label}
                            >
                                {slide.imageUrl ? (
                                    <div className="rk-swiper__media">
                                        <img
                                            className="rk-swiper__img"
                                            src={slide.imageUrl}
                                            alt={slide.imageAlt || slide.heading || 'Slide'}
                                            loading={index === 0 ? 'eager' : 'lazy'}
                                            decoding="async"
                                            width={slide.imageWidth}
                                            height={slide.imageHeight}
                                            srcSet={slide.imageSrcSet}
                                            sizes={slide.imageSizes}
                                        />
                                    </div>
                                ) : null}

                                <div className="rk-swiper__body">
                                    {slide.eyebrow ? <p className="rk-swiper__eyebrow">{slide.eyebrow}</p> : null}
                                    {slide.heading ? <h3 className="rk-swiper__title">{slide.heading}</h3> : null}
                                    {slide.text ? <p className="rk-swiper__text">{slide.text}</p> : null}

                                    {slide.linkUrl && slide.linkText ? (
                                        <a className="rk-swiper__link" href={slide.linkUrl}>
                                            <span>{slide.linkText}</span>
                                            <svg className="rk-swiper__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </a>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            {(showArrows || showDots) && slides.length > 1 ? (
                <div className="rk-swiper__controls" data-rk-swiper-controls>
                    {showArrows ? (
                        <div className="rk-swiper__buttons">
                            <button type="button" className="rk-swiper__button" data-rk-swiper-prev aria-label="Previous slide">
                                <svg className="rk-swiper__button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path d="M15 18 9 12l6-6" />
                                </svg>
                            </button>
                            <button type="button" className="rk-swiper__button" data-rk-swiper-next aria-label="Next slide">
                                <svg className="rk-swiper__button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div />
                    )}

                    {showDots ? <div className="rk-swiper__dots" data-rk-swiper-dots aria-label="Carousel pagination" /> : null}
                </div>
            ) : null}
        </section>
    );
}

export default View;
