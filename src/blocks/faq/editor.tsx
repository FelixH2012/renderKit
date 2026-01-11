/**
 * FAQ Block - Editor Component
 */

import React from 'react';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, TextareaControl, ToggleControl, Button } from '@wordpress/components';
import type { FaqAttributes, FaqItem } from './types';

interface EditProps {
    attributes: FaqAttributes;
    setAttributes: (attrs: Partial<FaqAttributes>) => void;
}

export function Edit({ attributes, setAttributes }: EditProps): JSX.Element {
    const {
        heading,
        intro,
        theme,
        openFirst,
        items,
    } = attributes;

    const blockProps = useBlockProps({
        className: [
            'renderkit-faq',
            `renderkit-faq--${theme}`,
        ]
            .filter(Boolean)
            .join(' '),
    });

    const updateItem = (index: number, patch: Partial<FaqItem>) => {
        const next = items.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
        setAttributes({ items: next });
    };

    const removeItem = (index: number) => {
        const next = items.filter((_, idx) => idx !== index);
        setAttributes({ items: next });
    };

    const addItem = () => {
        const next = [
            ...items,
            {
                question: 'Neue Frage',
                answer: 'Antwort hier eintragen.',
            },
        ];
        setAttributes({ items: next });
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
                        label="Intro"
                        value={intro}
                        onChange={(value) => setAttributes({ intro: value })}
                    />
                    <ToggleControl
                        label="Open first item"
                        checked={Boolean(openFirst)}
                        onChange={(value) => setAttributes({ openFirst: value })}
                    />
                </PanelBody>
                <PanelBody title="Items" initialOpen={false}>
                    {items.map((item, index) => (
                        <div key={`${item.question}-${index}`} style={{ marginBottom: '1rem' }}>
                            <TextControl
                                label="Question"
                                value={item.question}
                                onChange={(value) => updateItem(index, { question: value })}
                            />
                            <TextareaControl
                                label="Answer"
                                value={item.answer}
                                onChange={(value) => updateItem(index, { answer: value })}
                            />
                            <Button isDestructive onClick={() => removeItem(index)}>
                                Remove item
                            </Button>
                        </div>
                    ))}
                    <Button variant="secondary" onClick={addItem}>
                        Add item
                    </Button>
                </PanelBody>
                <PanelBody title="Appearance" initialOpen={false}>
                    <TextControl
                        label="Theme"
                        value={theme}
                        onChange={(value) => setAttributes({ theme: value as 'light' | 'dark' })}
                        help="Use light or dark."
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="rk-faq__inner">
                    <div className="rk-faq__header">
                        <div className="rk-faq__bar" aria-hidden="true" />
                        <h2 className="rk-faq__heading">{heading || 'Haeufige Fragen'}</h2>
                        {intro ? <p className="rk-faq__intro">{intro}</p> : null}
                    </div>
                    <div className="rk-faq__list">
                        {items.map((item, index) => (
                            <details key={`${item.question}-${index}`} className="rk-faq__item" open={openFirst && index === 0}>
                                <summary className="rk-faq__question">
                                    <span>{item.question}</span>
                                    <i className="rk-faq__icon fa-solid fa-plus" aria-hidden="true" />
                                </summary>
                                <div className="rk-faq__answer">{item.answer}</div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Edit;
