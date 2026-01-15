/* eslint-disable no-console */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rendererPath = path.resolve(__dirname, '../build/relay-renderer.cjs');
let cachedRenderer = null;
let cachedRendererMtimeMs = 0;
let lastRendererCheckMs = 0;
let renderCache = null;

const rendererCheckMs = Number.parseInt(process.env.RENDERKIT_RELAY_RENDERER_CHECK_MS || '250', 10);

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
        if (isReload && typeof metrics !== 'undefined') {
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

const secret = process.env.RENDERKIT_RELAY_SECRET;
if (!secret) {
    console.error('renderKit-Relay: missing env RENDERKIT_RELAY_SECRET');
    process.exit(1);
}

const port = Number.parseInt(process.env.RENDERKIT_RELAY_PORT || '8787', 10);
const maxBodyBytes = Number.parseInt(process.env.RENDERKIT_RELAY_MAX_BODY_BYTES || '1048576', 10);
const maxSkewSeconds = Number.parseInt(process.env.RENDERKIT_RELAY_MAX_SKEW_SECONDS || '60', 10);

// ─────────────────────────────────────────────────────────────────────────────
// SSR Response Cache (in-memory LRU)
// ─────────────────────────────────────────────────────────────────────────────

function parseNonNegativeInt(value, fallback) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

const cacheEnabled = (process.env.RENDERKIT_RELAY_CACHE_ENABLED || '1') !== '0';
const cacheMaxEntries = parseNonNegativeInt(process.env.RENDERKIT_RELAY_CACHE_MAX_ENTRIES, 500);
const cacheTtlMs = parseNonNegativeInt(process.env.RENDERKIT_RELAY_CACHE_TTL_MS, 300000);

class LruCache {
    constructor(maxEntries, ttlMs) {
        this.maxEntries = maxEntries;
        this.ttlMs = ttlMs;
        this.map = new Map();
        this.evictions = 0;
    }

    get(key) {
        const entry = this.map.get(key);
        if (!entry) return null;

        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
            this.map.delete(key);
            return null;
        }

        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }

    set(key, value) {
        if (this.map.has(key)) {
            this.map.delete(key);
        }

        const expiresAt = this.ttlMs > 0 ? Date.now() + this.ttlMs : 0;
        this.map.set(key, { value, expiresAt });

        while (this.map.size > this.maxEntries) {
            const oldestKey = this.map.keys().next().value;
            this.map.delete(oldestKey);
            this.evictions++;
        }
    }

    clear() {
        this.map.clear();
    }

    size() {
        return this.map.size;
    }
}

renderCache = cacheEnabled && cacheMaxEntries > 0 ? new LruCache(cacheMaxEntries, cacheTtlMs) : null;

// ─────────────────────────────────────────────────────────────────────────────
// renderKit-Forge (Analytics + Insights)
// ─────────────────────────────────────────────────────────────────────────────

const forgeEnabled = (process.env.RENDERKIT_FORGE_ENABLED || '1') !== '0';
const forgeStartTime = Date.now();
const forgeMaxEvents = parseNonNegativeInt(process.env.RENDERKIT_FORGE_MAX_EVENTS, 50);
const forgeAllowedTypes = new Set(['page_view', 'block_view', 'click', 'scroll_depth', 'form_start', 'form_submit']);

const forge = {
    eventsTotal: 0,
    eventTypes: {},
    pages: {},
    blockViews: {},
    blockClicks: {},
    targetClicks: {},
    scrollDepth: {},
    lastEventAt: 0,
};

function normalizeForgeString(value, maxLength = 120) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (trimmed === '') return '';
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeForgeDepth(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    if (value > 1 && value <= 100) {
        value = value / 100;
    }
    if (value < 0 || value > 1) return null;
    return value;
}

function bucketForgeDepth(value) {
    if (value <= 0.25) return '0.25';
    if (value <= 0.5) return '0.5';
    if (value <= 0.75) return '0.75';
    return '1.0';
}

