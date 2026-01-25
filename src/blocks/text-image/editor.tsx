/**
 * Text-Image Block - Editor Component
 */

import React from 'react';
import {
    InspectorControls,
    MediaUpload,
    useBlockProps,
} from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    TextareaControl,
    SelectControl,
    Button,
    // @ts-expect-error - FocalPointPicker exists but lacks TypeScript types
    FocalPointPicker,
} from '@wordpress/components';
import type { TextImageAttributes } from './types';

type FocalPoint = { x: number; y: number };

interface EditProps {
    attributes: TextImageAttributes;
    setAttributes: (attrs: Partial<TextImageAttributes>) => void;
}

export function Edit({ attributes, setAttributes }: EditProps): JSX.Element {
    const {
        heading,
        description,
        imageUrl,
        imageAlt,
        imagePosition,
        focalPoint = { x: 0.5, y: 0.5 },
        imageScale = 'cover',
        buttonText,
        buttonUrl,
        theme,
    } = attributes;

    const blockProps = useBlockProps({
        className: [
            'renderkit-block',
            'renderkit-text-image',
            `renderkit-text-image--${theme}`,
            imagePosition === 'left' && 'renderkit-text-image--image-left',
        ]
            .filter(Boolean)
            .join(' '),
    });
    const shellClasses = 'rk-text-image__shell';

    const onSelectImage = (media: { url: string; alt: string; id: number }) => {
        setAttributes({
            imageUrl: media.url,
            imageAlt: media.alt || '',
            imageId: media.id,
        });
    };

    const onRemoveImage = () => {
        setAttributes({
            imageUrl: '',
            imageAlt: '',
            imageId: 0,
        });
    };

    return (
        <>
            <InspectorControls>
                <PanelBody title="Content" initialOpen={true}>
                    <TextControl
                        label="Heading"
                        value={heading}
                        onChange={(value) => setAttributes({ heading: value })}
                    />
                    <TextareaControl
                        label="Description"
                        value={description}
                        onChange={(value) => setAttributes({ description: value })}
                    />
                </PanelBody>
                <PanelBody title="Image" initialOpen={true}>
                    <MediaUpload
                        onSelect={onSelectImage}
                        allowedTypes={['image']}
                        render={({ open }: { open: () => void }) => (
                            <div style={{ marginBottom: '1rem' }}>
                                {imageUrl ? (
                                    <>
                                        <div style={{
                                            marginBottom: '0.75rem',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid #ddd'
                                        }}>
                                            <FocalPointPicker
                                                url={imageUrl}
                                                value={focalPoint}
                                                onChange={(newFocalPoint: FocalPoint) =>
                                                    setAttributes({ focalPoint: newFocalPoint })
                                                }
                                            />
                                        </div>
                                        <p style={{
                                            marginBottom: '0.75rem',
                                            fontSize: '12px',
                                            color: '#757575',
                                            lineHeight: 1.4
                                        }}>
                                            Click on the image to set the focus point.
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button onClick={onRemoveImage} variant="secondary" isDestructive>
                                                Remove
                                            </Button>
                                            <Button onClick={open} variant="secondary">
                                                Replace
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <Button onClick={open} variant="primary">
                                        Select Image
                                    </Button>
                                )}
                            </div>
                        )}
                    />
                    <TextControl
                        label="Alt Text"
                        value={imageAlt}
                        onChange={(value) => setAttributes({ imageAlt: value })}
                    />
                    <SelectControl
                        label="Image Position"
                        value={imagePosition}
                        options={[
                            { label: 'Right', value: 'right' },
                            { label: 'Left', value: 'left' },
                        ]}
                        onChange={(value) =>
                            setAttributes({ imagePosition: value as 'left' | 'right' })
                        }
                    />
                    <SelectControl
                        label="Image Scale"
                        value={imageScale}
                        options={[
                            { label: 'Fill (Cover)', value: 'cover' },
                            { label: 'Fit (Contain)', value: 'contain' },
                        ]}
                        onChange={(value) =>
                            setAttributes({ imageScale: value as 'cover' | 'contain' })
                        }
                        help={imageScale === 'cover'
                            ? 'Image fills the container, may be cropped.'
                            : 'Entire image visible, may show empty space.'}
                    />
                </PanelBody>
                <PanelBody title="Call to Action" initialOpen={false}>
                    <TextControl
                        label="Button Text"
                        value={buttonText}
                        onChange={(value) => setAttributes({ buttonText: value })}
                    />
                    <TextControl
                        label="Button URL"
                        value={buttonUrl}
                        onChange={(value) => setAttributes({ buttonUrl: value })}
                    />
                </PanelBody>
                <PanelBody title="Appearance" initialOpen={false}>
                    <SelectControl
                        label="Theme"
                        value={theme}
                        options={[
                            { label: 'Light', value: 'light' },
                            { label: 'Dark', value: 'dark' },
                        ]}
                        onChange={(value) =>
                            setAttributes({ theme: value as 'light' | 'dark' })
                        }
                    />
                </PanelBody>
            </InspectorControls>
            <div {...blockProps}>
                <div className={shellClasses}>
                    <div className="rk-text-image__inner rk-container-wide">
                        <div className="rk-text-image__grid">
                            <div className="rk-text-image__content">
                                <h2 className="rk-text-image__heading rk-heading-section">{heading || 'Heading'}</h2>
                                <p className="rk-text-image__description">
                                    {description || 'Description text...'}
                                </p>
                                {buttonText && (
                                    <span className="rk-text-image__cta rk-cta rk-cta--responsive rk-cta--disabled">
                                        <span className="rk-text-image__cta-text rk-cta__text">{buttonText}</span>
                                        <svg
                                            className="rk-text-image__cta-arrow rk-cta__arrow"
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
                                    </span>
                                )}
                            </div>
                            <div className="rk-text-image__media">
                                {imageUrl ? (
                                    <img
                                        className="rk-text-image__img"
                                        src={imageUrl}
                                        alt={imageAlt || ''}
                                        style={{
                                            objectFit: imageScale,
                                            objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`,
                                        }}
                                    />
                                ) : (
                                    <div className="rk-text-image__placeholder">
                                        <span>Select an image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Edit;
