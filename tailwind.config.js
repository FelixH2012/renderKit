/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{ts,tsx,js,jsx}',
        './src/**/*.php',
    ],
    theme: {
        extend: {
            colors: {
                cream: 'var(--rk-cream, #FFFEF9)',
                greige: 'var(--rk-greige, #E8E3DB)',
                taupe: 'var(--rk-taupe, #8B7F6F)',
                gold: 'var(--rk-gold, #B8975A)',
                'champagne-gold': 'var(--rk-gold, #B8975A)',
                anthracite: 'var(--rk-anthracite, #1A1816)',
                'warm-anthracite': 'var(--rk-anthracite, #1A1816)',
                'deep-black': 'var(--rk-black, #000000)',
            },
            fontFamily: {
                display: ['var(--rk-font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
                body: ['var(--rk-font-body)', 'DM Sans', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
    important: '.renderkit-block',
};
