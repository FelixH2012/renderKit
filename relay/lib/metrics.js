const histogramBuckets = [
    0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5
];

function createMetrics() {
    return {
        requestsTotal: {},        // { "endpoint:status": count }
        renderDuration: {},       // { block: { buckets: [...], sum: 0, count: 0 } }
        renderDurationLast: {},   // { block: last_duration_seconds }
        renderErrorsTotal: {},    // { "block:error": count }
        systemErrorsTotal: {},    // { "type": count }
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
}

function incCounter(map, key) {
    map[key] = (map[key] || 0) + 1;
}

function incSystemError(metrics, type) {
    incCounter(metrics.systemErrorsTotal, type);
}

function observeHistogram(metrics, block, duration) {
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

function formatPrometheusMetrics({ metrics, startTime, renderCache, cacheMaxEntries, cacheTtlMs }) {
    const lines = [];
    const uptimeSeconds = (Date.now() - startTime) / 1000;

    lines.push('# HELP renderkit_relay_uptime_seconds Time since service start');
    lines.push('# TYPE renderkit_relay_uptime_seconds gauge');
    lines.push(`renderkit_relay_uptime_seconds ${uptimeSeconds.toFixed(3)}`);

    lines.push('# HELP renderkit_relay_renderer_reloads_total Number of renderer hot-reloads');
    lines.push('# TYPE renderkit_relay_renderer_reloads_total counter');
    lines.push(`renderkit_relay_renderer_reloads_total ${metrics.rendererReloads}`);

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

    lines.push('# HELP renderkit_relay_requests_total Total HTTP requests');
    lines.push('# TYPE renderkit_relay_requests_total counter');
    for (const [key, count] of Object.entries(metrics.requestsTotal)) {
        const [endpoint, status] = key.split(':');
        lines.push(`renderkit_relay_requests_total{endpoint="${endpoint}",status="${status}"} ${count}`);
    }

    lines.push('# HELP renderkit_relay_render_errors_total Total render errors');
    lines.push('# TYPE renderkit_relay_render_errors_total counter');
    for (const [key, count] of Object.entries(metrics.renderErrorsTotal)) {
        const [block, error] = key.split(':');
        lines.push(`renderkit_relay_render_errors_total{block="${block}",error="${error}"} ${count}`);
    }

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

    lines.push('# HELP renderkit_relay_render_duration_last_seconds Last render latency in seconds');
    lines.push('# TYPE renderkit_relay_render_duration_last_seconds gauge');
    for (const [block, duration] of Object.entries(metrics.renderDurationLast)) {
        lines.push(`renderkit_relay_render_duration_last_seconds{block="${block}"} ${duration.toFixed(6)}`);
    }

    lines.push('# HELP renderkit_relay_system_errors_total Total system errors by type');
    lines.push('# TYPE renderkit_relay_system_errors_total counter');
    for (const [type, count] of Object.entries(metrics.systemErrorsTotal)) {
        lines.push(`renderkit_relay_system_errors_total{type="${type}"} ${count}`);
    }

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

module.exports = {
    createMetrics,
    formatPrometheusMetrics,
    incCounter,
    incSystemError,
    observeHistogram,
};
