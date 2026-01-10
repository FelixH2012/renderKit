/**
 * Text Block - Frontend View Component
 *
 * Rendered server-side via renderKit-Relay.
 * Uses InnerBlocks rendered HTML passed as `content`.
 */

import React from 'react';
import type { TextBlockAttributes } from './types';

interface ViewProps {
    attributes: TextBlockAttributes;
    content?: string;
    className?: string;
}

export function View({ attributes, content = '', className }: ViewProps): JSX.Element {
    const { theme = 'light', width = 'narrow' } = attributes as any;

    const sectionClasses = [
        'renderkit-block',
        'renderkit-text-block',
        `renderkit-text-block--${theme}`,
        `renderkit-text-block--${width}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className={sectionClasses}>
            <div className="rk-text-block__inner">
                <div className="rk-prose" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        </section>
    );
}

export default View;

