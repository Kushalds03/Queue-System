/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FBF9F5',
          subtle: '#F4F0E8',
          card: '#FFFFFF',
          muted: '#EDE7DC',
        },
        charcoal: {
          900: '#17181A',
          800: '#212326',
          700: '#34383C',
          600: '#4D5358',
          500: '#687077',
          400: '#8A929A',
          300: '#B0B8C0',
          200: '#D5DAE0',
          100: '#EAECEF',
        },
        coral: {
          50: '#FDF4F2',
          100: '#FCE7E4',
          200: '#F8CECA',
          300: '#F2A9A1',
          400: '#EB7D70',
          500: '#E05A47', // Primary accent
          600: '#C84533',
          700: '#A63425',
          800: '#872A1F',
          900: '#70241A',
        },
        border: {
          DEFAULT: '#E5E0D8',
          subtle: '#EFECE6',
          strong: '#D0C9BD',
        },
        success: {
          DEFAULT: '#2D8A56',
          light: '#EAF6EE',
          border: '#C3E6D0',
        },
        warning: {
          DEFAULT: '#C97A18',
          light: '#FEF6E9',
          border: '#F6DCB1',
        },
        danger: {
          DEFAULT: '#D13B3B',
          light: '#FDF0F0',
          border: '#F8C8C8',
        },
        info: {
          DEFAULT: '#2575A7',
          light: '#EEF6FA',
          border: '#BFDFEF',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(27, 31, 35, 0.04)',
        'card': '0 1px 3px rgba(27, 31, 35, 0.06), 0 1px 2px rgba(27, 31, 35, 0.04)',
        'elevated': '0 4px 12px rgba(27, 31, 35, 0.08), 0 1px 3px rgba(27, 31, 35, 0.04)',
        'modal': '0 12px 32px rgba(27, 31, 35, 0.12), 0 2px 6px rgba(27, 31, 35, 0.06)',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
      }
    },
  },
  plugins: [],
}
