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
import { View as CookieBannerView } from '../blocks/cookie-banner/view';
import { View as CookieGateView } from '../blocks/cookie-gate/view';
import { View as FaqView } from '../blocks/faq/view';
import { View as CartView } from '../blocks/cart/view';
import { View as ProductPageView } from '../pages/product-page/view';
import { View as ProductArchiveView } from '../pages/product-archive/view';
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
    'renderkit/cookie-banner': CookieBannerView,
    'renderkit/cookie-gate': CookieGateView,
    'renderkit/faq': FaqView,
    'renderkit/cart': CartView,
    'renderkit/product-page': ProductPageView,
    'renderkit/product-archive': ProductArchiveView,
};

const validatedPropsSymbol = Symbol.for('renderkit.relay.validatedProps');

type RelayErrorCode = 'unsupported_block' | 'invalid_props';

export type InvariantResponse<T> =
    | { ok: true; value: T; invariant: true }
    | { ok: false; error: RelayErrorCode; details?: unknown; invariant: true };

export function invariantResponse(error: RelayErrorCode, details?: unknown): InvariantResponse<never> {
    if (details === undefined) {
        return { ok: false, error, invariant: true };
    }
    return { ok: false, error, details, invariant: true };
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

export function validateRelayProps(block: string, props: unknown): InvariantResponse<unknown> {
    const schema = (relayPropsSchemas as Record<string, { safeParse: (value: unknown) => any }>)[block];
    if (!schema) {
        return invariantResponse('unsupported_block');
    }

    const result = schema.safeParse(props);
    if (!result.success) {
        return invariantResponse('invalid_props', result.error.issues);
    }

    return { ok: true, value: markValidated(result.data), invariant: true };
}

export function renderRelay(block: string, props: unknown): InvariantResponse<string> {
    const Component = registry[block];
    if (!Component) {
        return invariantResponse('unsupported_block');
    }

    const isValidated = Boolean(
        props && typeof props === 'object' && (props as Record<symbol, unknown>)[validatedPropsSymbol] === true
    );

    let safeProps = props;
    if (!isValidated) {
        const validation = validateRelayProps(block, props);
        if (!validation.ok) {
            return validation;
        }
        safeProps = validation.value;
    }

    const element = createElement(Component, safeProps as any);
    return { ok: true, value: renderToStaticMarkup(element), invariant: true };
}
