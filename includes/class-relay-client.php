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
     * Circuit Breaker State (Per-Request)
     */
    private static int $failures = 0;
    private const MAX_FAILURES = 3;

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
        // Circuit Breaker Check
        if (self::$failures >= self::MAX_FAILURES) {
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
            self::$failures++;
            return $this->render_fallback($block, $props);
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw = (string) wp_remote_retrieve_body($response);

        if ($status < 200 || $status >= 300) {
            self::$failures++;
            return $this->render_fallback($block, $props);
        }

        $json = json_decode($raw, true);
        if (!is_array($json) || empty($json['ok']) || !isset($json['html']) || !is_string($json['html'])) {
            // Logic error, but maybe not a connection failure. Still count as failure?
            // Yes, if relay sends garbage, it's broken.
            self::$failures++;
            return $this->render_fallback($block, $props);
        }

        // Success - reset failures? 
        // In a "per-request" breaker, maybe we don't reset to be safe if it's flaky?
        // But usually successful request means it's up.
        self::$failures = 0;

        $this->memo[$cache_key] = $json['html'];
        return $json['html'];
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
        if (self::$failures >= self::MAX_FAILURES) {
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        if ($this->url === '' || $this->secret === '') {
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        $payload = ['blocks' => $items];
        $body = wp_json_encode($payload);
        
        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $body, $this->secret);

        $response = wp_remote_post($this->url . '/render-batch', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-RenderKit-Relay-Timestamp' => $timestamp,
                'X-RenderKit-Relay-Signature' => 'sha256=' . $signature,
            ],
            'timeout' => $this->timeout * 2, // Double timeout for batch
            'body' => $body,
        ]);

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            self::$failures++;
            // Fallback for all
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        $json = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($json) || empty($json['ok']) || !isset($json['results']) || !is_array($json['results'])) {
            self::$failures++;
            return array_map(fn($item) => $this->render_fallback($item['block'], $item['props']), $items);
        }

        self::$failures = 0;
        
        $results = [];
        foreach ($items as $index => $item) {
            $res = $json['results'][$index] ?? null;
            if ($res && !empty($res['ok']) && isset($res['html']) && is_string($res['html'])) {
                $results[$index] = $res['html'];
                // Cache individual results too?
                // $cache_key = ... logic is harder here without exact payload per item
                // Skip memo for now for batch
            } else {
                $results[$index] = $this->render_fallback($item['block'], $item['props']);
            }
        }

        return $results;
    }

    /**
     * Provide minimal fallback HTML when Relay is down.
     */
    private function render_fallback(string $block, array $props): string {
        // Minimal structure for specific blocks to avoid CLS or empty holes
        
        $attrs = $props['attributes'] ?? [];

        switch ($block) {
            case 'renderkit/hero':
                $heading = $attrs['heading'] ?? '';
                return sprintf(
                    '<div style="min-height:60vh; display:flex; align-items:center; justify-content:center; background:#111; color:#fff; padding:40px;"><h1>%s</h1></div>',
                    esc_html($heading)
                );

            case 'renderkit/text-block':
                return sprintf(
                    '<div class="rk-text">%s</div>', 
                    wp_kses_post($props['content'] ?? '')
                );

            case 'renderkit/product-grid':
                return '<div class="rk-product-grid" style="padding:40px; text-align:center;">Products loading...</div>';

            default:
                return '';
        }
    }
}

