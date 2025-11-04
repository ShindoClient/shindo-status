import type { Config } from 'tailwindcss'

export default {
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts,tsx}',
    './layouts/**/*.{vue,js,ts,tsx}',
    './pages/**/*.{vue,js,ts,tsx}',
    './plugins/**/*.{js,ts}',
    './composables/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './App.{js,ts,vue}',
    './Error.{js,ts,vue}',
    './app.config.{js,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Tight', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        surface: '#050712',
        'surface-elevated': '#0b0f20',
        brand: {
          50: '#f3e9ff',
          100: '#e6d4ff',
          200: '#cdb1ff',
          300: '#b08bff',
          400: '#956aff',
          500: '#7854ff',
          600: '#5a3ef7',
          700: '#422bd5',
          800: '#2d1fa4',
          900: '#1f1576'
        },
        success: '#22e7a0',
        warning: '#f5a524',
        danger: '#f87171'
      },
      boxShadow: {
        glow: '0 24px 70px -35px rgba(90, 62, 247, 0.55)'
      },
      backgroundImage: {
        'status-grid': 'radial-gradient(circle at 25% 15%, rgba(120, 84, 255, 0.22), transparent 60%), radial-gradient(circle at 80% 0%, rgba(66, 43, 213, 0.18), transparent 55%)'
      }
    }
  },
  plugins: []
} satisfies Config
