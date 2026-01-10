/**
 * RenderKit Theme Configuration
 * 
 * Customize these values for different sites/brands.
 * This is the single source of truth for all design tokens.
 */

export const theme = {
    /**
     * Brand name - used for labeling
     */
    name: 'Fräulein einzigartig',

    /**
     * Color palette
     */
    colors: {
        // Brand colors
        cream: '#FFFEF9',
        greige: '#E8E3DB',
        taupe: '#9C9083', // Softer taupe
        gold: '#C6A87C',  // Softer, warmer gold
        anthracite: '#2C2A28', // Softer black
        black: '#121212', // Not pure black

        // Semantic aliases
        background: '#FFFEF9',
        foreground: '#2C2A28',
        muted: '#E8E3DB',
        mutedForeground: '#9C9083',
        accent: '#C6A87C',
        border: 'rgba(156, 144, 131, 0.2)',
    },

    /**
     * Typography
     */
    fonts: {
        display: "'Cormorant Garamond', Georgia, serif",
        body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    /**
     * Spacing scale (in rem)
     */
    spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '2rem',
        lg: '4rem',
        xl: '8rem',
    },

    /**
     * Animation settings
     */
    animation: {
        duration: {
            fast: 0.2,
            normal: 0.5,
            slow: 1.2,
        },
        easing: {
            smooth: [0.22, 1, 0.36, 1],
        },
    },
} as const;

// Helper to get CSS variable reference
export const cssVar = (name: keyof typeof theme.colors) =>
    `var(--rk-${name}, ${theme.colors[name]})`;

// Export type for theme
export type Theme = typeof theme;
