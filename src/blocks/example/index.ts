/**
 * Example Block - Index
 * 
 * Re-exports all block components and metadata
 */

export { Edit } from './Edit';
export { View } from './View';
export { Save } from './save';
export * from './types';

// Block metadata
import blockJson from './block.json';
export const metadata = blockJson;
