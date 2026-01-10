# renderKit

<p align="center">
  <img src="resources/renderKitLogo.png" alt="renderKit logo" width="160" />
</p>

RenderKit is a premium Gutenberg block system built with React, TypeScript, and Tailwind CSS. It focuses on beautiful, interactive blocks with a clean editor experience and reliable frontend rendering.

## renderKit-Relay (SSR, mandatory)

This plugin renders blocks server-side through **renderKit-Relay**, a local Docker sidecar that executes the block TSX and returns static HTML.

- SEO/no-JS friendly: HTML exists without client JavaScript
- Single source of truth: frontend markup lives in TSX
- Safe by design: WordPress/PHP does **not** call `exec()`; it uses HTTP to `127.0.0.1`

### Setup

1) Configure the relay in WordPress: **Settings → renderKit-Relay** (URL + Secret).

2) Start the relay:

```bash
cd relay
./renderkit-relay up
```

Notes:

- No IONOS/firewall port needs opening: the Relay is bound to `127.0.0.1` (not public).
- If you need a different port: set the URL in **Settings → renderKit-Relay** (the page can sync `relay/.env` for Docker).
- The Relay auto-reloads `build/relay-renderer.cjs` when it changes (no container restart needed).

Optional (advanced): lock the config via `wp-config.php` constants (`RENDERKIT_RELAY_URL`, `RENDERKIT_RELAY_SECRET`, `RENDERKIT_RELAY_TIMEOUT`).

## Highlights

- React-based block UI with TypeScript safety
- Tailwind CSS styling pipeline
- WordPress-first build output in `build/`
- Designed for performant, interactive blocks

## Requirements

- WordPress 6.0+
- PHP 8.0+
- Node.js (for local development and builds)

## Quick start

1) Copy this folder to `wp-content/plugins/renderkit`
2) Activate "renderKit" in the WordPress admin

## Development

Install dependencies:

```bash
npm install
```

Run the build in watch mode:

```bash
npm run dev
```

Build production assets:

```bash
npm run build
```

## Project layout

- `src/` — Block source code (React, TypeScript, styles)
- `build/` — Compiled block assets for WordPress
- `includes/` — PHP plugin classes
- `resources/` — Brand assets (logo)
- `renderkit.php` — Plugin bootstrap
- `relay/` — renderKit-Relay (Docker SSR sidecar)
