# RenderKit Changelog

All notable changes to this plugin will be documented in this file.

## [1.1.0] - 2026-01-10

### Added
- **Navigation Block** - Premium navigation bar with WordPress menu integration
  - Scroll-based transparency with backdrop blur
  - Shopping cart icon with hover indicator
  - Mobile responsive with animated drawer
  - Smooth entrance animations
- **Menu Locations** - Three menu locations registered for WordPress admin
  - RenderKit Primary Menu
  - RenderKit Secondary Menu
  - RenderKit Footer Menu
- **Theme System** - Centralized brand configuration (`src/theme/index.ts`)

### Changed
- Simplified block structure (4 files per block instead of 7)
- Navigation uses inline styles for cross-theme compatibility
- Improved Hero block layout alignment

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
