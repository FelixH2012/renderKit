/**
 * Product Grid Block - Editor Component
 * 
 * Bento grid preview for Gutenberg editor
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Sparkles } from 'lucide-react';

interface ProductGridAttributes {
    columns: number;
    count: number;
    category: number;
    showPrice: boolean;
    showButton: boolean;
}

interface EditProps {
    attributes: ProductGridAttributes;
    setAttributes: (attrs: Partial<ProductGridAttributes>) => void;
    className?: string;
}

// Bento spans for editor preview
const bentoSpans = [
    { col: 7, row: 2, featured: true },
    { col: 5, row: 1, featured: false },
    { col: 5, row: 1, featured: false },
    { col: 7, row: 1, featured: false },
    { col: 4, row: 1, featured: false },
    { col: 4, row: 1, featured: false },
];

const categoryQuery = { per_page: 100, orderby: 'name', order: 'asc', _fields: 'id,name' };

export function Edit({ attributes, setAttributes, className }: EditProps): JSX.Element {
    const { count, showPrice, showButton, category } = attributes;

    const { categories, hasResolved } = useSelect((select) => {
        const records = select('core').getEntityRecords('taxonomy', 'rk_product_category', categoryQuery) as
            | Array<{ id: number; name: string }>
            | null
            | undefined;
        return {
            categories: records ?? [],
            hasResolved: select('core').hasFinishedResolution('getEntityRecords', [
                'taxonomy',
                'rk_product_category',
                categoryQuery,
            ]),
        };
    }, []);

    const categoryOptions = [
        { label: __('All categories', 'renderkit'), value: '0' },
        ...categories.map((term) => ({
            label: term.name,
            value: String(term.id),
        })),
    ];

    const blockProps = useBlockProps({
        className: `renderkit-block renderkit-product-grid ${className || ''}`,
    });

    // Placeholder products
    const placeholders = Array.from({ length: Math.min(count, 6) }, (_, i) => ({
        id: i,
        title: ['Personalisierte Geschenke', 'Handarbeit', 'Leise Worte', 'Premium Sets', 'Klassiker', 'Neu'][i] || `Produkt ${i + 1}`,
        excerpt: ['Individuelle Gravuren', 'Gehäkelte Körbe', 'Emotionale Kerzen', 'Kuratierte Kollektionen', 'Zeitlos schön', 'Frisch eingetroffen'][i] || 'Handgefertigt',
        price: [29.99, 39.99, 49.99, 89.99, 24.99, 34.99][i] || 29.99,
        span: bentoSpans[i] || bentoSpans[bentoSpans.length - 1],
    }));

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Bento Grid Settings', 'renderkit')} initialOpen>
                    <RangeControl
                        label={__('Products to show', 'renderkit')}
                        value={count}
                        onChange={(v) => setAttributes({ count: v })}
                        min={1}
                        max={6}
                    />
                    <p className="components-base-control__help">
                        {__('Bento grid works best with 4-6 products', 'renderkit')}
                    </p>
                    <SelectControl
                        label={__('Category', 'renderkit')}
                        value={String(category)}
                        options={categoryOptions}
                        onChange={(value) => setAttributes({ category: Number(value) || 0 })}
                        help={!hasResolved ? __('Loading categories...', 'renderkit') : undefined}
                    />
                </PanelBody>
                <PanelBody title={__('Display Options', 'renderkit')} initialOpen={false}>
                    <ToggleControl
                        label={__('Show Price', 'renderkit')}
                        checked={showPrice}
                        onChange={(v) => setAttributes({ showPrice: v })}
                    />
                    <ToggleControl
                        label={__('Show Button', 'renderkit')}
                        checked={showButton}
                        onChange={(v) => setAttributes({ showButton: v })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps} style={{ background: 'linear-gradient(180deg, #FFFEF9 0%, #F5F4F2 100%)', padding: '3rem 2rem' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#B8975A',
                        fontSize: '0.75rem',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                    }}>
                        <Sparkles style={{ width: '1rem', height: '1rem' }} />
                        Unsere Kollektion
                    </div>
                </div>

                {/* Bento Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '1rem',
                    gridAutoRows: 'minmax(200px, auto)',
                }}>
                    {placeholders.map((product) => (
                        <div
                            key={product.id}
                            style={{
                                gridColumn: `span ${product.span.col}`,
                                gridRow: `span ${product.span.row}`,
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: 0,
                                minHeight: product.span.featured ? '400px' : '200px',
                                background: 'linear-gradient(135deg, #E8E3DB 0%, #D4CEC4 100%)',
                            }}
                        >
                            {/* Emoji placeholder */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: product.span.featured ? '4rem' : '2.5rem',
                                opacity: 0.5,
                            }}>
                                🕯️
                            </div>

                            {/* Gradient overlay */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, transparent 30%, rgba(26, 24, 22, 0.8) 100%)',
                            }} />

                            {/* Content */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '1.5rem',
                            }}>
                                <p style={{
                                    fontSize: '0.625rem',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    color: '#B8975A',
                                    marginBottom: '0.25rem',
                                }}>
                                    {product.excerpt}
                                </p>
                                <h3 style={{
                                    fontSize: product.span.featured ? '1.25rem' : '0.875rem',
                                    fontWeight: 300,
                                    color: '#FFFEF9',
                                    margin: 0,
                                }}>
                                    {product.title}
                                </h3>
                                {showPrice && (
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,254,249,0.6)',
                                        marginTop: '0.25rem'
                                    }}>
                                        ab €{product.price.toFixed(2)}
                                    </p>
                                )}
                            </div>

                            {/* Gold line */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '30%',
                                height: '2px',
                                background: 'linear-gradient(90deg, #B8975A, transparent)',
                            }} />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Edit;
