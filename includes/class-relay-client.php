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
        if ($this->url === '' || $this->secret === '') {
            return '';
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
            return '';
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw = (string) wp_remote_retrieve_body($response);

        if ($status < 200 || $status >= 300) {
            return '';
        }

        $json = json_decode($raw, true);
        if (!is_array($json) || empty($json['ok']) || !isset($json['html']) || !is_string($json['html'])) {
            return '';
        }

        $this->memo[$cache_key] = $json['html'];
        return $json['html'];
    }
}

