import * as esbuild from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
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
    '@wordpress/editor',
    '@wordpress/edit-post',
    '@wordpress/plugins',
    '@wordpress/notices',
    '@wordpress/api-fetch',
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
    '@wordpress/editor': 'wp.editor',
    '@wordpress/edit-post': 'wp.editPost',
    '@wordpress/plugins': 'wp.plugins',
    '@wordpress/notices': 'wp.notices',
    '@wordpress/api-fetch': 'wp.apiFetch',
    react: 'React',
    'react-dom': 'ReactDOM',
};

// Plugin to handle WordPress externals
const wpExternalsPlugin = {
    name: 'wp-externals',
    setup(build) {
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
            const result = await postcss([postcssImport(), tailwindcss, autoprefixer]).process(css, { from: args.path });
            const messages = result.messages || [];
            const watchFiles = messages
                .filter((message) => message.type === 'dependency' && message.file)
                .map((message) => message.file);
            const watchDirs = messages
                .filter((message) => message.type === 'dir-dependency' && message.dir)
                .map((message) => message.dir);

            return {
                contents: result.css,
                loader: 'css',
                watchFiles,
                watchDirs,
            };
        });
    },
};

const browserOptions = {
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch,
    target: ['es2020'],
    plugins: [wpExternalsPlugin, postCSSPlugin],
    logLevel: 'info',
};

const relayOptions = {
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch,
    target: ['node20'],
    platform: 'node',
    format: 'cjs',
    logLevel: 'info',
};

// Build configurations
const builds = [
    // Editor bundle
    {
        ...browserOptions,
        entryPoints: ['src/editor/index.tsx'],
        outfile: 'build/editor.js',
        platform: 'browser',
        format: 'iife',
    },
    // Frontend view bundle (enhancements only)
    {
        ...browserOptions,
        entryPoints: ['src/view/index.ts'],
        outfile: 'build/view.js',
        platform: 'browser',
        format: 'iife',
    },
    // Relay renderer bundle (Node, executed inside renderKit-Relay)
    {
        ...relayOptions,
        entryPoints: ['src/relay/renderer.tsx'],
        outfile: 'build/relay-renderer.cjs',
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
    const result = await postcss([postcssImport(), tailwindcss, autoprefixer]).process(css, { from: cssPath });

    const outputDir = path.resolve('build');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    await fs.promises.writeFile(path.join(outputDir, 'style.css'), result.css);
    console.log('✓ Built build/style.css');
}

async function runBuilds() {
    try {
        if (!fs.existsSync('build')) {
            fs.mkdirSync('build', { recursive: true });
        }

        if (isWatch) {
            console.log('👀 Watching for changes...\n');

            const contexts = await Promise.all(builds.map((config) => esbuild.context(config)));
            await Promise.all(contexts.map((ctx) => ctx.watch()));

            const chokidarModule = await import('chokidar').catch(() => null);
            const chokidar = chokidarModule && (chokidarModule.watch ? chokidarModule : chokidarModule.default);
            if (chokidar && typeof chokidar.watch === 'function') {
                chokidar.watch('src/**/*.css', { ignoreInitial: true }).on('change', buildCSS);
            } else {
                const cssFile = path.resolve('src/styles/main.css');
                if (fs.existsSync(cssFile)) {
                    let pending = null;
                    fs.watch(cssFile, () => {
                        if (pending) {
                            clearTimeout(pending);
                        }
                        pending = setTimeout(() => {
                            buildCSS().catch((error) => console.error('CSS build failed:', error));
                            pending = null;
                        }, 50);
                    });
                }
            }

            await buildCSS();
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
