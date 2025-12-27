/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4338ca',
        secondary: '#0f172a',
        accent: '#059669',
        slate: {
          900: '#0b1224',
          800: '#111827',
          700: '#1f2937',
          600: '#334155',
          500: '#475569',
          400: '#64748b',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
      },
      boxShadow: {
        glass: '0 20px 60px -30px rgba(15,23,42,0.6)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
