# AI Guide: Building RenderKit Blocks (renderKit-Relay)

This plugin uses **renderKit-Relay** for mandatory server-side rendering (SSR). The **TSX `view.tsx`** for each block is the single source of truth for frontend HTML.

## Mental model

- **Editor (Gutenberg)**: React/TSX runs in the browser and is bundled into `build/editor.js`.
- **Frontend HTML (SSR)**: WordPress calls renderKit-Relay (Node sidecar) which executes TSX and returns **static HTML**.
- **Frontend JS**: `build/view.js` is enhancement-only (no hydration). Blocks must work without JS.

## Hard rules (avoid “dumb mistakes”)

1) **SSR/no‑JS is mandatory**
   - The rendered HTML must be complete and usable without client JS.
   - Use native HTML for interactions (e.g. `<details>/<summary>`, real links, real form controls).

2) **TSX view is the source of truth**
   - Do not add/maintain separate PHP templates for markup.
   - If you change HTML, change `src/blocks/<block>/view.tsx`.

3) **Views must be server-safe**
   - Never access `window`, `document`, `localStorage`, `matchMedia`, etc in `view.tsx`.
   - Avoid client-only hooks (`useEffect`, `useLayoutEffect`) in `view.tsx`.
   - Keep `view.tsx` deterministic: given props → same HTML.

4) **Return exactly one root element**
   - `view.tsx` must return a single root tag (no fragments) because WordPress wrapper attributes are injected into the first/root element.

5) **Props must be JSON-serializable**
   - Relay receives props via JSON. Only pass plain objects/arrays/strings/numbers/booleans/null.

6) **WordPress data must be prepared in PHP**
   - The Relay container does not have access to WP APIs.
   - Fetch menus/posts/products/etc in PHP and pass them as `attributes` to the TSX view.

## Where things live

- Block editor UI: `renderkit/src/blocks/<block>/editor.tsx`
- SSR view (frontend HTML): `renderkit/src/blocks/<block>/view.tsx`
- SSR registry (must include every SSR block): `renderkit/src/relay/renderer.tsx`
- Block registration for editor: `renderkit/src/editor/index.tsx`
- Server-side data preparation: `renderkit/includes/core/class-block-loader.php`
- Relay service: `renderkit/relay/server.js` (HMAC-protected `/render`, `/health`)
- Relay configuration UI: WP Admin → Settings → renderKit-Relay (`renderkit/includes/admin/class-relay-settings.php`)

## Adding a new block (checklist)

1) Create folder: `renderkit/src/blocks/<slug>/`
   - Add `block.json`, `editor.tsx`, `view.tsx` (and `types.ts` if useful).
   - Ensure `block.json` has `"name": "renderkit/<slug>"` and `"apiVersion": 3`.
   - The block is dynamic (save is `null` in editor; SSR provides HTML).

2) Register block in the editor bundle
   - Add imports and an entry in `renderkit/src/editor/index.tsx`.

3) Register the SSR view in the Relay registry
   - Import the TSX view and add it to the `registry` map in `renderkit/src/relay/renderer.tsx`.
   - If you forget this, the frontend will render empty (admins see an HTML comment).

4) Add Zod schema for props validation
   - Add an attributes schema in `renderkit/src/relay/schemas.ts`.
   - Add an entry to `relayPropsSchemas` with the block name.
   - If you forget this, SSR validation fails and the block won't render.

5) Add WordPress-derived props (only when needed)
   - Extend `prepare_relay_attributes()` in `renderkit/includes/core/class-block-loader.php`.
   - Example patterns:
     - Navigation builds `menuItems` from WP menus.
     - Product grid passes `products` from WP queries.

6) Styling
   - Prefer stable class names on the root element: include `renderkit-block` + `renderkit-<slug>`.
   - Put shared CSS in `renderkit/src/styles/main.css`.
   - Avoid generating Tailwind class names dynamically (Tailwind may purge them).

7) Optional JS enhancements (must not be required)
   - Add `data-rk-*` attributes in the TSX view and enhance them in `renderkit/src/view/index.ts`.
   - Enhancements must gracefully no-op if the element is missing.

## Build & dev loop

- Build once: `npm run build` (writes `renderkit/build/*`, including `build/relay-renderer.cjs`)
- Watch: `npm run dev` (rebuilds on changes)
- Relay container: `make -C renderkit relay-up`
  - The Relay auto-reloads `build/relay-renderer.cjs` when it changes (no container restart needed).

## Debugging SSR

