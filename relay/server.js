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

    if (req.method !== 'POST' || url.pathname !== '/render') {
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
            incCounter(metrics.requestsTotal, 'render:401');
            incSystemError('auth_failure');
            return sendJson(res, 401, { ok: false, error: auth.error });
        }

        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            incCounter(metrics.requestsTotal, 'render:400');
            incSystemError('invalid_json');
            return sendJson(res, 400, { ok: false, error: 'invalid_json' });
        }

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
                    incCounter(metrics.requestsTotal, 'render:200');
                    return sendJson(res, 200, { ok: true, html: cached });
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
            incCounter(metrics.requestsTotal, 'render:200');
            return sendJson(res, 200, { ok: true, html });
        } catch (error) {
            const relayErrorCode =
                error && typeof error === 'object' && typeof error.code === 'string' ? error.code : null;

            if (relayErrorCode === 'unsupported_block' || relayErrorCode === 'invalid_props') {
                incCounter(metrics.requestsTotal, 'render:400');
                incSystemError(relayErrorCode);
                return sendJson(res, 400, { ok: false, error: relayErrorCode });
            }

            const errorType = error instanceof Error ? error.message : 'unknown';
            incCounter(metrics.renderErrorsTotal, `${block}:${errorType}`);
            incCounter(metrics.requestsTotal, 'render:500');
            incSystemError('render_exception');
            console.error('renderKit-Relay render error:', error);
            return sendJson(res, 500, { ok: false, error: 'render_error' });
        }
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`renderKit-Relay listening on :${port}`);
});