function recordForgeEvent(event) {
    metrics.forgeEventsTotal++;
    incCounter(metrics.forgeEventTypesTotal, event.type);

    forge.eventsTotal++;
    forge.lastEventAt = Date.now();
    incCounter(forge.eventTypes, event.type);

    if (event.type === 'page_view' && event.page) {
        incCounter(forge.pages, event.page);
        incCounter(metrics.forgePageViewsTotal, event.page);
    }
    if (event.type === 'block_view' && event.block) {
        incCounter(forge.blockViews, event.block);
        incCounter(metrics.forgeBlockViewsTotal, event.block);
    }
    if (event.type === 'click' && event.block) {
        incCounter(forge.blockClicks, event.block);
        incCounter(metrics.forgeBlockClicksTotal, event.block);
        if (event.target) {
            incCounter(forge.targetClicks, event.target);
            incCounter(metrics.forgeTargetClicksTotal, event.target);
        }
    }
    if (event.type === 'scroll_depth' && typeof event.depth === 'number') {
        const bucket = bucketForgeDepth(event.depth);
        incCounter(forge.scrollDepth, bucket);
        incCounter(metrics.forgeScrollDepthTotal, bucket);
    }
}

function buildForgeInsights() {
    const topEntries = (map, limit = 10) =>
        Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([key, count]) => ({ key, count }));

    const blocks = Object.keys(forge.blockViews).map((block) => {
        const views = forge.blockViews[block] || 0;
        const clicks = forge.blockClicks[block] || 0;
        const ctr = views > 0 ? Number((clicks / views).toFixed(4)) : 0;
        return { block, views, clicks, ctr };
    }).sort((a, b) => b.views - a.views);

    return {
        ok: true,
        forge: 'renderKit-Forge',
        startedAt: new Date(forgeStartTime).toISOString(),
        lastEventAt: forge.lastEventAt ? new Date(forge.lastEventAt).toISOString() : null,
        totals: {
            events: forge.eventsTotal,
            eventTypes: forge.eventTypes,
        },
        top: {
            pages: topEntries(forge.pages, 10),
            blocks: blocks.slice(0, 20),
            targets: topEntries(forge.targetClicks, 10),
            scrollDepth: topEntries(forge.scrollDepth, 4),
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prometheus Metrics
// ─────────────────────────────────────────────────────────────────────────────

const startTime = Date.now();
// Ultra-fine buckets for SSR (0.1ms to 500ms)
const histogramBuckets = [
    0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5
];

const metrics = {
    requestsTotal: {},        // { "endpoint:status": count }
    renderDuration: {},       // { block: { buckets: [...], sum: 0, count: 0 } }
    renderDurationLast: {},   // { block: last_duration_seconds }
    renderErrorsTotal: {},    // { "block:error": count }
    systemErrorsTotal: {},    // { "type": count } -> NEW: For auth, bad_request, etc.
    cacheHitsTotal: {},       // { block: count }
    cacheMissesTotal: {},     // { block: count }
    cacheStoresTotal: {},     // { block: count }
    cacheClearsTotal: 0,
    rendererReloads: 0,
    batchRequestsTotal: 0,
    batchBlocksTotal: 0,
    batchSuccessTotal: 0,
    batchErrorsTotal: 0,
    forgeEventsTotal: 0,
    forgeEventTypesTotal: {},
    forgePageViewsTotal: {},
    forgeBlockViewsTotal: {},
    forgeBlockClicksTotal: {},
    forgeTargetClicksTotal: {},
    forgeScrollDepthTotal: {},
};

function incCounter(map, key) {
    map[key] = (map[key] || 0) + 1;
}

function incSystemError(type) {
    incCounter(metrics.systemErrorsTotal, type);
}

function observeHistogram(block, duration) {
    if (!metrics.renderDuration[block]) {
        metrics.renderDuration[block] = {
            buckets: histogramBuckets.map(() => 0),
            sum: 0,
            count: 0,
        };
    }
    const h = metrics.renderDuration[block];
    h.sum += duration;
    h.count += 1;
    for (let i = 0; i < histogramBuckets.length; i++) {
        if (duration <= histogramBuckets[i]) {
            h.buckets[i]++;
        }
    }
    metrics.renderDurationLast[block] = duration;
}

function formatPrometheusMetrics() {
    const lines = [];
    const uptimeSeconds = (Date.now() - startTime) / 1000;

    // Uptime gauge
    lines.push('# HELP renderkit_relay_uptime_seconds Time since service start');
    lines.push('# TYPE renderkit_relay_uptime_seconds gauge');
    lines.push(`renderkit_relay_uptime_seconds ${uptimeSeconds.toFixed(3)}`);

    // Renderer reloads counter
    lines.push('# HELP renderkit_relay_renderer_reloads_total Number of renderer hot-reloads');
    lines.push('# TYPE renderkit_relay_renderer_reloads_total counter');
    lines.push(`renderkit_relay_renderer_reloads_total ${metrics.rendererReloads}`);

    // SSR cache gauges/counters
    lines.push('# HELP renderkit_relay_cache_enabled Whether the SSR response cache is enabled');
    lines.push('# TYPE renderkit_relay_cache_enabled gauge');
    lines.push(`renderkit_relay_cache_enabled ${renderCache ? 1 : 0}`);

    lines.push('# HELP renderkit_relay_cache_max_entries Configured max cache entries');
    lines.push('# TYPE renderkit_relay_cache_max_entries gauge');
    lines.push(`renderkit_relay_cache_max_entries ${cacheMaxEntries}`);

    lines.push('# HELP renderkit_relay_cache_ttl_ms Configured cache TTL in ms (0 disables TTL)');
    lines.push('# TYPE renderkit_relay_cache_ttl_ms gauge');
    lines.push(`renderkit_relay_cache_ttl_ms ${cacheTtlMs}`);

    lines.push('# HELP renderkit_relay_cache_entries Current SSR cache entries');
    lines.push('# TYPE renderkit_relay_cache_entries gauge');
    lines.push(`renderkit_relay_cache_entries ${renderCache ? renderCache.size() : 0}`);

    lines.push('# HELP renderkit_relay_cache_evictions_total Total SSR cache evictions');
    lines.push('# TYPE renderkit_relay_cache_evictions_total counter');
    lines.push(`renderkit_relay_cache_evictions_total ${renderCache ? renderCache.evictions : 0}`);

    lines.push('# HELP renderkit_relay_cache_clears_total Total SSR cache clears (e.g. on renderer reload)');
    lines.push('# TYPE renderkit_relay_cache_clears_total counter');
    lines.push(`renderkit_relay_cache_clears_total ${metrics.cacheClearsTotal}`);

    lines.push('# HELP renderkit_relay_cache_hits_total Total SSR cache hits');
    lines.push('# TYPE renderkit_relay_cache_hits_total counter');
    for (const [block, count] of Object.entries(metrics.cacheHitsTotal)) {
        lines.push(`renderkit_relay_cache_hits_total{block="${block}"} ${count}`);
    }

    lines.push('# HELP renderkit_relay_cache_misses_total Total SSR cache misses');
    lines.push('# TYPE renderkit_relay_cache_misses_total counter');
    for (const [block, count] of Object.entries(metrics.cacheMissesTotal)) {
        lines.push(`renderkit_relay_cache_misses_total{block="${block}"} ${count}`);
    }

    lines.push('# HELP renderkit_relay_cache_stores_total Total SSR cache stores');
    lines.push('# TYPE renderkit_relay_cache_stores_total counter');
    for (const [block, count] of Object.entries(metrics.cacheStoresTotal)) {
        lines.push(`renderkit_relay_cache_stores_total{block="${block}"} ${count}`);
    }

    // Requests total counter
    lines.push('# HELP renderkit_relay_requests_total Total HTTP requests');
    lines.push('# TYPE renderkit_relay_requests_total counter');
    for (const [key, count] of Object.entries(metrics.requestsTotal)) {
        const [endpoint, status] = key.split(':');
        lines.push(`renderkit_relay_requests_total{endpoint="${endpoint}",status="${status}"} ${count}`);
    }

    // Render errors counter
    lines.push('# HELP renderkit_relay_render_errors_total Total render errors');
    lines.push('# TYPE renderkit_relay_render_errors_total counter');
    for (const [key, count] of Object.entries(metrics.renderErrorsTotal)) {
        const [block, error] = key.split(':');
        lines.push(`renderkit_relay_render_errors_total{block="${block}",error="${error}"} ${count}`);
    }

    // Render duration histogram
    lines.push('# HELP renderkit_relay_render_duration_seconds Render latency in seconds');
    lines.push('# TYPE renderkit_relay_render_duration_seconds histogram');
    for (const [block, h] of Object.entries(metrics.renderDuration)) {
        let cumulative = 0;
        for (let i = 0; i < histogramBuckets.length; i++) {
            cumulative += h.buckets[i];
            lines.push(`renderkit_relay_render_duration_seconds_bucket{block="${block}",le="${histogramBuckets[i]}"} ${cumulative}`);
        }
        lines.push(`renderkit_relay_render_duration_seconds_bucket{block="${block}",le="+Inf"} ${h.count}`);
        lines.push(`renderkit_relay_render_duration_seconds_sum{block="${block}"} ${h.sum.toFixed(6)}`);
        lines.push(`renderkit_relay_render_duration_seconds_count{block="${block}"} ${h.count}`);
    }

    // Render duration last (gauge)
    lines.push('# HELP renderkit_relay_render_duration_last_seconds Last render latency in seconds');
    lines.push('# TYPE renderkit_relay_render_duration_last_seconds gauge');
    for (const [block, duration] of Object.entries(metrics.renderDurationLast)) {
        lines.push(`renderkit_relay_render_duration_last_seconds{block="${block}"} ${duration.toFixed(6)}`);
    }

    // System Errors
    lines.push('# HELP renderkit_relay_system_errors_total Total system errors by type');
    lines.push('# TYPE renderkit_relay_system_errors_total counter');
    for (const [type, count] of Object.entries(metrics.systemErrorsTotal)) {
        lines.push(`renderkit_relay_system_errors_total{type="${type}"} ${count}`);
    }

    // Batch metrics
    lines.push('# HELP renderkit_relay_batch_requests_total Total batch render requests');
    lines.push('# TYPE renderkit_relay_batch_requests_total counter');
    lines.push(`renderkit_relay_batch_requests_total ${metrics.batchRequestsTotal}`);

    lines.push('# HELP renderkit_relay_batch_blocks_total Total blocks rendered via batch');
    lines.push('# TYPE renderkit_relay_batch_blocks_total counter');
    lines.push(`renderkit_relay_batch_blocks_total ${metrics.batchBlocksTotal}`);

    lines.push('# HELP renderkit_relay_batch_success_total Successful batch block renders');
    lines.push('# TYPE renderkit_relay_batch_success_total counter');
    lines.push(`renderkit_relay_batch_success_total ${metrics.batchSuccessTotal}`);

    lines.push('# HELP renderkit_relay_batch_errors_total Failed batch block renders');
    lines.push('# TYPE renderkit_relay_batch_errors_total counter');
    lines.push(`renderkit_relay_batch_errors_total ${metrics.batchErrorsTotal}`);

    // Forge metrics
    lines.push('# HELP renderkit_forge_events_total Total forge events received');
    lines.push('# TYPE renderkit_forge_events_total counter');
    lines.push(`renderkit_forge_events_total ${metrics.forgeEventsTotal}`);

    lines.push('# HELP renderkit_forge_event_types_total Forge events by type');
    lines.push('# TYPE renderkit_forge_event_types_total counter');
    for (const [type, count] of Object.entries(metrics.forgeEventTypesTotal)) {
        lines.push(`renderkit_forge_event_types_total{type="${type}"} ${count}`);
    }

    lines.push('# HELP renderkit_forge_page_views_total Forge page views by path');
    lines.push('# TYPE renderkit_forge_page_views_total counter');
    for (const [page, count] of Object.entries(metrics.forgePageViewsTotal)) {
        lines.push(`renderkit_forge_page_views_total{page="${page}"} ${count}`);
    }

    lines.push('# HELP renderkit_forge_block_views_total Forge block views');
    lines.push('# TYPE renderkit_forge_block_views_total counter');
    for (const [block, count] of Object.entries(metrics.forgeBlockViewsTotal)) {
        lines.push(`renderkit_forge_block_views_total{block="${block}"} ${count}`);
    }

    lines.push('# HELP renderkit_forge_block_clicks_total Forge block clicks');
    lines.push('# TYPE renderkit_forge_block_clicks_total counter');
    for (const [block, count] of Object.entries(metrics.forgeBlockClicksTotal)) {
        lines.push(`renderkit_forge_block_clicks_total{block="${block}"} ${count}`);
    }

    lines.push('# HELP renderkit_forge_target_clicks_total Forge click targets');
    lines.push('# TYPE renderkit_forge_target_clicks_total counter');
    for (const [target, count] of Object.entries(metrics.forgeTargetClicksTotal)) {
        lines.push(`renderkit_forge_target_clicks_total{target="${target}"} ${count}`);
    }

    lines.push('# HELP renderkit_forge_scroll_depth_total Forge scroll depth buckets');
    lines.push('# TYPE renderkit_forge_scroll_depth_total counter');
    for (const [depth, count] of Object.entries(metrics.forgeScrollDepthTotal)) {
        lines.push(`renderkit_forge_scroll_depth_total{depth="${depth}"} ${count}`);
    }

    return lines.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────

function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
    });
    res.end(body);
}

