/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx,html}',
    './public/static/**/*.{js,html}',
    './public/**/*.{html,js}'
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
        secondary: '#475569',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#F43F5E',
        purple: '#8B5CF6',
        cyan: '#06B6D4',
        rose: '#F43F5E'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-up': 'fadeInUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      },
      borderWidth: {
        3: '3px'
      }
    }
  },
  plugins: []
}
