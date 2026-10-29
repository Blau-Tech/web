/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // The brand face, from brand/brand.json via brand/brand.app.css.
        sans: ['var(--brand-font)'],
      },
    },
  },
  plugins: [],
};
