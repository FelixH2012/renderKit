/**
 * FAQ Block - Editor Component
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl, Button, TextareaControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import type { FaqAttributes, FaqItem } from './types';
import { generateBlockId } from '../../utils/blockId';

interface EditProps {
    attributes: FaqAttributes;
    setAttributes: (attrs: Partial<FaqAttributes>) => void;
    className?: string;
}

export function Edit({ attributes, setAttributes, className }: EditProps): JSX.Element {
    const { heading, intro, theme, openFirst, items, blockId } = attributes;

    // Auto-generate blockId on first render if not set
    useEffect(() => {
        if (!blockId) {
            setAttributes({ blockId: generateBlockId('faq') });
        }
    }, []);

    const blockProps = useBlockProps({
        className: `renderkit-block renderkit-faq renderkit-faq--${theme} ${className || ''}`.trim(),
    });

    const updateItem = (index: number, field: keyof FaqItem, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setAttributes({ items: newItems });
    };

    const addItem = () => {
        setAttributes({
            items: [...items, { question: 'Neue Frage', answer: 'Antwort hier eingeben...' }],
        });
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setAttributes({ items: newItems });
    };

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('FAQ Settings', 'renderkit')} initialOpen>
                    <SelectControl
                        label={__('Theme', 'renderkit')}
                        value={theme}
                        options={[
                            { label: 'Light', value: 'light' },
                            { label: 'Dark', value: 'dark' },
                        ]}
                        onChange={(v) => setAttributes({ theme: v as 'light' | 'dark' })}
                    />
                    <ToggleControl
                        label={__('Open first item by default', 'renderkit')}
                        checked={openFirst}
                        onChange={(v) => setAttributes({ openFirst: v })}
                    />
                </PanelBody>

                <PanelBody title={__('FAQ Items', 'renderkit')} initialOpen={false}>
                    {items.map((item, index) => (
                        <div key={index} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                            <TextareaControl
                                label={`${__('Question', 'renderkit')} ${index + 1}`}
                                value={item.question}
                                onChange={(v) => updateItem(index, 'question', v)}
                            />
                            <TextareaControl
                                label={__('Answer', 'renderkit')}
                                value={item.answer}
                                onChange={(v) => updateItem(index, 'answer', v)}
                            />
                            <Button
                                isDestructive
                                variant="secondary"
                                onClick={() => removeItem(index)}
                                style={{ marginTop: '0.5rem' }}
                            >
                                {__('Remove', 'renderkit')}
                            </Button>
                        </div>
                    ))}
                    <Button variant="primary" onClick={addItem}>
                        {__('Add FAQ Item', 'renderkit')}
                    </Button>
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className="rk-faq__inner">
                    <header className="rk-faq__header">
                        <RichText
                            tagName="h2"
                            className="rk-faq__heading"
                            value={heading}
                            onChange={(v: string) => setAttributes({ heading: v })}
                            placeholder={__('FAQ Heading...', 'renderkit')}
                        />
                        <RichText
                            tagName="p"
                            className="rk-faq__intro"
                            value={intro}
                            onChange={(v: string) => setAttributes({ intro: v })}
                            placeholder={__('Optional intro text...', 'renderkit')}
                        />
                    </header>

                    <div className="rk-faq__list">
                        {items.map((item, index) => (
                            <details key={index} className="rk-faq__item" open={index === 0}>
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
            </div>
        </>
    );
}

export default Edit;
