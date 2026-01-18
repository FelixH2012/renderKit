const crypto = require('crypto');

function makeCacheKey(block, props) {
    try {
        const json = JSON.stringify(props);
        const digest = crypto.createHash('sha256').update(json).digest('hex');
        return `${block}:${digest}`;
    } catch {
        return null;
    }
}

function isInvariantResponse(value) {
    return Boolean(value && typeof value === 'object' && value.invariant === true);
}

function createRenderer({ getRenderer, renderCache, metrics, incCounter, observeHistogram }) {
    function renderSingleBlock(block, props) {
        const renderStart = process.hrtime.bigint();

        try {
            const renderer = getRenderer();

            let safeProps = props;
            if (typeof renderer.validateRelayProps === 'function') {
                const validated = renderer.validateRelayProps(block, props);
                if (isInvariantResponse(validated)) {
                    if (!validated.ok) {
                        const durationNs = Number(process.hrtime.bigint() - renderStart);
                        const durationSeconds = durationNs / 1e9;
                        return { ok: false, error: validated.error, durationSeconds };
                    }
                    safeProps = validated.value;
                } else {
                    safeProps = validated;
                }
            }

            const cacheKey = renderCache ? makeCacheKey(block, safeProps) : null;
            if (renderCache && cacheKey) {
                const cached = renderCache.get(cacheKey);
                if (cached !== null) {
                    incCounter(metrics.cacheHitsTotal, block);
                    const durationNs = Number(process.hrtime.bigint() - renderStart);
                    const durationSeconds = durationNs / 1e9;
                    observeHistogram(metrics, block, durationSeconds);
                    return { ok: true, html: cached, durationSeconds };
                }
                incCounter(metrics.cacheMissesTotal, block);
            }

            const renderResult = renderer.renderRelay(block, safeProps);
            if (isInvariantResponse(renderResult)) {
                if (!renderResult.ok) {
                    const durationNs = Number(process.hrtime.bigint() - renderStart);
                    const durationSeconds = durationNs / 1e9;
                    return { ok: false, error: renderResult.error, durationSeconds };
                }
                const html = renderResult.value;
                if (renderCache && cacheKey) {
                    renderCache.set(cacheKey, html);
                    incCounter(metrics.cacheStoresTotal, block);
                }

                const durationNs = Number(process.hrtime.bigint() - renderStart);
                const durationSeconds = durationNs / 1e9;
                observeHistogram(metrics, block, durationSeconds);
                return { ok: true, html, durationSeconds };
            }

            const html = renderResult;
            if (renderCache && cacheKey) {
                renderCache.set(cacheKey, html);
                incCounter(metrics.cacheStoresTotal, block);
            }

            const durationNs = Number(process.hrtime.bigint() - renderStart);
            const durationSeconds = durationNs / 1e9;
            observeHistogram(metrics, block, durationSeconds);
            return { ok: true, html, durationSeconds };
        } catch (error) {
            const durationNs = Number(process.hrtime.bigint() - renderStart);
            const durationSeconds = durationNs / 1e9;

            const relayErrorCode =
                error && typeof error === 'object' && typeof error.code === 'string' ? error.code : null;

            if (relayErrorCode === 'unsupported_block' || relayErrorCode === 'invalid_props') {
                return { ok: false, error: relayErrorCode, durationSeconds };
            }

            const errorType = error instanceof Error ? error.message : 'unknown';
            incCounter(metrics.renderErrorsTotal, `${block}:${errorType}`);
            console.error('renderKit-Relay render error:', error);
            return { ok: false, error: 'render_error', durationSeconds };
        }
    }

    return { renderSingleBlock };
}

module.exports = {
    createRenderer,
};
