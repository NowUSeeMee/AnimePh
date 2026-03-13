/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        anime: {
          900: '#0f172a',
          800: '#1e293b',
          bg: '#030303',
          card: '#0a0a0b',
          primary: '#6366f1',
          secondary: '#ec4899',
          accent: '#8b5cf6',
          text: '#f8fafc',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
