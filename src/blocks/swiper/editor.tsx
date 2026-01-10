/**
 * Swiper Block - Editor Component
 */

import React from 'react';
import * as blockEditor from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Button, PanelBody, SelectControl, TextareaControl, TextControl, ToggleControl } from '@wordpress/components';
import type { SwiperAttributes, SwiperSlide, SwiperTheme } from './types';

const { InspectorControls, MediaUpload, useBlockProps } = blockEditor;
const MediaUploadCheck =
    ((blockEditor as any).MediaUploadCheck as React.ComponentType<any>) ||
    (({ children }: { children: React.ReactNode }) => <>{children}</>);
const WPButton = Button as unknown as React.ComponentType<any>;
const WPTextareaControl = TextareaControl as unknown as React.ComponentType<any>;

interface EditorProps {
    attributes: SwiperAttributes;
    setAttributes: (attrs: Partial<SwiperAttributes>) => void;
    className?: string;
}

function createSlide(partial?: Partial<SwiperSlide>): SwiperSlide {
    const idBase = Math.random().toString(16).slice(2);
    return {
        id: partial?.id || `slide-${Date.now().toString(36)}-${idBase}`,
        eyebrow: partial?.eyebrow || '',
        heading: partial?.heading || '',
        text: partial?.text || '',
        linkText: partial?.linkText || '',
        linkUrl: partial?.linkUrl || '',
        imageId: partial?.imageId || 0,
        imageUrl: partial?.imageUrl || '',
        imageAlt: partial?.imageAlt || '',
    };
}

function coerceSlides(value: unknown): SwiperSlide[] {
    if (!Array.isArray(value)) return [];
    return value.map((s) => createSlide(s as Partial<SwiperSlide>));
}

