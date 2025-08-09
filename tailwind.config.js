/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xxs': '320px',
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#1F2937',
      },
      fontFamily: {
        'noto': ['Noto Sans KR', 'sans-serif'],
        'pretendard': ['Pretendard', 'sans-serif'],
        'sans': ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'scroll-up': 'scrollUp 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        scrollUp: {
          '0%': {
            transform: 'translateY(0)'
          },
          '100%': {
            transform: 'translateY(-100%)'
          }
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 