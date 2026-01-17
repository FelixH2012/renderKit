<?php
/**
 * renderKit-Relay Client
 *
 * Calls the local Relay service to server-render TSX blocks.
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Relay client for renderKit-Relay (local SSR sidecar)
 */
final class RelayClient {

    /**
     * Relay base URL (e.g. http://127.0.0.1:8787)
     */
    private string $url;

    /**
     * Shared HMAC secret
     */
    private string $secret;

    /**
     * Request timeout in seconds
     */
    private float $timeout;

    /**
     * Snapshot TTL in seconds (0 disables snapshots)
     */
    private int $snapshot_ttl;

    /**
     * Per-request memoization cache
     *
     * @var array<string, string>
     */
    private array $memo = [];

    /**
     * Circuit Breaker State (shared via transients)
     *
     * Failures are tracked in a short rolling window and shared across PHP workers.
     */
    private const MAX_FAILURES = 3;
    private const OPEN_DURATION = 30; // Seconds to keep circuit open
    private const FAILURE_WINDOW = 60; // Seconds to keep failure count
    private const TRANSIENT_CIRCUIT = 'rk_relay_circuit';

    /**
     * @param array{url:string, secret:string, timeout?:float} $config
     */
    public function __construct(array $config) {
        $this->url = rtrim($config['url'] ?? '', '/');
        $this->secret = (string) ($config['secret'] ?? '');
        $this->timeout = (float) ($config['timeout'] ?? 1.5);
        $this->snapshot_ttl = isset($config['snapshot_ttl']) ? (int) $config['snapshot_ttl'] : 86400;
    }

    /**
     * Render a block via renderKit-Relay.
     *
     * @param string               $block Full block name, e.g. renderkit/hero
     * @param array<string, mixed> $props Props passed to the TSX View component
     * @return string Rendered HTML (static markup), or empty string on error
     */
    public function render(string $block, array $props): string {
        if ($this->is_circuit_open()) {
            return $this->render_fallback($block, $props);
        }

        if ($this->url === '' || $this->secret === '') {
            return $this->render_fallback($block, $props);
        }

        $payload = [
            'block' => $block,
            'props' => $props,
        ];

        $body = wp_json_encode($payload);
        if (!is_string($body) || $body === '') {
            return '';
        }

        $cache_key = $block . ':' . md5($body);
        if (isset($this->memo[$cache_key])) {
            return $this->memo[$cache_key];
        }

        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $body, $this->secret);