export function Edit({ attributes, setAttributes, className }: EditorProps): JSX.Element {
    const {
        ariaLabel = 'Carousel',
        theme = 'light',
        showArrows = true,
        showDots = true,
        slides: rawSlides = [],
    } = attributes as any;

    const slides = coerceSlides(rawSlides);

    const blockProps = useBlockProps({
        className: ['renderkit-block', 'renderkit-swiper', `renderkit-swiper--${theme}`, className].filter(Boolean).join(' '),
    });

    const updateSlide = (index: number, patch: Partial<SwiperSlide>) => {
        const next = slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide));
        setAttributes({ slides: next });
    };

    const addSlide = () => {
        setAttributes({ slides: [...slides, createSlide({ heading: __('New Slide', 'renderkit') })] });
    };

    const removeSlide = (index: number) => {
        setAttributes({ slides: slides.filter((_, i) => i !== index) });
    };

    const moveSlide = (from: number, to: number) => {
        const next = slides.slice();
        const clampedTo = Math.max(0, Math.min(next.length - 1, to));
        const [item] = next.splice(from, 1);
        next.splice(clampedTo, 0, item);
        setAttributes({ slides: next });
    };

    const themeOptions = [
        { label: 'Light (Cream)', value: 'light' },
        { label: 'Dark (Anthracite)', value: 'dark' },
    ];

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Swiper Settings', 'renderkit')} initialOpen>
                    <TextControl
                        label={__('ARIA Label', 'renderkit')}
                        value={ariaLabel}
                        onChange={(value) => setAttributes({ ariaLabel: value })}
                        help={__('Used by screen readers to describe this carousel.', 'renderkit')}
                    />
                    <SelectControl
                        label={__('Theme', 'renderkit')}
                        value={theme}
                        options={themeOptions}
                        onChange={(value) => setAttributes({ theme: value as SwiperTheme })}
                    />
                    <ToggleControl
                        label={__('Show Arrows', 'renderkit')}
                        checked={showArrows}
                        onChange={(value) => setAttributes({ showArrows: value })}
                    />
                    <ToggleControl
                        label={__('Show Dots', 'renderkit')}
                        checked={showDots}
                        onChange={(value) => setAttributes({ showDots: value })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="rk-swiper__editor">
                    <div className="rk-swiper__editor-header">
                        <div>
                            <p className="rk-swiper__editor-title">Swiper</p>
                            <p className="rk-swiper__editor-subtitle">{__('No-JS fallback + optional JS controls.', 'renderkit')}</p>
                        </div>
                        <WPButton variant="primary" onClick={addSlide}>
                            {__('Add Slide', 'renderkit')}
                        </WPButton>
                    </div>

                    {slides.length === 0 ? (
                        <div className="rk-swiper__editor-empty">
                            <p>{__('No slides yet. Click “Add Slide”.', 'renderkit')}</p>
                        </div>
                    ) : (
                        <div className="rk-swiper__editor-list">
                            {slides.map((slide, index) => (
                                <div key={slide.id} className="rk-swiper__editor-card">
                                    <div className="rk-swiper__editor-card-head">
                                        <div className="rk-swiper__editor-card-index">{index + 1}</div>
                                        <div className="rk-swiper__editor-card-actions">
                                            <WPButton
                                                variant="secondary"
                                                onClick={() => moveSlide(index, index - 1)}
                                                disabled={index === 0}
                                            >
                                                ↑
                                            </WPButton>
                                            <WPButton
                                                variant="secondary"
                                                onClick={() => moveSlide(index, index + 1)}
                                                disabled={index === slides.length - 1}
                                            >
                                                ↓
                                            </WPButton>
                                            <WPButton isDestructive variant="secondary" onClick={() => removeSlide(index)}>
                                                {__('Remove', 'renderkit')}
                                            </WPButton>
                                        </div>
                                    </div>

                                    <div className="rk-swiper__editor-grid">
                                        <div className="rk-swiper__editor-media">
                                            {slide.imageUrl ? (
                                                <img className="rk-swiper__editor-thumb" src={slide.imageUrl} alt="" />
                                            ) : (
                                                <div className="rk-swiper__editor-thumb rk-swiper__editor-thumb--empty">Image</div>
                                            )}

                                            <MediaUploadCheck>
                                                <MediaUpload
                                                    onSelect={(media: any) =>
                                                        updateSlide(index, {
                                                            imageId: Number(media?.id || 0),
                                                            imageUrl: String(media?.url || ''),
                                                            imageAlt: String(media?.alt || ''),
                                                        })
                                                    }
                                                    allowedTypes={['image']}
                                                    value={slide.imageId || undefined}
                                                    render={({ open }: { open: () => void }) => (
                                                        <WPButton variant="secondary" onClick={open} className="is-full-width">
                                                            {slide.imageUrl ? __('Change Image', 'renderkit') : __('Select Image', 'renderkit')}
                                                        </WPButton>
                                                    )}
                                                />
                                            </MediaUploadCheck>

                                            {slide.imageUrl ? (
                                                <WPButton
                                                    isDestructive
                                                    variant="link"
                                                    onClick={() => updateSlide(index, { imageId: 0, imageUrl: '', imageAlt: '' })}
                                                >
                                                    {__('Remove Image', 'renderkit')}
                                                </WPButton>
                                            ) : null}
                                        </div>

                                        <div className="rk-swiper__editor-fields">
                                            <TextControl
                                                label={__('Eyebrow', 'renderkit')}
                                                value={slide.eyebrow}
                                                onChange={(value) => updateSlide(index, { eyebrow: value })}
                                            />
                                            <TextControl
                                                label={__('Heading', 'renderkit')}
                                                value={slide.heading}
                                                onChange={(value) => updateSlide(index, { heading: value })}
                                            />
                                            <WPTextareaControl
                                                label={__('Text', 'renderkit')}
                                                value={slide.text}
                                                onChange={(value: string) => updateSlide(index, { text: value })}
                                                rows={4}
                                            />
                                            <div className="rk-swiper__editor-row">
                                                <TextControl
                                                    label={__('Link Text', 'renderkit')}
                                                    value={slide.linkText}
                                                    onChange={(value) => updateSlide(index, { linkText: value })}
                                                />
                                                <TextControl
                                                    label={__('Link URL', 'renderkit')}
                                                    value={slide.linkUrl}
                                                    onChange={(value) => updateSlide(index, { linkUrl: value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Edit;
