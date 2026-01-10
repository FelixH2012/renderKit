import * as esbuild from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import * as fs from 'fs';
import * as path from 'path';

const isWatch = process.argv.includes('--watch');

// WordPress externals - these are provided by WordPress at runtime
const wpExternals = [
    '@wordpress/blocks',
    '@wordpress/block-editor',
    '@wordpress/components',
    '@wordpress/compose',
    '@wordpress/core-data',
    '@wordpress/data',
    '@wordpress/element',
    '@wordpress/hooks',
    '@wordpress/i18n',
    '@wordpress/icons',
    '@wordpress/primitives',
    'react',
    'react-dom',
];

// Map package names to WordPress global variables
const wpGlobals = {
    '@wordpress/blocks': 'wp.blocks',
    '@wordpress/block-editor': 'wp.blockEditor',
    '@wordpress/components': 'wp.components',
    '@wordpress/compose': 'wp.compose',
    '@wordpress/core-data': 'wp.coreData',
    '@wordpress/data': 'wp.data',
    '@wordpress/element': 'wp.element',
    '@wordpress/hooks': 'wp.hooks',
    '@wordpress/i18n': 'wp.i18n',
    '@wordpress/icons': 'wp.icons',
    '@wordpress/primitives': 'wp.primitives',
    'react': 'React',
    'react-dom': 'ReactDOM',
};

// Plugin to handle WordPress externals
const wpExternalsPlugin = {
    name: 'wp-externals',
    setup(build) {
        // Handle WordPress externals
        build.onResolve({ filter: new RegExp(`^(${wpExternals.join('|')})$`) }, (args) => {
            return {
                path: args.path,
                namespace: 'wp-external',
            };
        });

        build.onLoad({ filter: /.*/, namespace: 'wp-external' }, (args) => {
            const globalVar = wpGlobals[args.path];
            return {
                contents: `module.exports = ${globalVar};`,
                loader: 'js',
            };
        });
    },
};

// PostCSS plugin for Tailwind
const postCSSPlugin = {
    name: 'postcss',
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const css = await fs.promises.readFile(args.path, 'utf8');
            const result = await postcss([
                tailwindcss,
                autoprefixer,
            ]).process(css, { from: args.path });

            return {
                contents: result.css,
                loader: 'css',
            };
        });
    },
};

// Common build options
const commonOptions = {
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch,
    target: ['es2020'],
    plugins: [wpExternalsPlugin, postCSSPlugin],
    logLevel: 'info',
};

// Build configurations
const builds = [
    // Editor bundle
    {
        ...commonOptions,
        entryPoints: ['src/editor/index.tsx'],
        outfile: 'build/editor.js',
        platform: 'browser',
        format: 'iife',
    },
    // Frontend view bundle
    {
        ...commonOptions,
        entryPoints: ['src/view/index.tsx'],
        outfile: 'build/view.js',
        platform: 'browser',
        format: 'iife',
    },
];

// Build CSS separately
async function buildCSS() {
    const cssPath = path.resolve('src/styles/main.css');
    if (!fs.existsSync(cssPath)) {
        console.log('No CSS file found at src/styles/main.css');
        return;
    }

    const css = await fs.promises.readFile(cssPath, 'utf8');
    const result = await postcss([
        tailwindcss,
        autoprefixer,
    ]).process(css, { from: cssPath });

    const outputDir = path.resolve('build');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    await fs.promises.writeFile(path.join(outputDir, 'style.css'), result.css);
    console.log('✓ Built build/style.css');
}

// Run builds
async function runBuilds() {
    try {
        // Ensure build directory exists
        if (!fs.existsSync('build')) {
            fs.mkdirSync('build', { recursive: true });
        }

        if (isWatch) {
            console.log('👀 Watching for changes...\n');

            // Create contexts for watch mode
            const contexts = await Promise.all(
                builds.map((config) => esbuild.context(config))
            );

            // Start watching
            await Promise.all(contexts.map((ctx) => ctx.watch()));

            // Watch CSS changes
            const chokidar = await import('chokidar').catch(() => null);
            if (chokidar) {
                chokidar.watch('src/**/*.css').on('change', buildCSS);
            }

            // Initial CSS build
            await buildCSS();

            // Keep process alive
            process.stdin.resume();
        } else {
            console.log('🔨 Building for production...\n');

            await Promise.all(builds.map((config) => esbuild.build(config)));
            await buildCSS();

            console.log('\n✅ Build complete!');
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

runBuilds();
