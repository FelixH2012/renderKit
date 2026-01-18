/* eslint-disable no-console */

const http = require('http');
const path = require('path');

const { LruCache, parseNonNegativeInt } = require('./lib/cache');
const { createForge } = require('./lib/forge');
const { createSignatureVerifier, sendJson } = require('./lib/http');
const { createMetrics, formatPrometheusMetrics, incCounter, incSystemError, observeHistogram } = require('./lib/metrics');
const { createRendererLoader } = require('./lib/renderer');
const { createRenderer } = require('./lib/render');

const rendererPath = path.resolve(__dirname, '../build/relay-renderer.cjs');
const rendererCheckMs = Number.parseInt(process.env.RENDERKIT_RELAY_RENDERER_CHECK_MS || '250', 10);

const secret = process.env.RENDERKIT_RELAY_SECRET;
if (!secret) {
    console.error('renderKit-Relay: missing env RENDERKIT_RELAY_SECRET');
    process.exit(1);
}

const port = Number.parseInt(process.env.RENDERKIT_RELAY_PORT || '8787', 10);
const maxBodyBytes = Number.parseInt(process.env.RENDERKIT_RELAY_MAX_BODY_BYTES || '1048576', 10);
const maxSkewSeconds = Number.parseInt(process.env.RENDERKIT_RELAY_MAX_SKEW_SECONDS || '60', 10);

const cacheEnabled = (process.env.RENDERKIT_RELAY_CACHE_ENABLED || '1') !== '0';
const cacheMaxEntries = parseNonNegativeInt(process.env.RENDERKIT_RELAY_CACHE_MAX_ENTRIES, 500);
const cacheTtlMs = parseNonNegativeInt(process.env.RENDERKIT_RELAY_CACHE_TTL_MS, 300000);

const renderCache = cacheEnabled && cacheMaxEntries > 0 ? new LruCache(cacheMaxEntries, cacheTtlMs) : null;

const metrics = createMetrics();
const metricsStartTime = Date.now();

const forgeEnabled = (process.env.RENDERKIT_FORGE_ENABLED || '1') !== '0';
const forgeStartTime = Date.now();
const forgeMaxEvents = parseNonNegativeInt(process.env.RENDERKIT_FORGE_MAX_EVENTS, 50);
const forgeAllowedTypes = new Set(['page_view', 'block_view', 'click', 'scroll_depth', 'form_start', 'form_submit']);

const forge = createForge({
    metrics,
    startTime: forgeStartTime,
    allowedTypes: forgeAllowedTypes,
    maxEvents: forgeMaxEvents,
});

const { getRenderer } = createRendererLoader({
    rendererPath,
    rendererCheckMs,
    metrics,
    renderCache,
});

const { renderSingleBlock } = createRenderer({
    getRenderer,
    renderCache,
    metrics,
    incCounter,
    observeHistogram,
});

const { verifySignature } = createSignatureVerifier({ secret, maxSkewSeconds });

