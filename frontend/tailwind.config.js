/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'ping-slow':   'ping 3s cubic-bezier(0,0,0.2,1) infinite',
        'siren':       'siren 1s ease-in-out infinite',
        'ticker':      'ticker 20s linear infinite',
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
      },
    },
  },
  plugins: [],
};
