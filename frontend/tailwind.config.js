/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'ping-slow':   'ping 3s cubic-bezier(0,0,0.2,1) infinite',
        'siren':       'siren 1s ease-in-out infinite',
        'ticker':      'ticker 20s linear infinite',
        'fade-down':   'fadeDown .2s ease',
        'slide-up':    'slideUp .22s ease',
        'modal-in':    'modalIn .25s cubic-bezier(.34,1.2,.64,1)',
      },
      keyframes: {
        siren: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        ticker: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeDown: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.97) translateY(12px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      colors: {
        gray: {
          975: '#030712',
        },
      },
    },
  },
  plugins: [],
};
