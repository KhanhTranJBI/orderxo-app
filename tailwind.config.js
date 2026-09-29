/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        fire: '#D85A30',
        amber: '#EF9F27',
        deep: '#993C1D',
        gold: '#BA7517',
        cream: '#FDF6ED',
        dark: '#1A0F00',
        mid: '#3D2000',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        dm: ['var(--font-dm)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
