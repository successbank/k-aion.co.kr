import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - 따뜻함, 건강, 활력
        primary: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#E53935', // Main Primary
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        // Secondary - 신뢰, 전문성
        secondary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1976D2', // Main Secondary
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Accent - 프리미엄, 성공
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFC107', // Main Accent
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Background
        background: {
          light: '#FAFAFA',
          white: '#FFFFFF',
        },
        // Text
        text: {
          primary: '#212121',
          secondary: '#757575',
          muted: '#9E9E9E',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // 40~60대 타겟에 맞는 큰 글씨
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
        'sm': ['1rem', { lineHeight: '1.5rem' }],         // 16px
        'base': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'lg': ['1.25rem', { lineHeight: '1.875rem' }],    // 20px
        'xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px
        '2xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
        '4xl': ['3rem', { lineHeight: '3.5rem' }],        // 48px
        '5xl': ['3.75rem', { lineHeight: '4rem' }],       // 60px
      },
      spacing: {
        // 터치 영역 최소 44px 보장
        'touch': '44px',
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
