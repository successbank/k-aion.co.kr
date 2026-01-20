const { BRAND_COLORS } = require('../../packages/shared/src/constants');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: BRAND_COLORS.primary,
          light: BRAND_COLORS.primaryLight,
          dark: BRAND_COLORS.primaryDark,
        },
        brand: BRAND_COLORS,
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Ant Design과 충돌 방지
  },
}
