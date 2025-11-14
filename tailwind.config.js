/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0b0d',
        surface: '#141419',
        overlay: '#1a1a1f',
        border: '#23232a',
        text: '#eaeaea',
        'text-muted': '#a5a5af',
        primary: '#d6ff3f',
        'primary-dark': '#b8d62b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'in': 'fadeIn 0.5s ease-out forwards',
        'slide-in-from-bottom': 'slideInFromBottom 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideInFromBottom: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
};
