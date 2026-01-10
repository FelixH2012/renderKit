/**
 * RenderKit - Editor Entry Point
 */

import { registerBlockType } from '@wordpress/blocks';
import '../styles/main.css';
import '../styles/editor.css';

// Hero Block
import { Edit as HeroEdit } from '../blocks/hero/editor';
import heroMeta from '../blocks/hero/block.json';

// Navigation Block
import { Edit as NavEdit } from '../blocks/navigation/editor';
import navMeta from '../blocks/navigation/block.json';

// Example Block
import { Edit as ExampleEdit } from '../blocks/example/Edit';
import exampleMeta from '../blocks/example/block.json';

// Dynamic blocks return null for save
const nullSave = () => null;

// Custom RenderKit icon component
const RenderKitIcon = () => (
    <img
        src={`${(window as any).renderKitData?.pluginUrl || ''}resources/renderKitLogo.png`}
        alt="RenderKit"
        style={{ width: 24, height: 24, objectFit: 'contain' }}
    />
);

// Register blocks
const blocks = [
    { meta: heroMeta, edit: HeroEdit, icon: RenderKitIcon },
    { meta: navMeta, edit: NavEdit, icon: 'menu' },
    { meta: exampleMeta, edit: ExampleEdit, icon: 'star-filled' },
];

blocks.forEach(({ meta, edit, icon }) => {
    const { name, ...settings } = meta;
    registerBlockType(name, {
        ...settings,
        edit,
        save: nullSave,
        icon: icon || settings.icon,
    });
});
