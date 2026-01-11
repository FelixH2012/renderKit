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
     * Per-request memoization cache
     *
     * @var array<string, string>
     */
    private array $memo = [];

    /**
     * Circuit Breaker State (Per-Request + Time-based)
     *
     * In a real persistent scenario we would use transients.
     * For now, this is static per process, but improved with timestamps.
     */
    private static int $failures = 0;
    private static int $open_until = 0;
    private const MAX_FAILURES = 3;
    private const OPEN_DURATION = 30; // Seconds to keep circuit open

    /**
     * @param array{url:string, secret:string, timeout?:float} $config
     */
    public function __construct(array $config) {
        $this->url = rtrim($config['url'] ?? '', '/');
        $this->secret = (string) ($config['secret'] ?? '');
        $this->timeout = (float) ($config['timeout'] ?? 1.5);
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
     * Provide minimal fallback HTML when Relay is down.
     */
    private function render_fallback(string $block, array $props): string {
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
     * Check if circuit is open
     */
    private function is_circuit_open(): bool {
        if (self::$open_until > time()) {
            return true;
        }
        
        // Half-open: If time passed, allow 1 request through (effectively standard state until failure)
        // Reset state if we passed the window
        if (self::$open_until > 0) {
            self::$open_until = 0;
            self::$failures = 0; // Reset failures on probe attempt
        }
        
        return self::$failures >= self::MAX_FAILURES;
    }

    /**
     * Record a system failure
     */
    private function record_failure(): void {
        self::$failures++;
        if (self::$failures >= self::MAX_FAILURES) {
            self::$open_until = time() + self::OPEN_DURATION;
        }
    }

    /**
     * Record a success
     */
    private function record_success(): void {
        self::$failures = 0;
        self::$open_until = 0;
    }
}

