# RenderKit Changelog

All notable changes to this plugin will be documented in this file.

## [1.2.1] - 2026-01-10

### Added
- **renderKit-Relay Settings** - Admin UI for Relay URL/Secret/Timeout
  - Health status + Relay version
  - Generate new secret
  - Optional auto-sync to `relay/.env` for Docker

### Fixed
- Plugin version consistency

---

## [1.2.0] - 2026-01-10

### Added
- **WebP Image Generation** - Automatically creates WebP versions on upload
  - Serves WebP to supporting browsers (60-80% smaller files)
  - Falls back to JPEG/PNG for older browsers
- **Font Optimizations** - Better font loading performance
  - Added `font-display: swap` for all fonts
  - Preconnect hints for Google Fonts
- **Custom Scrollbar** - Premium scrollbar design (taupe/gold)
- **iOS Safari Theme Color** - Rubber-band effect adapts to page colors

### Changed
- Improved image optimizer compression
- Navigation block now uses proper inline styles for reliability

### Fixed
- WordPress margin-block-start override for RenderKit blocks
- Navigation responsive layout issues

---

## [1.1.0] - 2026-01-10

### Added
- **Navigation Block** - Premium navigation bar with WordPress menu integration
  - Scroll-based transparency with backdrop blur
  - Shopping cart icon with hover indicator
  - Mobile responsive with animated drawer
  - Smooth entrance animations
- **Products Custom Post Type** - Full product management
  - Price, sale price, SKU, stock status
  - Product categories taxonomy
  - REST API support
- **Product Grid Block** - Bento grid layout for displaying products
  - Hover animations with image zoom
  - Responsive design
- **Image Optimizer** - Automatic image compression on upload
- **Menu Locations** - Three menu locations for WordPress admin
- **Theme System** - Centralized brand configuration

### Changed
- Simplified block structure (4 files per block)
- Navigation uses inline styles for cross-theme compatibility

### Fixed
- Block category now shows in Gutenberg inserter
- CSS scoping with `.renderkit-block` wrapper

---

## [1.0.0] - 2026-01-10

### Added
- Initial release
- **Hero Block** - Full-page hero section with scroll animations
- **Example Block** - Interactive counter demonstration
- React frontend hydration system
- Tailwind CSS integration with PostCSS
- esbuild bundler configuration
- SSR with PHP templates + React hydration
