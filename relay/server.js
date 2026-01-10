/* eslint-disable no-console */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rendererPath = path.resolve(__dirname, '../build/relay-renderer.cjs');
let cachedRenderer = null;
let cachedRendererMtimeMs = 0;
let lastRendererCheckMs = 0;

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

const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
        try {
            const renderer = getRenderer();
            return sendJson(res, 200, { ok: true, name: 'renderKit-Relay', version: renderer.relayVersion || 'unknown' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'renderer_error';
            return sendJson(res, 503, { ok: false, name: 'renderKit-Relay', error: message });
        }
    }

    if (req.method !== 'POST' || url.pathname !== '/render') {
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
            return sendJson(res, 401, { ok: false, error: auth.error });
        }

        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            return sendJson(res, 400, { ok: false, error: 'invalid_json' });
        }

        const block = payload?.block;
        const props = payload?.props;
        if (typeof block !== 'string') return sendJson(res, 400, { ok: false, error: 'missing_block' });
        if (props === null || typeof props !== 'object') return sendJson(res, 400, { ok: false, error: 'missing_props' });

        try {
            const renderer = getRenderer();
            const html = renderer.renderRelay(block, props);
            return sendJson(res, 200, { ok: true, html });
        } catch (error) {
            console.error('renderKit-Relay render error:', error);
            return sendJson(res, 500, { ok: false, error: 'render_error' });
        }
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`renderKit-Relay listening on :${port}`);
});
