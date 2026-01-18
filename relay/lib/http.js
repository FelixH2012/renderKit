const crypto = require('crypto');

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

function createSignatureVerifier({ secret, maxSkewSeconds }) {
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

    return { verifySignature };
}

module.exports = {
    createSignatureVerifier,
    sendJson,
};
