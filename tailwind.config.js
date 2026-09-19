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
        // Premium EFZ Official Colorway System
        efz: {
          midnight: {
            DEFAULT: '#070B14',
            secondary: '#0B1120',
            tertiary: '#101827',
            sidebar: '#080E1A',
          },
          teal: {
            DEFAULT: '#19C3D1',
            hover: '#27D7E5',
            mid: '#168FAE',
            soft: 'rgba(25, 195, 209, 0.12)',
            glow: 'rgba(25, 195, 209, 0.22)',
            50: '#F0FBFC',
            100: '#D7F5F8',
            200: '#B0ECF2',
            300: '#77DEE8',
            400: '#27D7E5',
            500: '#19C3D1',
            600: '#168FAE',
            700: '#126A82',
            800: '#0E4B5C',
            900: '#0A323E',
            950: '#051C24',
          },
          gold: {
            DEFAULT: '#D8A83E',
            light: '#F1C968',
            soft: 'rgba(216, 168, 62, 0.12)',
            glow: 'rgba(216, 168, 62, 0.18)',
            50: '#FEFDF8',
            100: '#FCF7E9',
            200: '#F7EDCA',
            300: '#F1C968',
            400: '#E4B84D',
            500: '#D8A83E',
            600: '#B58728',
            700: '#8B6418',
            800: '#63450E',
            900: '#3D2906',
          },
          text: {
            primary: '#F4F7FB',
            secondary: '#A9B6C8',
            muted: '#6F7E92',
          },
          border: {
            subtle: 'rgba(148, 163, 184, 0.10)',
            default: 'rgba(148, 163, 184, 0.16)',
            strong: 'rgba(148, 163, 184, 0.24)',
          },
          glass: {
            primary: 'rgba(18, 28, 45, 0.72)',
            secondary: 'rgba(14, 23, 38, 0.82)',
            elevated: 'rgba(24, 37, 58, 0.88)',
          },
          status: {
            success: '#20C997',
            'success-soft': 'rgba(32, 201, 151, 0.12)',
            warning: '#F2B84B',
            'warning-soft': 'rgba(242, 184, 75, 0.12)',
            danger: '#F05D6C',
            'danger-soft': 'rgba(240, 93, 108, 0.12)',
          }
        },
        // Map teal to the Electric Teal family for universal coherence
        teal: {
          50: '#F0FBFC',
          100: '#D7F5F8',
          200: '#B0ECF2',
          300: '#77DEE8',
          400: '#27D7E5',
          500: '#19C3D1',
          600: '#168FAE',
          700: '#126A82',
          800: '#0E4B5C',
          900: '#0A323E',
          950: '#051C24',
        },
        brand: {
          50: '#F0FBFC',
          100: '#D7F5F8',
          200: '#B0ECF2',
          300: '#77DEE8',
          400: '#27D7E5',
          500: '#19C3D1',
          600: '#168FAE',
          700: '#126A82',
          800: '#0E4B5C',
          900: '#0A323E',
          950: '#051C24',
        }
      },
      boxShadow: {
        'glass-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(148, 163, 184, 0.08)',
        'glass-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(148, 163, 184, 0.10)',
        'glass-md': '0 8px 24px -4px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(148, 163, 184, 0.12)',
        'glass-lg': '0 16px 36px -6px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(148, 163, 184, 0.14)',
        'glass-modal': '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(148, 163, 184, 0.14)',
        'cta-teal': '0 8px 28px rgba(25, 195, 209, 0.18)',
        'glow-teal': '0 0 20px -4px rgba(25, 195, 209, 0.22)',
        'glow-gold': '0 0 20px -4px rgba(216, 168, 62, 0.18)',
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
