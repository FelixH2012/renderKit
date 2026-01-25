# Changelog

All notable changes to RenderKit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-01-25

### Added
- **Focal Point Control:** Image blocks now support focal point selection for precise image positioning
- **ObjectFit Support:** Added object-fit CSS property support for better image rendering control
- **Auto-generated Block IDs:** Blocks now automatically generate unique IDs for better tracking and styling
- **HTML Sanitization:** New `html.ts` utility for enhanced security through better HTML sanitization

### Fixed
- **Mobile Navigation:** Fixed mobile navigation drawer behavior and responsiveness issues
- **Docker Configuration:** Resolved hardcoded URL issues in docker-compose configuration
- **Server.js Boilerplate:** Fixed boilerplate code issues in relay server.js

### Improved
- **Tailwind CSS Integration:** Migrated styling system to Tailwind CSS for better maintainability and performance
- **Block Naming:** Improved block naming conventions for better clarity and consistency
- **Design System:** Multiple design updates for enhanced visual consistency across blocks
- **.env Variable Messages:** Better error messages and guidance for missing .env variables

### Security
- **esbuild Update:** Bumped esbuild to version 0.25.12 to address security vulnerabilities
- **HTML Sanitization:** Enhanced HTML sanitization to prevent XSS attacks

## [1.5.1]

### Improved
- Relay fallback now serves last successful SSR snapshot when Relay is down

## [1.5.0]

### Added
- Cookie consent system (banner + gate) with editor controls, consent storage, and footer settings link
- Cookie settings CPT for managing consent categories, descriptions, and links
- Maintenance mode with access key and branded screen
- New FAQ block with SSR-safe accordion UI

### Improved
- Contact form redesign + reCAPTCHA v3 integration + privacy checkbox + status messaging
- Font Awesome icons replacing inline SVGs across blocks
- Text block typography + FAQ spacing alignment to text-image block
- Dev workflow updates (watch reliability, relay restart behavior)

### Fixed
- Enforce HTTPS upload URLs to avoid mixed content warnings

## [1.4.0]

### Added
- New Text-Image Block - Flexible text + image layouts with left/right positioning
- Updated AGENTS.md with Zod schema step for new blocks

### Improved
- Modal animations refined (Spring-like easing, staggered elements)
- Scroll-lock no longer causes navigation jumps

### Fixed
- Footer divider and deco line spacing adjustments

## [1.3.0]

### Added
- Performance Monitoring Stack (Prometheus + Grafana) included locally
- Detailed Server-Side Rendering metrics (Latency, Throughput, Errors)
- New `make dev` command starts monitoring stack automatically
- Load testing tools included

### Improved
- Optimized millisecond-precision timing for SSR latency
- Granular system error tracking (Auth, JSON, Render exceptions)

## [1.2.3]

### Added
- Added "Minimal" variant for Hero block (perfect for legal/sub-pages)

### Improved
- Optimized scroll animations to run only on full-height Hero variants

## [1.2.2]

### Added
- New Footer Block with menu integration and flexible content areas
- New Text Block (`.rk-prose`) for better typography management

### Fixed
- Improved TypeScript definitions for InnerBlocks and Textarea inputs

## [1.2.1]

### Added
- Admin Settings page for Relay configuration (URL, Secret, Timeout)
- Health Check status indicator in Admin settings
- One-click Secret generation and `.env` file syncing

### Fixed
- Standardized plugin versioning across all files

## [1.2.0]

### Added
- Automatic Image Optimization (WebP generation on upload)
- Font Performance (swap display, preconnect)
- Premium Custom Scrollbar styling (Gold/Taupe theme)
- Dynamic Theme Color for iOS Safari rubber-band effect

### Improved
- Better compression algorithms for images

### Fixed
- Resolved layout shifts with Navigation block responsiveness

## [1.1.0]

### Added
- Premium Navigation Block with backdrop blur, mobile drawer, and cart integration
- Products Custom Post Type (CPT) with Taxonomy support
- Product Grid Block (Bento-style layout) with hover effects
- Centralized Theme/Design System configuration

### Improved
- Refactored block architecture for better maintainability

## [1.0.0]

### Added
- Initial Release
- Core Relay Service (Node.js + Docker)
- React Hydration engine
- Hero Block
- Tailwind CSS + PostCSS integration
