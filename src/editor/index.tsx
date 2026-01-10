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

// Product Grid Block
import { Edit as ProductGridEdit } from '../blocks/product-grid/editor';
import productGridMeta from '../blocks/product-grid/block.json';

// Swiper Block
import { Edit as SwiperEdit } from '../blocks/swiper/editor';
import swiperMeta from '../blocks/swiper/block.json';

// Text Block
import { Edit as TextBlockEdit, save as TextBlockSave } from '../blocks/text-block/editor';
import textBlockMeta from '../blocks/text-block/block.json';

// Footer Block
import { Edit as FooterEdit, save as FooterSave } from '../blocks/footer/editor';
import footerMeta from '../blocks/footer/block.json';

// Dynamic blocks return null for save
const nullSave = () => null;

type BlockRegistration = {
    meta: any;
    edit: any;
    save?: any;
    icon?: any;
};

// Custom RenderKit icon component
const RenderKitIcon = () => (
    <img
        src={`${(window as any).renderKitData?.pluginUrl || ''}resources/renderKitLogo.png`}
        alt="RenderKit"
        style={{ width: 24, height: 24, objectFit: 'contain' }}
    />
);

// Register blocks
const blocks: BlockRegistration[] = [
    { meta: heroMeta, edit: HeroEdit, icon: RenderKitIcon },
    { meta: navMeta, edit: NavEdit, icon: 'menu' },
    { meta: productGridMeta, edit: ProductGridEdit, icon: 'grid-view' },
    { meta: swiperMeta, edit: SwiperEdit, icon: 'images-alt2' },
    { meta: textBlockMeta, edit: TextBlockEdit, save: TextBlockSave, icon: 'editor-paragraph' },
    { meta: footerMeta, edit: FooterEdit, save: FooterSave, icon: 'admin-site' },
];

blocks.forEach(({ meta, edit, save, icon }) => {
    const { name, ...settings } = meta;
    registerBlockType(name, {
        ...settings,
        edit,
        save: save || nullSave,
        icon: icon || settings.icon,
    });
});
