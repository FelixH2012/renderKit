<?php
/**
 * AI Page Builder Service
 *
 * Generates entire WordPress pages via Gemini AI.
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * AI Page Builder - Generate pages from text prompts
 */
class PageBuilder {

    /**
     * Gemini API Endpoint
     */
    private const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    /**
     * Available blocks with their schemas (simplified for AI context)
     */
    private const BLOCK_SCHEMAS = [
        'renderkit/hero' => [
            'description' => 'Full-width hero section with heading, description, and CTA button',
            'attributes' => [
                'heading' => 'string - Main headline (required)',
                'description' => 'string - Subheading text',
                'buttonText' => 'string - CTA button label',
                'buttonUrl' => 'string - CTA button URL',
                'theme' => 'string - "light" or "dark" (default: dark)',
            ]
        ],
        'renderkit/text-image' => [
            'description' => 'Two-column section with text and image',
            'attributes' => [
                'heading' => 'string - Section heading',
                'description' => 'string - Body text (can include HTML)',
                'imagePosition' => 'string - "left" or "right"',
                'buttonText' => 'string - Optional button text',
                'buttonUrl' => 'string - Optional button URL',
                'theme' => 'string - "light" or "dark"',
            ]
        ],
        'renderkit/faq' => [
            'description' => 'Accordion-style FAQ section',
            'attributes' => [
                'heading' => 'string - Section heading',
                'intro' => 'string - Intro paragraph',
                'items' => 'array of {question: string, answer: string}',
                'theme' => 'string - "light" or "dark"',
            ]
        ],
        'renderkit/contact-form' => [
            'description' => 'Contact form with name, email, subject, message fields',
            'attributes' => [
                'nameLabel' => 'string - Label for name field',
                'emailLabel' => 'string - Label for email field',
                'subjectLabel' => 'string - Label for subject field',
                'messageLabel' => 'string - Label for message field',
                'submitButtonText' => 'string - Submit button text',
                'theme' => 'string - "light" or "dark"',
            ]
        ],
        'renderkit/text-block' => [
            'description' => 'Simple text content section',
            'attributes' => [
                'theme' => 'string - "light" or "dark"',
                'width' => 'string - "narrow" or "wide"',
            ],
            'innerContent' => 'HTML content goes inside the block'
        ],
        'renderkit/swiper' => [
            'description' => 'Image/content carousel slider',
            'attributes' => [
                'ariaLabel' => 'string - Accessible label',
                'showArrows' => 'boolean - Show navigation arrows',
                'showDots' => 'boolean - Show dot indicators',
                'slides' => 'array of {heading, text, linkText, linkUrl, imageUrl}',
                'theme' => 'string - "light" or "dark"',
            ]
        ],
        'renderkit/product-grid' => [
            'description' => 'Grid of product cards (products are loaded from WordPress)',
            'attributes' => [
                'columns' => 'number - Grid columns (2-4)',
                'count' => 'number - Number of products to show',
                'showPrice' => 'boolean - Display prices',
                'showButton' => 'boolean - Show add-to-cart button',
            ]
        ],
    ];

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
        register_rest_route('renderkit/v1', '/ai/generate-page', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_generate_page'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
            'args' => [
                'prompt' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ],
                'language' => [
                    'required' => false,
                    'type' => 'string',
                    'default' => 'de',
                ],
            ]
        ]);

        // Endpoint to get available block schemas (for frontend reference)
        register_rest_route('renderkit/v1', '/ai/schemas', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_schemas'],
            'permission_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);
    }

    /**
     * Get available block schemas
     */
    public function get_schemas(): WP_REST_Response {
        return new WP_REST_Response(self::BLOCK_SCHEMAS, 200);
    }

    /**
     * Handle page generation request
     */
    public function handle_generate_page(WP_REST_Request $request): WP_REST_Response|WP_Error {
        $options = get_option('renderkit_relay', []);
        $api_key = $options['gemini_api_key'] ?? '';

        if (empty($api_key)) {
            return new WP_Error('no_api_key', 'Gemini API Key is missing in settings.', ['status' => 500]);
        }

        $prompt = $request->get_param('prompt');
        $language = $request->get_param('language') ?? 'de';

        // Build the AI prompt with block context
        $system_prompt = $this->build_system_prompt($language);
        $user_prompt = "Create a page based on this description:\n\n" . $prompt;

        // Prepare Gemini payload
        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $system_prompt . "\n\n" . $user_prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'topP' => 0.95,
                'response_mime_type' => 'application/json'
            ]
        ];

        // Call Gemini API
        $response = wp_remote_post(self::API_URL . '?key=' . $api_key, [
            'body'    => json_encode($payload),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 60
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($code !== 200) {
            $error_message = $data['error']['message'] ?? 'Unknown error';
            return new WP_Error('gemini_error', 'Gemini API Error: ' . $error_message, ['status' => 500]);
        }

        // Parse response
        try {
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
            
            // Handle markdown code blocks if present
            if (str_contains($text, '```')) {
                $text = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', $text);
            }

            $blocks = json_decode($text, true);

            if (!is_array($blocks)) {
                return new WP_Error('parse_error', 'Failed to parse AI response as blocks.', ['status' => 500]);
            }

            // Convert to Gutenberg block format
            $gutenberg_blocks = $this->convert_to_gutenberg_blocks($blocks);

            return new WP_REST_Response([
                'success' => true,
                'blocks' => $gutenberg_blocks,
                'raw' => $blocks,
            ], 200);

        } catch (\Exception $e) {
            return new WP_Error('parse_error', 'Failed to parse AI response: ' . $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * Build system prompt with block context
     */
    private function build_system_prompt(string $language): string {
        $lang_instruction = $language === 'de' 
            ? 'Generate ALL text content in German.' 
            : 'Generate ALL text content in English.';

        $blocks_json = json_encode(self::BLOCK_SCHEMAS, JSON_PRETTY_PRINT);

        return <<<PROMPT
You are an expert WordPress page builder. Your task is to generate a complete, professional page layout using RenderKit blocks.

{$lang_instruction}

## Available Blocks:
{$blocks_json}

## Instructions:
1. Analyze the user's request and create an appropriate page structure
2. Use a logical flow: typically Hero → Content sections → CTA/Contact
3. Generate realistic, professional content (not placeholder text like "Lorem ipsum")
4. Return a JSON array of block objects

## Output Format:
Return a JSON array where each object has:
- "name": The block name (e.g., "renderkit/hero")
- "attributes": Object with the block's attributes

Example:
[
  {
    "name": "renderkit/hero",
    "attributes": {
      "heading": "Willkommen bei uns",
      "description": "Wir sind Ihre Partner für...",
      "buttonText": "Mehr erfahren",
      "buttonUrl": "#about",
      "theme": "dark"
    }
  },
  {
    "name": "renderkit/text-image",
    "attributes": {
      "heading": "Über uns",
      "description": "<p>Seit über 20 Jahren...</p>",
      "imagePosition": "right",
      "theme": "light"
    }
  }
]

IMPORTANT: 
- Return ONLY the JSON array, no additional text
- Make content specific to the user's request, not generic
- Use appropriate themes (dark for hero, alternating for sections)
- Include 4-7 blocks for a complete page
PROMPT;
    }

    /**
     * Convert AI response to Gutenberg block format
     */
    private function convert_to_gutenberg_blocks(array $blocks): array {
        $gutenberg_blocks = [];

        foreach ($blocks as $block) {
            if (!isset($block['name']) || !isset($block['attributes'])) {
                continue;
            }

            $block_name = $block['name'];
            $attributes = $block['attributes'];

            // Build inner content for text-block if needed
            $inner_content = [];
            if ($block_name === 'renderkit/text-block' && isset($block['innerContent'])) {
                $inner_content = [$block['innerContent']];
            }

            $gutenberg_blocks[] = [
                'blockName' => $block_name,
                'attrs' => $attributes,
                'innerBlocks' => [],
                'innerHTML' => '',
                'innerContent' => $inner_content,
            ];
        }

        return $gutenberg_blocks;
    }
}
