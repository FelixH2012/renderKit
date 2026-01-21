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
        className: [
            'renderkit-block',
            'renderkit-product-grid',
            className,
        ].filter(Boolean).join(' '),
    });

    const colSpanClasses: Record<number, string> = {
        7: 'col-span-7',
        5: 'col-span-5',
        4: 'col-span-4',
    };
    const rowSpanClasses: Record<number, string> = {
        2: 'row-span-2',
        1: 'row-span-1',
    };

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

            <div {...blockProps}>
                <div className="rk-product-grid__editor-shell">
                    {/* Header */}
                    <div className="rk-product-grid__editor-header">
                        <div className="rk-product-grid__editor-kicker">
                            <Sparkles className="h-4 w-4" />
                            Unsere Kollektion
                        </div>
                    </div>

                    {/* Bento Grid */}
                    <div className="rk-product-grid__editor-grid">
                        {placeholders.map((product) => (
                            <div
                                key={product.id}
                                className={[
                                    colSpanClasses[product.span.col] || 'col-span-4',
                                    rowSpanClasses[product.span.row] || 'row-span-1',
                                    'relative',
                                    'overflow-hidden',
                                    'min-h-[200px]',
                                    product.span.featured ? 'min-h-[400px]' : '',
                                    'bg-[linear-gradient(135deg,#E8E3DB_0%,#D4CEC4_100%)]',
                                ].filter(Boolean).join(' ')}
                            >
                                {/* Emoji placeholder */}
                                <div
                                    className={[
                                        'absolute',
                                        'inset-0',
                                        'flex',
                                        'items-center',
                                        'justify-center',
                                        'opacity-50',
                                        product.span.featured ? 'text-[4rem]' : 'text-[2.5rem]',
                                    ].join(' ')}
                                >
                                    🕯️
                                </div>

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(26,24,22,0.8)_100%)]" />

                            {/* Content */}
                            <div className="rk-product-grid__editor-card-content absolute bottom-0 left-0 right-0">
                                <p className="rk-product-grid__editor-excerpt">
                                    {product.excerpt}
                                </p>
                                <h3
                                    className={[
                                        product.span.featured ? 'text-[1.25rem]' : 'text-[0.875rem]',
                                            'font-light',
                                            'text-cream',
                                            'm-0',
                                        ].join(' ')}
                                >
                                    {product.title}
                                </h3>
                                {showPrice && (
                                    <p className="rk-product-grid__editor-price">
                                        ab €{product.price.toFixed(2)}
                                    </p>
                                )}
                            </div>

                                {/* Gold line */}
                                <div className="absolute bottom-0 left-0 h-[2px] w-[30%] bg-[linear-gradient(90deg,#B8975A,transparent)]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Edit;