- WP Admin → Settings → renderKit-Relay: check **Status** + **Version**.
- CLI: `make -C renderkit relay-health` and `make -C renderkit relay-logs`.
- If SSR fails:
  - Visitors get empty output (SEO-safe failure mode).
  - Admins see `<!-- renderKit-Relay: render failed for … -->`.

## Security (do not weaken)

- Relay is HMAC-protected; do not remove the signature checks.
- Keep Relay bound to `127.0.0.1` (do not expose it publicly).
- Only allow rendering of blocks from the explicit registry in `renderkit/src/relay/renderer.tsx`.

---

## PHP Architecture Overview

### Core Classes (`renderkit/includes/core/`)

| Class | Purpose |
|-------|---------|
| `RenderKit` | Main plugin bootstrap, enqueues assets, hooks WordPress actions |
| `BlockLoader` | Auto-discovers blocks from `src/blocks/*/block.json`, registers them with WordPress, handles SSR via Relay |
| `RelayClient` | HTTP client for Relay, implements circuit breaker pattern, snapshot caching, memoization |

### Service Classes (`renderkit/includes/services/`)

| Class | Purpose |
|-------|---------|
| `ImageOptimizer` | WebP conversion, responsive image generation, lazy loading optimization |
| `Forge` | Analytics service, receives events from frontend, provides insights endpoint |
| `AIService` | AI-powered content generation for products |

### Admin Classes (`renderkit/includes/admin/`)

| Class | Purpose |
|-------|---------|
| `RelaySettings` | WP Admin settings page for Relay configuration |
| `MaintenanceMode` | Maintenance mode toggle with customizable page |
| `CookieSettings` | CPT for GDPR cookie consent configuration |

### Content Classes (`renderkit/includes/content/`)

| Class | Purpose |
|-------|---------|
| `Products` | Custom Post Type for products, categories, metadata handling |

---

## Attribute Preparation Pipeline

When a block renders, attributes flow through this pipeline:

```
block.json defaults → Gutenberg editor → PHP prepare_relay_attributes() → Relay → TSX view
```

### Adding WordPress data to blocks

If a block needs WordPress data (menus, posts, users, etc.), extend `prepare_relay_attributes()` in `class-block-loader.php`:

```php
private function prepare_relay_attributes(string $block_name, array $attributes): array {
    switch ($block_name) {
        case 'renderkit/my-new-block':
            return $this->prepare_my_new_block_attributes($attributes);
        default:
            return $attributes;
    }
}

private function prepare_my_new_block_attributes(array $attributes): array {
    // Fetch WordPress data here
    $attributes['myData'] = $this->fetch_my_data();
    return $attributes;
}
```

---

## Circuit Breaker Pattern (Relay Client)

The Relay client implements a circuit breaker to prevent cascading failures:

| State | Behavior |
|-------|----------|
| **Closed** | Normal operation, requests go to Relay |
| **Open** | After 3 consecutive failures, circuit opens for 30 seconds, all requests return fallback HTML |
| **Half-Open** | After 30 seconds, allows 1 probe request to test Relay health |

**Important**: 4xx errors (client errors like invalid props) do NOT trip the circuit breaker—only 5xx errors and network failures do.

### Fallback Rendering

When Relay is unavailable, blocks render minimal SEO-safe fallback HTML:
- First: Check for cached snapshot (transient-based)
- Then: Render block-specific fallback (e.g., Hero shows `<h1>` heading)
- Else: Return empty string

---

## Forge Analytics System

Forge is the built-in analytics system. It captures frontend events without external dependencies.

### Supported Event Types
- `page_view` – Page load
- `block_view` – Block enters viewport
- `click` – Click on block element
- `scroll_depth` – Scroll progress (bucketed: 0.25, 0.5, 0.75, 1.0)
- `form_start` – Form interaction begins
- `form_submit` – Form submitted

### Endpoints
- **POST `/forge/events`** – Submit events (batched)
- **POST `/forge/insights`** – Retrieve aggregated analytics data

### Frontend Integration
Add `data-rk-track` attributes to elements you want to track in the TSX view, then implement tracking in `renderkit/src/view/index.ts`.

---

## CSS & Styling Conventions

### File Structure
- `renderkit/src/styles/main.css` – Shared frontend styles
- `renderkit/src/styles/editor.css` – Editor-only styles
- `renderkit/src/styles/blocks/*.css` – Block-specific styles (imported into main.css)

### Class Naming Convention
- Root element: `renderkit-<block-slug>` (e.g., `renderkit-hero`)
- Inner elements: `renderkit-<block-slug>__<element>` (BEM-style)
- Modifiers: `renderkit-<block-slug>--<modifier>` (e.g., `renderkit-hero--dark`)

