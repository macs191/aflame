/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
        },
        dark: {
          900: '#0B0F17',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
