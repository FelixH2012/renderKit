<?php
/**
 * AI Service for Gemini Integration
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Handles AI generation requests via Google Gemini API
 */
class AIService {

    /**
     * API Endpoint
     */
    private const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    /**
     * Initialize
     */
    public function init(): void {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void {
        register_rest_route('renderkit/v1', '/ai/generate', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_generate'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'args' => [
                'imageUrl' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return filter_var($param, FILTER_VALIDATE_URL);
                    }
                ]
            ]
        ]);
    }

    /**
     * Handle generation request
     */
    public function handle_generate(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $options = get_option('renderkit_relay', []);
        $api_key = $options['gemini_api_key'] ?? '';

        if (empty($api_key)) {
            return new WP_Error('no_api_key', 'Gemini API Key is missing in settings.', ['status' => 500]);
        }

        $image_url = $request->get_param('imageUrl');
        
        // 1. Fetch Image
        $image_data = $this->fetch_image($image_url);
        if (is_wp_error($image_data)) {
            return $image_data;
        }

        // 2. Prepare Payload
        $payload = [
            'contents' => [
                [
                    'parts' => [
                        [
                            'text' => "Analyze this product image. Act as a professional e-commerce copywriter. \n" .
                                      "Return a JSON object (no markdown, just raw JSON) with the following fields:\n" .
                                      "- title: A creative, catchy product title in German (max 50 chars).\n" .
                                      "- excerpt: A short, engaging summary in German (max 120 chars).\n" .
                                      "- description: A detailed, persuasive product description in German. Use HTML tags like <strong>, <p>, <ul>, <li> to format key features and benefits clearly.\n" .
                                      "- price: An estimated price number (e.g. 49.99).\n" .
                                      "- sale_price: An estimated sale price (slightly lower) or 0.\n"
                        ],
                        [
                            'inline_data' => [
                                'mime_type' => 'image/jpeg', // We'll convert/force JPEG or detect
                                'data'      => base64_encode($image_data['body'])
                            ]
                        ]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.4,
                'response_mime_type' => 'application/json'
            ]
        ];

        // 3. Call Gemini API
        $response = wp_remote_post(self::API_URL . '?key=' . $api_key, [
            'body'    => json_encode($payload),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($code !== 200) {
            return new WP_Error('gemini_error', 'Gemini API Error: ' . ($data['error']['message'] ?? 'Unknown'), ['status' => 500]);
        }

        // 4. Parse Response
        try {
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $json = json_decode($text, true);
            
            // Fallback for markdown code blocks if Gemini ignores response_mime_type (rare with flash-1.5)
            if (is_string($text) && str_contains($text, '```')) {
                 $text = preg_replace('/^```json\s*|\s*```$/', '', $text);
                 $json = json_decode($text, true);
            }

            return new WP_REST_Response($json, 200);
        } catch (\Exception $e) {
            return new WP_Error('parsing_error', 'Failed to parse AI response.', ['status' => 500]);
        }
    }

    /**
     * Fetch image from URL
     */
    private function fetch_image(string $url): array|WP_Error {
        // Optimization: If local file, read directly? 
        // For now, wp_remote_get is safer to handle any URL.
        $response = wp_remote_get($url, ['timeout' => 10]);
        
        if (is_wp_error($response)) {
            return $response;
        }

        $body = wp_remote_retrieve_body($response);
        if (empty($body)) {
            return new WP_Error('empty_image', 'Could not download image.', ['status' => 400]);
        }

        return ['body' => $body];
    }
}
