/**
 * Example Block - Save Component (returns null for dynamic blocks)
 */

import type { ExampleBlockAttributes } from './types';

/**
 * Save component - returns null because this is a dynamic block
 * Content is rendered via PHP render_callback on the server
 */
export function Save(): null {
    return null;
}

export default Save;
