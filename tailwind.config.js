import preset from 'nativewind/preset';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [preset],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        title: ['Dela-Gothic', 'serif'], // title of scenes and basically nothing else
        display: ['BarlowCondensed', 'sans-serif'],
      },
      zIndex: {
        1: '1',
      },
      colors: {
        error: '#FFB7B7',
      },
      backgroundColor: {
        'black-12': 'rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
};
