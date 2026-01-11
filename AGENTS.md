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
- Server-side data preparation: `renderkit/includes/class-block-loader.php`
- Relay service: `renderkit/relay/server.js` (HMAC-protected `/render`, `/health`)
- Relay configuration UI: WP Admin → Settings → renderKit-Relay (`renderkit/includes/class-relay-settings.php`)

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
   - Extend `prepare_relay_attributes()` in `renderkit/includes/class-block-loader.php`.
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

