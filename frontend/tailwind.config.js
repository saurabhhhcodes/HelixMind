/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Neon color palette
                neon: {
                    cyan: '#00f5ff',
                    magenta: '#ff00ff',
                    green: '#00ff88',
                    orange: '#ffaa00',
                    purple: '#a855f7',
                },
                // Dark backgrounds
                dark: {
                    900: '#0a0a0f',
                    800: '#111118',
                    700: '#1a1a24',
                    600: '#222230',
                    500: '#333340',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'scan-line': 'scan-line 3s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'typing': 'typing 1s steps(20) infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 5px #00f5ff, 0 0 10px #00f5ff, 0 0 15px #00f5ff' },
                    '50%': { boxShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 30px #00f5ff' },
                },
                'scan-line': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'typing': {
                    '0%': { opacity: '0' },
                    '50%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'grid-pattern': 'linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px)',
            },
        },
    },
    plugins: [],
};
