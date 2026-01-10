/**
 * RenderKit - Frontend View Entry Point
 */

import React, { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/main.css';

// Block View components
import { View as HeroView } from '../blocks/hero/view';
import { View as NavView } from '../blocks/navigation/view';
import { View as ExampleView } from '../blocks/example/View';

const registry: Record<string, React.ComponentType<any>> = {
    hero: HeroView,
    navigation: NavView,
    example: ExampleView,
};

function hydrate() {
    document.querySelectorAll<HTMLElement>('[data-renderkit-block]').forEach((el) => {
        const name = el.getAttribute('data-renderkit-block');
        const props = JSON.parse(el.getAttribute('data-renderkit-props') || '{}');
        const Component = name ? registry[name] : null;

        if (Component) {
            createRoot(el).render(createElement(Component, { attributes: props, className: el.className }));
        }
    });
}

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', hydrate)
    : hydrate();
