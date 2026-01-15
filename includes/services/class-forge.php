<?php
/**
 * renderKit-Forge REST API
 *
 * Collects frontend events and proxies them to renderKit-Relay.
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

final class Forge {

    private const MAX_EVENTS = 50;
    private const MAX_STRING = 180;

    private RelayClient $relay;

    public function __construct() {
        $this->relay = new RelayClient($this->get_relay_config());
    }

    public function init(): void {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void {
        register_rest_route('renderkit/v1', '/forge/events', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_events'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('renderkit/v1', '/forge/insights', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_insights'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);
    }

    public function handle_events(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $payload = $request->get_json_params();
        $events = $payload['events'] ?? null;
        if (!is_array($events)) {
            return new WP_Error('forge_invalid_events', 'Events payload is missing.', ['status' => 400]);
        }

        $clean = [];
        foreach (array_slice($events, 0, self::MAX_EVENTS) as $event) {
            if (!is_array($event)) {
                continue;
            }
            $sanitized = $this->sanitize_event($event);
            if ($sanitized !== null) {
                $clean[] = $sanitized;
            }
        }

        if (empty($clean)) {
            return new WP_Error('forge_empty_events', 'No valid events provided.', ['status' => 400]);
        }

        $ok = $this->relay->forge_events($clean);
        return new WP_REST_Response([
            'ok' => $ok,
            'received' => count($clean),
        ], $ok ? 202 : 502);
    }

    public function handle_insights(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $query = $request->get_json_params();
        if (!is_array($query)) {
            $query = [];
        }

        $result = $this->relay->forge_insights($query);
        if ($result instanceof WP_Error) {
            return $result;
        }

        return new WP_REST_Response($result, 200);
    }

    /**
     * @param array<string, mixed> $event
     * @return array<string, mixed>|null
     */
    private function sanitize_event(array $event): ?array {
        $type = $this->sanitize_string($event['type'] ?? '', 32);
        if ($type === '') {
            return null;
        }

        $allowed = [
            'page_view',
            'block_view',
            'click',
            'scroll_depth',
            'form_start',
            'form_submit',
        ];
        if (!in_array($type, $allowed, true)) {
            return null;
        }

        $clean = [
            'type' => $type,
        ];

        $block = $this->sanitize_string($event['block'] ?? '', 80);
        if ($block !== '') {
            $clean['block'] = $block;
        }

        $page = $this->sanitize_string($event['page'] ?? '', self::MAX_STRING);
        if ($page !== '') {
            $clean['page'] = $page;
        }

        $target = $this->sanitize_string($event['target'] ?? '', 120);
        if ($target !== '') {
            $clean['target'] = $target;
        }

        $depth = $event['depth'] ?? null;
        if (is_numeric($depth)) {
            $depth = (float) $depth;
            if ($depth > 1 && $depth <= 100) {
                $depth = $depth / 100;
            }
            if ($depth >= 0 && $depth <= 1) {
                $clean['depth'] = $depth;
            }
        }

        return $clean;
    }

    private function sanitize_string(string $value, int $max): string {
        $value = sanitize_text_field($value);
        if ($value === '') {
            return '';
        }
        return strlen($value) > $max ? substr($value, 0, $max) : $value;
    }

    /**
     * @return array<string, mixed>
     */
    private function get_relay_config(): array {
        $relay = class_exists(__NAMESPACE__ . '\\RelaySettings')
            ? RelaySettings::get_effective_settings()
            : [
                'url' => defined('RENDERKIT_RELAY_URL') ? (string) RENDERKIT_RELAY_URL : 'http://127.0.0.1:8787',
                'secret' => defined('RENDERKIT_RELAY_SECRET') ? (string) RENDERKIT_RELAY_SECRET : '',
                'timeout' => defined('RENDERKIT_RELAY_TIMEOUT') ? (float) RENDERKIT_RELAY_TIMEOUT : 1.5,
            ];

        return [
            'url' => (string) ($relay['url'] ?? 'http://127.0.0.1:8787'),
            'secret' => (string) ($relay['secret'] ?? ''),
            'timeout' => (float) ($relay['timeout'] ?? 1.5),
        ];
    }
}
