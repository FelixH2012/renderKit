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

function createForge({ metrics, startTime, allowedTypes, maxEvents }) {
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

    function incCounter(map, key) {
        map[key] = (map[key] || 0) + 1;
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
            startedAt: new Date(startTime).toISOString(),
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

    function acceptEvents(items) {
        const accepted = [];
        for (const item of items.slice(0, maxEvents)) {
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

            if (!allowedTypes.has(event.type)) continue;

            if (event.depth === null) {
                delete event.depth;
            }

            accepted.push(event);
            recordForgeEvent(event);
        }
        return accepted;
    }

    return {
        acceptEvents,
        buildForgeInsights,
    };
}

module.exports = {
    createForge,
    normalizeForgeDepth,
    normalizeForgeString,
};
