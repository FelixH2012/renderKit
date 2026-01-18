const fs = require('fs');

function createRendererLoader({ rendererPath, rendererCheckMs, metrics, renderCache }) {
    let cachedRenderer = null;
    let cachedRendererMtimeMs = 0;
    let lastRendererCheckMs = 0;

    function getRenderer() {
        const now = Date.now();
        if (cachedRenderer && rendererCheckMs > 0 && now - lastRendererCheckMs < rendererCheckMs) {
            return cachedRenderer;
        }
        lastRendererCheckMs = now;

        let stat;
        try {
            stat = fs.statSync(rendererPath);
        } catch {
            cachedRenderer = null;
            cachedRendererMtimeMs = 0;
            throw new Error('renderer_missing');
        }

        const mtimeMs = stat.mtimeMs;
        if (!cachedRenderer || cachedRendererMtimeMs !== mtimeMs) {
            const isReload = cachedRenderer !== null;
            cachedRendererMtimeMs = mtimeMs;
            try {
                const resolved = require.resolve(rendererPath);
                delete require.cache[resolved];
            } catch {
                // ignore
            }

            const mod = require(rendererPath);
            if (!mod || typeof mod.renderRelay !== 'function') {
                cachedRenderer = null;
                throw new Error('renderer_invalid');
            }

            cachedRenderer = mod;
            if (isReload && metrics) {
                metrics.rendererReloads++;
                if (renderCache && typeof renderCache.clear === 'function') {
                    renderCache.clear();
                    if (typeof metrics.cacheClearsTotal === 'number') {
                        metrics.cacheClearsTotal++;
                    }
                }
            }
        }

        return cachedRenderer;
    }

    return { getRenderer };
}

module.exports = {
    createRendererLoader,
};
