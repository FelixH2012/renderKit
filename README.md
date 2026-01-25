# renderKit

<p align="center">
  <img src="resources/renderKitLogo.png" alt="renderKit logo" width="160" />
</p>

RenderKit is a premium Gutenberg block system built with React, TypeScript, and Tailwind CSS. It focuses on beautiful, interactive blocks with a clean editor experience and reliable frontend rendering.

## Key Features

RenderKit brings modern development practices to WordPress block development:

### Architecture & Performance
-   **React & TypeScript**: Type-safe, component-based block development.
-   **Tailwind CSS**: Utility-first styling with a centralized design system.
-   **Server-Side Rendering (SSR)**: Blocks are rendered via **renderKit-Relay**, a local sidecar service, ensuring SEO-friendly static HTML without client-side JS dependency for initial paint.
-   **Performance Monitoring**: Built-in stack with **Prometheus + Grafana** for tracking SSR latency, throughput, and errors.
-   **Optimizations**: Automatic WebP image generation, font performance (swap/preconnect), and optimized hydration engine.

### Developer Experience
-   **Hot Reloading**: Fast development cycle.
-   **Strict Typing**: Shared types between editor and frontend.
-   **Relay Service**: Docker-based safe execution environment (WordPress communicates via HTTP to `127.0.0.1`).

## Block Library

RenderKit includes a growing suite of premium blocks:

### Core & Layout
-   **Hero Block**: Multiple variants (Standard, Minimal, Full-height) with scroll animations.
-   **Text Block (`.rk-prose`)**: Advanced typography management.
-   **Text-Image**: Flexible layouts with focal point control and object-fit support.
-   **Footer**: Flexible content areas with menu integration.

### Commerce (WooCommerce)
-   **Product Grid**: Bento-style grid with hover effects and buy actions.
-   **Cart**: Session-based cart management.
-   **Swiper**: specialized slider interactions.

### Navigation
-   **Premium Navigation**: Backdrop blur, mobile drawer, and integrated cart.
-   **FAQ**: SSR-safe accordion UI.

### Forms & Engagement
-   **Contact Form**: ReCAPTCHA v3 integration, privacy checks, and status messaging.
-   **Cookie Solution**: Complete consent system with Banner, Gate, and Settings management.

## Requirements

-   WordPress 6.0+
-   PHP 8.0+
-   Node.js (for local development and builds)
-   Docker (for Relay service)

## Quick Start

### 1. Installation

1.  Copy this folder to `wp-content/plugins/renderkit`.
2.  Activate "renderKit" in the WordPress admin.

### 2. Relay Setup (Mandatory)

The Relay service is required for rendering blocks.

1.  Start the relay service:
    ```bash
    cd relay
    ./renderkit-relay up
    ```
2.  Configure WordPress:
    -   Go to **Settings → renderKit-Relay** in the WordPress admin.
    -   Ensure the URL matches your local relay (default: `http://127.0.0.1:3000`).
    -   Copy/Paste the Secret Key found in `relay/.env` or generated during setup.

**Note:** The Relay binds to `127.0.0.1` by default, so no external firewall ports need to be opened.

## Development

### Commands

Install dependencies:
```bash
npm install
```

Run development server (compiles TSX/CSS and watches for changes):
```bash
npm run dev
```
*Note: This also starts the monitoring stack if configured.*

Build for production:
```bash
npm run build
```

### Project Layout

-   `src/` — Source code (React components, blocks, styles).
    -   `blocks/` — Individual block definitions.
-   `build/` — Compiled assets.
-   `includes/` — PHP backend logic.
-   `relay/` — renderKit-Relay service (SSR).
-   `renderkit.php` — Main plugin file.

## Troubleshooting

-   **Relay Connection**: If WordPress cannot connect to the Relay, check if the Docker container is running (`docker ps`) and if the port matches the settings in WordPress.
-   **Styling Issues**: Ensure `npm run dev` or `npm run build` has been run to generate the latest CSS.