### Tailwind Usage
1) Tailwind classes are available but use stable class names on root elements.
2) **Never generate Tailwind classes dynamically** (e.g., `bg-${color}-500`). Tailwind purges them.
3) Use CSS custom properties for dynamic values instead.

### Theme Support
Blocks support `light` and `dark` themes via the `theme` attribute. Apply via:
```tsx
<div className={`renderkit-hero renderkit-hero--${attributes.theme}`}>
```

---

## Common Mistakes to Avoid

| Mistake | Why it's wrong | Fix |
|---------|----------------|-----|
| Using `window` or `document` in `view.tsx` | SSR runs in Node, no browser APIs | Use `data-` attributes and enhance in `view/index.ts` |
| Returning a Fragment from `view.tsx` | WP wrapper attributes need a single root | Always return a single `<div>` or appropriate element |
| Forgetting to add Zod schema | SSR validation fails, block won't render | Add schema in `schemas.ts` AND `relayPropsSchemas` map |
| Dynamic Tailwind classes | Purged by Tailwind, won't work in prod | Use static classes or CSS custom properties |
| Fetching WP data in TSX | Relay has no WP access | Fetch in PHP `prepare_relay_attributes()` |
| Missing `prepare_relay_attributes()` case | Block gets raw editor attributes only | Add switch case for blocks needing WP data |
| Not registering in renderer.tsx | Block renders empty on frontend | Import view and add to `registry` map |
| Missing editor registration | Block won't appear in Gutenberg | Add to `blocks` array in `editor/index.tsx` |

---

## Testing & Verification

### Quick Health Checks
```bash
make relay-health     # Check Relay is responding
make relay-status     # Check Docker container status
make relay-logs       # View Relay logs for errors
```

### Debugging SSR Issues
1) Check WP Admin → Settings → renderKit-Relay for status
2) View browser DevTools for `<!-- renderKit-Relay: ... -->` comments (admin only)
3) Check Relay logs: `make relay-logs`
4) Verify block is in `renderer.tsx` registry
5) Verify Zod schema exists and matches `block.json` attributes

### Testing New Blocks
1) Build: `npm run build`
2) Check editor: Block appears in inserter and renders preview
3) Check frontend: Page loads, no console errors, block renders
4) Check SSR: View page source, HTML is present (not JS-rendered)
5) Check fallback: Stop Relay (`make relay-down`), reload page, verify fallback HTML

### Monitoring
```bash
make monitoring-up    # Start Grafana + Prometheus
make relay-metrics    # View raw Prometheus metrics
```
- Grafana: http://127.0.0.1:3001 (admin / renderkit)
- Prometheus: http://127.0.0.1:9090

---

## Pages (Full-Page SSR Templates)

RenderKit supports full-page SSR templates for custom post types:

| Page | Path | Purpose |
|------|------|---------|
| Product Page | `src/pages/product-page/` | Single product view |
| Product Archive | `src/pages/product-archive/` | Product listing with pagination |

Pages are registered like blocks but render the entire page content (including nav, hero, footer).

---

## Environment Variables (Relay)

Configure in `relay/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `RENDERKIT_RELAY_SECRET` | (required) | HMAC shared secret |
| `RENDERKIT_RELAY_PORT` | 8787 | Server port |
| `RENDERKIT_RELAY_CACHE_ENABLED` | 1 | Enable LRU response cache |
| `RENDERKIT_RELAY_CACHE_MAX_ENTRIES` | 500 | Max cached responses |
| `RENDERKIT_RELAY_CACHE_TTL_MS` | 300000 | Cache TTL (5 min) |
| `RENDERKIT_FORGE_ENABLED` | 1 | Enable Forge analytics |

---

## Quick Reference: File Locations

| What | Where |
|------|-------|
| Block editor UI | `src/blocks/<slug>/editor.tsx` |
| Block SSR view | `src/blocks/<slug>/view.tsx` |
| Block metadata | `src/blocks/<slug>/block.json` |
| Block types | `src/blocks/<slug>/types.ts` |
| Block CSS | `src/styles/blocks/<slug>.css` |
| Editor registration | `src/editor/index.tsx` |
| SSR registry | `src/relay/renderer.tsx` |
| Zod schemas | `src/relay/schemas.ts` |
| PHP attribute prep | `includes/core/class-block-loader.php` |
| Relay client | `includes/core/class-relay-client.php` |
| Relay server | `relay/server.js` |
| Main CSS | `src/styles/main.css` |
| Editor CSS | `src/styles/editor.css` |