const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/metrics') {
        const body = formatPrometheusMetrics({
            metrics,
            startTime: metricsStartTime,
            renderCache,
            cacheMaxEntries,
            cacheTtlMs,
        });
        res.writeHead(200, {
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
            'Content-Length': Buffer.byteLength(body),
        });
        return res.end(body);
    }

    if (req.method === 'GET' && url.pathname === '/health') {
        try {
            const renderer = getRenderer();
            incCounter(metrics.requestsTotal, 'health:200');
            return sendJson(res, 200, { ok: true, name: 'renderKit-Relay', version: renderer.relayVersion || 'unknown' });
        } catch (error) {
            incCounter(metrics.requestsTotal, 'health:503');
            const message = error instanceof Error ? error.message : 'renderer_error';
            return sendJson(res, 503, { ok: false, name: 'renderKit-Relay', error: message });
        }
    }

    if (
        req.method !== 'POST' ||
        (url.pathname !== '/render' && url.pathname !== '/render-batch' && url.pathname !== '/forge/events' && url.pathname !== '/forge/insights')
    ) {
        incCounter(metrics.requestsTotal, 'unknown:404');
        return sendJson(res, 404, { ok: false, error: 'not_found' });
    }

    let received = 0;
    const chunks = [];

    req.on('data', (chunk) => {
        received += chunk.length;
        if (received > maxBodyBytes) {
            req.destroy();
            return;
        }
        chunks.push(chunk);
    });

    req.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        const auth = verifySignature(req, rawBody);
        if (!auth.ok) {
            let endpoint = 'render';
            if (url.pathname === '/render-batch') endpoint = 'render_batch';
            if (url.pathname === '/forge/events') endpoint = 'forge_events';
            if (url.pathname === '/forge/insights') endpoint = 'forge_insights';
            incCounter(metrics.requestsTotal, `${endpoint}:401`);
            incSystemError(metrics, 'auth_failure');
            return sendJson(res, 401, { ok: false, error: auth.error });
        }

        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            const endpoint = url.pathname === '/render-batch' ? 'render_batch' : 'render';
            incCounter(metrics.requestsTotal, `${endpoint}:400`);
            incSystemError(metrics, 'invalid_json');
            return sendJson(res, 400, { ok: false, error: 'invalid_json' });
        }

        if (url.pathname === '/forge/events') {
            if (!forgeEnabled) {
                incCounter(metrics.requestsTotal, 'forge_events:404');
                return sendJson(res, 404, { ok: false, error: 'forge_disabled' });
            }

            const events = payload?.events;
            if (!Array.isArray(events)) {
                incCounter(metrics.requestsTotal, 'forge_events:400');
                incSystemError(metrics, 'forge_invalid_events');
                return sendJson(res, 400, { ok: false, error: 'invalid_events' });
            }

            const accepted = forge.acceptEvents(events);
            incCounter(metrics.requestsTotal, 'forge_events:202');
            return sendJson(res, 202, { ok: true, received: accepted.length });
        }

        if (url.pathname === '/forge/insights') {
            if (!forgeEnabled) {
                incCounter(metrics.requestsTotal, 'forge_insights:404');
                return sendJson(res, 404, { ok: false, error: 'forge_disabled' });
            }

            incCounter(metrics.requestsTotal, 'forge_insights:200');
            return sendJson(res, 200, forge.buildForgeInsights());
        }

        if (url.pathname === '/render-batch') {
            const blocks = payload?.blocks;
            if (!Array.isArray(blocks)) {
                incCounter(metrics.requestsTotal, 'render_batch:400');
                incSystemError(metrics, 'missing_blocks');
                return sendJson(res, 400, { ok: false, error: 'missing_blocks' });
            }

            metrics.batchRequestsTotal++;
            metrics.batchBlocksTotal += blocks.length;

            const results = blocks.map(item => {
                if (!item || typeof item !== 'object' || typeof item.block !== 'string') {
                    metrics.batchErrorsTotal++;
                    return { ok: false, error: 'invalid_item' };
                }
                const result = renderSingleBlock(item.block, item.props || {});
                if (result.ok) {
                    metrics.batchSuccessTotal++;
                } else {
                    metrics.batchErrorsTotal++;
                }
                return {
                    ok: result.ok,
                    html: result.html,
                    error: result.error
                };
            });

            incCounter(metrics.requestsTotal, 'render_batch:200');
            return sendJson(res, 200, { ok: true, results });
        }

        const block = payload?.block;
        const props = payload?.props;

        if (typeof block !== 'string') {
            incCounter(metrics.requestsTotal, 'render:400');
            incSystemError(metrics, 'missing_block');
            return sendJson(res, 400, { ok: false, error: 'missing_block' });
        }
        if (props === null || typeof props !== 'object') {
            incCounter(metrics.requestsTotal, 'render:400');
            incSystemError(metrics, 'missing_props');
            return sendJson(res, 400, { ok: false, error: 'missing_props' });
        }

        const result = renderSingleBlock(block, props);
        if (!result.ok) {
            if (result.error === 'unsupported_block' || result.error === 'invalid_props') {
                incCounter(metrics.requestsTotal, 'render:400');
                incSystemError(metrics, result.error);
                return sendJson(res, 400, { ok: false, error: result.error });
            }
            incCounter(metrics.requestsTotal, 'render:500');
            return sendJson(res, 500, { ok: false, error: result.error });
        }

        incCounter(metrics.requestsTotal, 'render:200');
        return sendJson(res, 200, { ok: true, html: result.html });
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`renderKit-Relay listening on :${port}`);
});
