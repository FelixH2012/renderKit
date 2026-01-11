/**
 * renderKit-Relay renderer bundle.
 *
 * This file is built for Node and executed inside the Relay service.
 */

import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { View as HeroView } from '../blocks/hero/view';
import { View as NavigationView } from '../blocks/navigation/view';
import { View as ProductGridView } from '../blocks/product-grid/view';
import { View as SwiperView } from '../blocks/swiper/view';
import { View as TextBlockView } from '../blocks/text-block/view';
import { View as FooterView } from '../blocks/footer/view';
import { View as TextImageView } from '../blocks/text-image/view';
import { View as ContactFormView } from '../blocks/contact-form/view';
import { View as ProductPageView } from '../pages/product-page/view';
import { relayPropsSchemas } from './schemas';

export const relayVersion = '1';

const registry: Record<string, React.ComponentType<any>> = {
    'renderkit/hero': HeroView,
    'renderkit/navigation': NavigationView,
    'renderkit/product-grid': ProductGridView,
    'renderkit/swiper': SwiperView,
    'renderkit/text-block': TextBlockView,
    'renderkit/footer': FooterView,
    'renderkit/text-image': TextImageView,
    'renderkit/contact-form': ContactFormView,
    'renderkit/product-page': ProductPageView,
};

const validatedPropsSymbol = Symbol.for('renderkit.relay.validatedProps');

export class RelayPayloadError extends Error {
    code: 'unsupported_block' | 'invalid_props';

    constructor(code: RelayPayloadError['code'], details?: unknown) {
        super(code);
        this.name = 'RelayPayloadError';
        this.code = code;
        if (details) {
            (this as { details?: unknown }).details = details;
        }
    }
}

function markValidated<T>(value: T): T {
    if (value && typeof value === 'object') {
        try {
            Object.defineProperty(value, validatedPropsSymbol, {
                value: true,
                enumerable: false,
            });
        } catch {
            // ignore
        }
    }
    return value;
}

export function validateRelayProps(block: string, props: unknown): unknown {
    const schema = (relayPropsSchemas as Record<string, { safeParse: (value: unknown) => any }>)[block];
    if (!schema) {
        throw new RelayPayloadError('unsupported_block');
    }

    const result = schema.safeParse(props);
    if (!result.success) {
        throw new RelayPayloadError('invalid_props', result.error.issues);
    }

    return markValidated(result.data);
}

export function renderRelay(block: string, props: unknown): string {
    const Component = registry[block];
    if (!Component) {
        throw new RelayPayloadError('unsupported_block');
    }

    const isValidated = Boolean(
        props && typeof props === 'object' && (props as Record<symbol, unknown>)[validatedPropsSymbol] === true
    );

    const safeProps = isValidated ? props : validateRelayProps(block, props);
    const element = createElement(Component, safeProps as any);
    return renderToStaticMarkup(element);
}