        $response = wp_remote_post($this->url . '/render', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-RenderKit-Relay-Timestamp' => $timestamp,
                'X-RenderKit-Relay-Signature' => 'sha256=' . $signature,
            ],
            'timeout' => $this->timeout,
            'body' => $body,
        ]);

        if (is_wp_error($response)) {
            $this->record_failure();
            return $this->render_fallback($block, $props);
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw = (string) wp_remote_retrieve_body($response);

        // Success (2xx)
        if ($status >= 200 && $status < 300) {
            $json = json_decode($raw, true);
            if (!is_array($json) || empty($json['ok']) || !isset($json['html']) || !is_string($json['html'])) {
                // Invalid response format -> System failure
                $this->record_failure();
                return $this->render_fallback($block, $props);
            }

            $this->record_success();
            $this->memo[$cache_key] = $json['html'];
            $this->store_snapshot($block, $props, $json['html']);
            return $json['html'];
        }

        // Client Error (4xx) - e.g. invalid props
        if ($status >= 400 && $status < 500) {
            // It's an error, but Relay is alive. Fallback for this block, but don't trip breaker.
            return $this->render_fallback($block, $props);
        }

        // System Failure (5xx) or Unexpected (3xx, 0, etc.)
        $this->record_failure();
        return $this->render_fallback($block, $props);
    }

    /**
     * Render multiple blocks in parallel via batch endpoint.
     *
     * @param array<int, array{block: string, props: array<string, mixed>}> $items
     * @return array<int, string> Array of rendered HTML strings, keyed by input index
     */
    public function render_batch(array $items): array {
        if (empty($items)) {
            return [];
        }

        // Circuit Breaker Check
        if ($this->is_circuit_open()) {
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        if ($this->url === '' || $this->secret === '') {
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        // Ensure numerical indexing and safe array
        $safe_items = array_values($items);

        // Check memoization first (dedup) - Skipped for now, result memoization below covers it partially

        $payload = ['blocks' => $safe_items];
        $body = wp_json_encode($payload);
        
        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $body, $this->secret);

        // Cap timeout at 3 seconds max, otherwise 2x normal timeout
        $batch_timeout = min(3.0, $this->timeout * 2);

        $response = wp_remote_post($this->url . '/render-batch', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-RenderKit-Relay-Timestamp' => $timestamp,
                'X-RenderKit-Relay-Signature' => 'sha256=' . $signature,
            ],
            'timeout' => $batch_timeout,
            'body' => $body,
        ]);

        if (is_wp_error($response)) {
            $this->record_failure();
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        
        // Success (2xx)
        if ($status >= 200 && $status < 300) {
             $json = json_decode(wp_remote_retrieve_body($response), true);
             if (!is_array($json) || empty($json['ok']) || !isset($json['results']) || !is_array($json['results'])) {
                 $this->record_failure();
                 return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
             }

             $this->record_success();
             
             $results = [];
             foreach ($safe_items as $index => $item) {
                 $res = $json['results'][$index] ?? null;
                 $html = '';
     
                 if ($res && !empty($res['ok']) && isset($res['html']) && is_string($res['html'])) {
                     $html = $res['html'];
                     // Memoize this individual result
                     $item_body = wp_json_encode($item); 
                     if ($item_body) {
                        $cache_key = $item['block'] . ':' . md5($item_body);
                        $this->memo[$cache_key] = $html;
                     }
                     $this->store_snapshot($item['block'], $item['props'], $html);
                 } else {
                     $html = $this->render_fallback($item['block'], $item['props']);
                 }
                 $results[$index] = $html;
             }
             return $results;
        }

        // Client Error (4xx) - Fallback without breaker
        if ($status >= 400 && $status < 500) {
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        // System Failure (5xx / 3xx)
        $this->record_failure();
        return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
    }

    /**
     * Send analytics events to renderKit-Forge.
     *
     * @param array<int, array<string, mixed>> $events
     */
    public function forge_events(array $events): bool {
        if ($this->url === '' || $this->secret === '') {
            return false;
        }

        $payload = ['events' => array_values($events)];
        $body = wp_json_encode($payload);
        if (!is_string($body) || $body === '') {
            return false;
        }

        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $body, $this->secret);

        $response = wp_remote_post($this->url . '/forge/events', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-RenderKit-Relay-Timestamp' => $timestamp,
                'X-RenderKit-Relay-Signature' => 'sha256=' . $signature,
            ],
            'timeout' => min(2.0, $this->timeout),
            'body' => $body,
        ]);

        if (is_wp_error($response)) {
            return false;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        return $status >= 200 && $status < 300;
    }

    /**
     * Fetch insights from renderKit-Forge.
     *
     * @param array<string, mixed> $query
     * @return array<string, mixed>|\WP_Error
     */
    public function forge_insights(array $query = []): array|\WP_Error {
        if ($this->url === '' || $this->secret === '') {
            return new \WP_Error('forge_unconfigured', 'Relay is not configured.');
        }

        $body = wp_json_encode($query);
        if (!is_string($body)) {
            return new \WP_Error('forge_invalid_query', 'Invalid forge query.');
        }

        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $body, $this->secret);

        $response = wp_remote_post($this->url . '/forge/insights', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-RenderKit-Relay-Timestamp' => $timestamp,
                'X-RenderKit-Relay-Signature' => 'sha256=' . $signature,
            ],
            'timeout' => min(2.0, $this->timeout),
            'body' => $body,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw = (string) wp_remote_retrieve_body($response);

        if ($status < 200 || $status >= 300) {
            return new \WP_Error('forge_error', 'Forge insights request failed.', ['status' => $status]);
        }

        $json = json_decode($raw, true);
        if (!is_array($json)) {
            return new \WP_Error('forge_invalid_response', 'Invalid forge insights response.');
        }

        return $json;
    }

    /**
     * Provide minimal fallback HTML when Relay is down.
     */
    private function render_fallback(string $block, array $props): string {
        $snapshot = $this->get_snapshot($block, $props);
        if ($snapshot !== '') {
            return $snapshot;
        }

        $attrs = $props['attributes'] ?? [];

        switch ($block) {
            case 'renderkit/hero':
                $heading = $attrs['heading'] ?? '';
                // SEO-safe fallback
                return sprintf(
                    '<div class="rk-hero-fallback" style="min-height:50vh; display:flex; align-items:center; justify-content:center; background:#111; color:#fff; padding:40px;"><h1>%s</h1></div>',
                    esc_html($heading)
                );

            case 'renderkit/text-block':
                return sprintf(
                    '<div class="rk-text-fallback">%s</div>', 
                    wp_kses_post($props['content'] ?? '')
                );

            case 'renderkit/product-grid':
                return '<div class="rk-product-grid-fallback"></div>';

            default:
                return '';
        }
    }

    /**
     * Build snapshot cache key for a block+props payload.
     */
    private function make_snapshot_key(string $block, array $props): ?string {
        if ($this->snapshot_ttl <= 0) {
            return null;
        }

        $payload = [
            'block' => $block,
            'props' => $props,
        ];
        $body = wp_json_encode($payload);
        if (!is_string($body) || $body === '') {
            return null;
        }

        return 'rk_relay_snap_' . md5($body);
    }

    /**
     * Retrieve a previously stored snapshot.
     */
    private function get_snapshot(string $block, array $props): string {
        $key = $this->make_snapshot_key($block, $props);
        if ($key === null) {
            return '';
        }

        $value = get_transient($key);
        return is_string($value) ? $value : '';
    }

    /**
     * Store a snapshot of the last successful SSR HTML.
     */
    private function store_snapshot(string $block, array $props, string $html): void {
        if ($html === '' || $this->snapshot_ttl <= 0) {
            return;
        }

        $key = $this->make_snapshot_key($block, $props);
        if ($key === null) {
            return;
        }

        set_transient($key, $html, $this->snapshot_ttl);
    }

    /**
     * Check if circuit is open
     */
    private function is_circuit_open(): bool {
        $now = time();
        $state = $this->get_circuit_state();
        $open_until = $state['open_until'];

        if ($open_until > $now) {
            return true;
        }

        // Half-open: if the window elapsed, allow one probe and reset state.
        if ($open_until > 0) {
            $this->reset_circuit_state();
            return false;
        }

        return false;
    }

    /**
     * Record a system failure
     */
    private function record_failure(): void {
        $state = $this->get_circuit_state();
        $failures = $state['failures'] + 1;
        $open_until = $state['open_until'];

        if ($failures >= self::MAX_FAILURES) {
            $open_until = time() + self::OPEN_DURATION;
        }

        $this->set_circuit_state($failures, $open_until);
    }

    /**
     * Record a success
     */
    private function record_success(): void {
        $this->reset_circuit_state();
    }

    /**
     * Fetch circuit breaker state from transient storage.
     *
     * @return array{failures:int,open_until:int}
     */
    private function get_circuit_state(): array {
        $state = get_transient(self::TRANSIENT_CIRCUIT);
        if (!is_array($state)) {
            return ['failures' => 0, 'open_until' => 0];
        }

        return [
            'failures' => isset($state['failures']) ? (int) $state['failures'] : 0,
            'open_until' => isset($state['open_until']) ? (int) $state['open_until'] : 0,
        ];
    }

    /**
     * Persist circuit breaker state for a short rolling window.
     */
    private function set_circuit_state(int $failures, int $open_until): void {
        set_transient(
            self::TRANSIENT_CIRCUIT,
            ['failures' => $failures, 'open_until' => $open_until],
            max(self::FAILURE_WINDOW, self::OPEN_DURATION)
        );
    }

    /**
     * Clear circuit breaker state.
     */
    private function reset_circuit_state(): void {
        delete_transient(self::TRANSIENT_CIRCUIT);
    }
}
