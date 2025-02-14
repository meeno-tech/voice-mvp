import preset from 'nativewind/preset';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [preset],
  theme: {
    extend: {},
  },
  plugins: [],
};