function timingSafeEqualHex(a, b) {
    const aBuf = Buffer.from(a, 'hex');
    const bBuf = Buffer.from(b, 'hex');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifySignature(req, rawBody) {
    const timestampHeader = req.headers['x-renderkit-relay-timestamp'];
    const signatureHeader = req.headers['x-renderkit-relay-signature'];

    const timestamp = Number.parseInt(Array.isArray(timestampHeader) ? timestampHeader[0] : timestampHeader || '', 10);
    if (!Number.isFinite(timestamp)) return { ok: false, error: 'invalid_timestamp' };

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > maxSkewSeconds) return { ok: false, error: 'timestamp_out_of_range' };

    const signatureValue = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (typeof signatureValue !== 'string') return { ok: false, error: 'missing_signature' };

    const match = signatureValue.match(/^sha256=([a-f0-9]{64})$/i);
    if (!match) return { ok: false, error: 'invalid_signature_format' };

    const provided = match[1].toLowerCase();
    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

    if (!timingSafeEqualHex(provided, expected)) return { ok: false, error: 'signature_mismatch' };

    return { ok: true };
}

function makeCacheKey(block, props) {
    try {
        const json = JSON.stringify(props);
        const digest = crypto.createHash('sha256').update(json).digest('hex');
        return `${block}:${digest}`;
    } catch {
        return null;
    }
}

