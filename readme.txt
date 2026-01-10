=== RenderKit ===
Contributors: felix
Tags: react, blocks, ssr, relay, performance
Requires at least: 6.4
Tested up to: 6.7
Stable tag: 1.3.0
Requires PHP: 8.0
License: GPLv2 or later

High-performance Server-Side Rendering (SSR) Block Toolkit for WordPress with React Hydration.

== Description ==

RenderKit connects WordPress blocks with a high-performance external SSR Relay service (Node.js). It allows you to write blocks in standard React/TypeScript, render them server-side for perfect SEO and TTI/CLS metrics, and hydrate them on the client for interactivity.

Key Features:
* **Hybrid Rendering:** Static HTML from Node.js Relay + Interactive React on client.
* **Modern Stack:** TypeScript, Tailwind CSS, esbuild.
* **Performance:** Built-in Image Optimization (WebP), Critical CSS, and Font optimization.
* **Monitoring:** Full Prometheus/Grafana stack included for performance observability.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/renderkit` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Configure the **RenderKit Relay** connection in Settings -> RenderKit Relay.
4. Ensure the Relay service (Docker) is running via `make relay-up` or `make dev`.

== Changelog ==

= 1.3.0 =
* **Feature:** Performance Monitoring Stack (Prometheus + Grafana) included locally.
* **Feature:** Detailed Server-Side Rendering metrics (Latency, Throughput, Errors).
* **Feature:** New `make dev` command starts monitoring stack automatically.
* **Feature:** Load testing tools included.
* **Improvement:** Optimized millisecond-precision timing for SSR latency.
* **Improvement:** Granular system error tracking (Auth, JSON, Render exceptions).

= 1.2.3 =
* **Feature:** Added "Minimal" variant for Hero block (perfect for legal/sub-pages).
* **Improvement:** Optimized scroll animations to run only on full-height Hero variants.

= 1.2.2 =
* **Feature:** New Footer Block with menu integration and flexible content areas.
* **Feature:** New Text Block (`.rk-prose`) for better typography management.
* **Fix:** Improved TypeScript definitions for InnerBlocks and Textarea inputs.

= 1.2.1 =
* **Feature:** Admin Settings page for Relay configuration (URL, Secret, Timeout).
* **Feature:** Health Check status indicator in Admin settings.
* **Feature:** One-click Secret generation and `.env` file syncing.
* **Fix:** Standardized plugin versioning across all files.

= 1.2.0 =
* **Feature:** Automatic Image Optimization (WebP generation on upload).
* **Feature:** Font Performance (swap display, preconnect).
* **Feature:** Premium Custom Scrollbar styling (Gold/Taupe theme).
* **Feature:** Dynamic Theme Color for iOS Safari rubber-band effect.
* **Improvement:** Better compression algorithms for images.
* **Fix:** Resolved layout shifts with Navigation block responsiveness.

= 1.1.0 =
* **Feature:** Premium Navigation Block with backdrop blur, mobile drawer, and cart integration.
* **Feature:** Products Custom Post Type (CPT) with Taxonomy support.
* **Feature:** Product Grid Block (Bento-style layout) with hover effects.
* **Feature:** Centralized Theme/Design System configuration.
* **Improvement:** Refactored block architecture for better maintainability.

= 1.0.0 =
* Initial Release.
* Core Relay Service (Node.js + Docker).
* React Hydration engine.
* Hero Block.
* Tailwind CSS + PostCSS integration.
