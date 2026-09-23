/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic theme tokens mapped to active CSS custom properties
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        accent: 'var(--color-accent)',
        deep: 'var(--color-primary-deep)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-secondary': 'var(--color-surface-secondary)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',

        // Brand colors with CSS variable fallbacks
        brand: {
          50: 'var(--color-background)',
          100: 'var(--color-surface-secondary)',
          200: 'var(--color-surface-secondary)',
          300: 'var(--color-accent)',
          400: 'var(--color-accent)',
          500: 'var(--color-primary)',
          600: 'var(--color-primary-hover)',
          700: 'var(--color-primary-hover)',
          800: 'var(--color-primary-deep)',
          900: 'var(--color-primary-deep)',
          950: 'var(--color-background)',
        },

        // Legacy Nest system mappings for complete backward compatibility
        nest: {
          primary: 'var(--color-primary)',
          dark: 'var(--color-primary-hover)',
          deep: 'var(--color-primary-deep)',
          lightBg: 'var(--color-background)',
          lightSurface: 'var(--color-surface)',
          lightSecondary: 'var(--color-surface-secondary)',
          lightBorder: 'var(--color-border)',
          lightText: 'var(--color-text-primary)',
          lightTextSec: 'var(--color-text-secondary)',
          lightTextMuted: 'var(--color-text-muted)',
          darkBg: 'var(--color-background)',
          darkSurface: 'var(--color-surface)',
          darkSecondary: 'var(--color-surface-secondary)',
          darkBorder: 'var(--color-border)',
          darkText: 'var(--color-text-primary)',
          darkTextSec: 'var(--color-text-secondary)',
          darkTextMuted: 'var(--color-text-muted)',
          darkAccent: 'var(--color-accent)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
