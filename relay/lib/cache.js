function parseNonNegativeInt(value, fallback) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

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

module.exports = {
    LruCache,
    parseNonNegativeInt,
};
