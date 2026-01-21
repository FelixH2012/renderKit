/**
 * Script to add blockId support to all RenderKit blocks
 * Run with: node scripts/add-block-ids.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blocksDir = path.join(__dirname, '../src/blocks');

// Blocks to update (excluding hero and faq which are already done)
const blocks = [
    'text-image',
    'product-grid',
    'contact-form',
    'cart',
    'navigation',
    'footer',
    'swiper',
    'text-block',
    'cookie-banner',
    'cookie-gate'
];

function addBlockIdToBlockJson(blockPath, blockName) {
    const blockJsonPath = path.join(blockPath, 'block.json');
    if (!fs.existsSync(blockJsonPath)) return false;

    let content = fs.readFileSync(blockJsonPath, 'utf8');
    const json = JSON.parse(content);

    // Check if blockId already exists
    if (json.attributes?.blockId) return false;

    // Add blockId as first attribute
    const newAttributes = {
        blockId: { type: 'string', default: '' },
        ...json.attributes
    };
    json.attributes = newAttributes;

    fs.writeFileSync(blockJsonPath, JSON.stringify(json, null, 4) + '\n');
    console.log(`✓ Updated ${blockName}/block.json`);
    return true;
}

function addBlockIdToTypes(blockPath, blockName) {
    const typesPath = path.join(blockPath, 'types.ts');
    if (!fs.existsSync(typesPath)) return false;

    let content = fs.readFileSync(typesPath, 'utf8');

    // Check if blockId already exists
    if (content.includes('blockId')) return false;

    // Find the main interface and add blockId
    content = content.replace(
        /export interface \w+Attributes \{/,
        match => `${match}\n    blockId?: string;`
    );

    fs.writeFileSync(typesPath, content);
    console.log(`✓ Updated ${blockName}/types.ts`);
    return true;
}

function addBlockIdToEditor(blockPath, blockName) {
    const editorPath = path.join(blockPath, 'editor.tsx');
    if (!fs.existsSync(editorPath)) return false;

    let content = fs.readFileSync(editorPath, 'utf8');

    // Check if already updated
    if (content.includes('generateBlockId')) return false;

    // Add imports
    if (!content.includes("import { useEffect }")) {
        content = content.replace(
            /@wordpress\/components';/,
            "@wordpress/components';\nimport { useEffect } from '@wordpress/element';"
        );
    }

    content = content.replace(
        /from '\.\/types';/,
        "from './types';\nimport { generateBlockId } from '../../utils/blockId';"
    );

    // Add blockId to destructuring - handle various patterns
    content = content.replace(
        /const \{ ([^}]+) \} = attributes;/,
        (match, attrs) => `const { ${attrs}, blockId } = attributes;`
    );

    // Also handle "as any" pattern
    content = content.replace(
        /const \{ ([^}]+) \} = attributes as any;/,
        (match, attrs) => `const { ${attrs}, blockId } = attributes as any;`
    );

    // Add useEffect after destructuring
    const blockSlug = blockName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const useEffectCode = `

    // Auto-generate blockId on first render if not set
    useEffect(() => {
        if (!blockId) {
            setAttributes({ blockId: generateBlockId('${blockName}') });
        }
    }, []);
`;

    // Find the line with blockProps and insert before it
    content = content.replace(
        /(\s+)(const blockProps = useBlockProps)/,
        `${useEffectCode}$1$2`
    );

    fs.writeFileSync(editorPath, content);
    console.log(`✓ Updated ${blockName}/editor.tsx`);
    return true;
}

function addBlockIdToView(blockPath, blockName) {
    const viewPath = path.join(blockPath, 'view.tsx');
    if (!fs.existsSync(viewPath)) return false;

    let content = fs.readFileSync(viewPath, 'utf8');

    // Check if already updated
    if (content.includes('id={blockId')) return false;

    // Add blockId to destructuring
    content = content.replace(
        /const \{ ([^}]+) \} = attributes;/,
        (match, attrs) => `const { ${attrs}, blockId } = attributes;`
    );

    content = content.replace(
        /const \{ ([^}]+) \} = attributes as any;/,
        (match, attrs) => `const { ${attrs}, blockId } = attributes as any;`
    );

    // Add id attribute to section/div - handle both patterns
    content = content.replace(
        /<section\n?\s+className=/,
        '<section\n            id={blockId || undefined}\n            className='
    );

    content = content.replace(
        /<div\n?\s+className=\{sectionClasses\}/,
        '<div\n            id={blockId || undefined}\n            className={sectionClasses}'
    );

    fs.writeFileSync(viewPath, content);
    console.log(`✓ Updated ${blockName}/view.tsx`);
    return true;
}

console.log('🔧 Adding blockId support to RenderKit blocks...\n');

for (const block of blocks) {
    const blockPath = path.join(blocksDir, block);
    if (!fs.existsSync(blockPath)) {
        console.log(`⚠ Block not found: ${block}`);
        continue;
    }

    console.log(`\n📦 Processing ${block}...`);
    addBlockIdToBlockJson(blockPath, block);
    addBlockIdToTypes(blockPath, block);
    addBlockIdToEditor(blockPath, block);
    addBlockIdToView(blockPath, block);
}

console.log('\n✅ Done! Run `npm run build` to compile changes.');
