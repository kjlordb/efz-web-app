/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // EFZ Authentic Color Theme from WinForms Desktop App
        efz: {
          teal: {
            DEFAULT: '#0E5460', // Legacy WinForms Color.FromArgb(14, 84, 96)
            50: '#F0F8FA',
            100: '#DCEFF2',
            200: '#BCE0E5',
            300: '#89C6D0',
            400: '#4DA4B4',
            500: '#1D8296',
            600: '#14697A',
            700: '#0E5460', // Primary Brand Teal
            800: '#0A414B',
            900: '#072E36',
            950: '#03191E',
          },
          gold: {
            DEFAULT: '#F8CF43', // Legacy WinForms Color.FromArgb(248, 207, 67)
            50: '#FEFDF2',
            100: '#FDF9D9',
            200: '#FAF0A8',
            300: '#F7E272',
            400: '#F8CF43', // Signature Amber Gold
            500: '#E4B622',
            600: '#C29314',
            700: '#946B0C',
            800: '#684809',
            900: '#422C05',
          },
          gray: {
            header: '#919191', // Legacy WinForms DataGridView Column Header Color.FromArgb(145, 145, 145)
          },
          blue: '#007EF9', // Legacy WinForms Button Blue Color.FromArgb(0, 126, 249)
        },
        // Map teal directly to EFZ teal so existing teal-* utility classes inherit the authentic palette
        teal: {
          50: '#F0F8FA',
          100: '#DCEFF2',
          200: '#BCE0E5',
          300: '#89C6D0',
          400: '#4DA4B4',
          500: '#1D8296',
          600: '#14697A',
          700: '#0E5460', // Core EFZ Desktop Color
          800: '#0A414B',
          900: '#072E36',
          950: '#03191E',
        },
        brand: {
          50: '#F0F8FA',
          100: '#DCEFF2',
          200: '#BCE0E5',
          300: '#89C6D0',
          400: '#4DA4B4',
          500: '#1D8296',
          600: '#14697A',
          700: '#0E5460',
          800: '#0A414B',
          900: '#072E36',
          950: '#03191E',
        }
      },
      boxShadow: {
        'glass-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'glass-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glass-md': '0 8px 24px -4px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'glass-lg': '0 16px 36px -6px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        'glass-modal': '0 25px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
        'glow-teal': '0 0 24px -4px rgba(29, 130, 150, 0.45)',
        'glow-gold': '0 0 24px -4px rgba(248, 207, 67, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'spin-slow-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'aura-pulse': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.12)' },
        },
        'shimmer-sweep': {
          '0%': { transform: 'translateX(-160%) rotate(25deg)' },
          '25%': { transform: 'translateX(160%) rotate(25deg)' },
          '100%': { transform: 'translateX(160%) rotate(25deg)' },
        },
        'float-gentle': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'halo-glow': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 8px rgba(248, 207, 67, 0.4)) drop-shadow(0 0 16px rgba(14, 84, 96, 0.3))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 16px rgba(248, 207, 67, 0.75)) drop-shadow(0 0 28px rgba(20, 116, 137, 0.5))',
          },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 18s linear infinite',
        'spin-slow-reverse': 'spin-slow-reverse 24s linear infinite',
        'aura-pulse': 'aura-pulse 4s ease-in-out infinite',
        'shimmer-sweep': 'shimmer-sweep 4.5s ease-in-out infinite',
        'float-gentle': 'float-gentle 4s ease-in-out infinite',
        'halo-glow': 'halo-glow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
