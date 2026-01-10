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

export const relayVersion = '1';

const registry: Record<string, React.ComponentType<any>> = {
    'renderkit/hero': HeroView,
    'renderkit/navigation': NavigationView,
    'renderkit/product-grid': ProductGridView,
    'renderkit/swiper': SwiperView,
    'renderkit/text-block': TextBlockView,
    'renderkit/footer': FooterView,
};

export function renderRelay(block: string, props: Record<string, unknown>): string {
    const Component = registry[block];
    if (!Component) {
        throw new Error(`renderKit-Relay: unsupported block "${block}"`);
    }

    const element = createElement(Component, props);
    return renderToStaticMarkup(element);
}