/**
 * Render a single block with caching and metrics.
 * Used by both /render and /render-batch endpoints.
 *
 * @param {string} block - Block name (e.g., 'renderkit/hero')
 * @param {object} props - Block props
 * @returns {{ ok: boolean, html?: string, error?: string, durationSeconds: number }}
 */
function renderSingleBlock(block, props) {
    const renderStart = process.hrtime.bigint();

    try {
        const renderer = getRenderer();

        let safeProps = props;
        if (typeof renderer.validateRelayProps === 'function') {
            safeProps = renderer.validateRelayProps(block, props);
        }

        const cacheKey = renderCache ? makeCacheKey(block, safeProps) : null;
        if (renderCache && cacheKey) {
            const cached = renderCache.get(cacheKey);
            if (cached !== null) {
                incCounter(metrics.cacheHitsTotal, block);
                const durationNs = Number(process.hrtime.bigint() - renderStart);
                const durationSeconds = durationNs / 1e9;
                observeHistogram(block, durationSeconds);
                return { ok: true, html: cached, durationSeconds };
            }
            incCounter(metrics.cacheMissesTotal, block);
        }

        const html = renderer.renderRelay(block, safeProps);
        if (renderCache && cacheKey) {
            renderCache.set(cacheKey, html);
            incCounter(metrics.cacheStoresTotal, block);
        }

        const durationNs = Number(process.hrtime.bigint() - renderStart);
        const durationSeconds = durationNs / 1e9;
        observeHistogram(block, durationSeconds);
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

const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');

    // Prometheus metrics endpoint (secured via Docker port binding to 127.0.0.1)
    if (req.method === 'GET' && url.pathname === '/metrics') {
        const body = formatPrometheusMetrics();
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
            incSystemError('auth_failure');
            return sendJson(res, 401, { ok: false, error: auth.error });
        }

        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            const endpoint = url.pathname === '/render-batch' ? 'render_batch' : 'render';
            incCounter(metrics.requestsTotal, `${endpoint}:400`);
            incSystemError('invalid_json');
            return sendJson(res, 400, { ok: false, error: 'invalid_json' });
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // Endpoint: /forge/events
        // ─────────────────────────────────────────────────────────────────────────────
        if (url.pathname === '/forge/events') {
            if (!forgeEnabled) {
                incCounter(metrics.requestsTotal, 'forge_events:404');
                return sendJson(res, 404, { ok: false, error: 'forge_disabled' });
            }

            const events = payload?.events;
            if (!Array.isArray(events)) {
                incCounter(metrics.requestsTotal, 'forge_events:400');
                incSystemError('forge_invalid_events');
                return sendJson(res, 400, { ok: false, error: 'invalid_events' });
            }

            const accepted = [];
            for (const item of events.slice(0, forgeMaxEvents)) {
                if (!item || typeof item !== 'object') continue;
                const type = normalizeForgeString(item.type, 32);
                if (type === '') continue;

                const event = {
                    type,
                    block: normalizeForgeString(item.block, 80),
                    page: normalizeForgeString(item.page, 160),
                    target: normalizeForgeString(item.target, 120),
                    depth: normalizeForgeDepth(item.depth),
                };

                if (!forgeAllowedTypes.has(event.type)) continue;

                if (event.depth === null) {
                    delete event.depth;
                }

                accepted.push(event);
                recordForgeEvent(event);
            }

            incCounter(metrics.requestsTotal, 'forge_events:202');
            return sendJson(res, 202, { ok: true, received: accepted.length });
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // Endpoint: /forge/insights
        // ─────────────────────────────────────────────────────────────────────────────
        if (url.pathname === '/forge/insights') {
            if (!forgeEnabled) {
                incCounter(metrics.requestsTotal, 'forge_insights:404');
                return sendJson(res, 404, { ok: false, error: 'forge_disabled' });
            }

            incCounter(metrics.requestsTotal, 'forge_insights:200');
            return sendJson(res, 200, buildForgeInsights());
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // Endpoint: /render-batch
        // ─────────────────────────────────────────────────────────────────────────────
        if (url.pathname === '/render-batch') {
            const blocks = payload?.blocks;
            if (!Array.isArray(blocks)) {
                incCounter(metrics.requestsTotal, 'render_batch:400');
                incSystemError('missing_blocks');
                return sendJson(res, 400, { ok: false, error: 'missing_blocks' });
            }

            metrics.batchRequestsTotal++;
            metrics.batchBlocksTotal += blocks.length;

            // Render all blocks in parallel (Promise.all is fine here since loop is small)
            // But getRenderer() is sync, renderRelay() is sync.
            // So parallel means concurrent processing if we were async, but here we just loop.
            // Since this is Node single thread, it blocks anyway.
            // However, we structuring it to return an array of results.

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
                // Don't expose duration in response to keep payload small? Or do we want to?
                // Plan said: { ok: true, results: [{ ok, html?, error? }, ...] }
                // renderSingleBlock returns { ok, html?, error?, durationSeconds }
                return {
                    ok: result.ok,
                    html: result.html,
                    error: result.error
                };
            });

            incCounter(metrics.requestsTotal, 'render_batch:200');
            return sendJson(res, 200, { ok: true, results });
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // Endpoint: /render (Legacy / Single)
        // ─────────────────────────────────────────────────────────────────────────────
        const block = payload?.block;
        const props = payload?.props;

        if (typeof block !== 'string') {
            incCounter(metrics.requestsTotal, 'render:400');
            incSystemError('missing_block');
            return sendJson(res, 400, { ok: false, error: 'missing_block' });
        }
        if (props === null || typeof props !== 'object') {
            incCounter(metrics.requestsTotal, 'render:400');
            incSystemError('missing_props');
            return sendJson(res, 400, { ok: false, error: 'missing_props' });
        }

        const result = renderSingleBlock(block, props);
        if (!result.ok) {
            // Check specific error codes to match original behavior
            if (result.error === 'unsupported_block' || result.error === 'invalid_props') {
                incCounter(metrics.requestsTotal, 'render:400');
                incSystemError(result.error);
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
