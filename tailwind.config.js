/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dawin Finishes brand colors
        boysenberry: {
          DEFAULT: '#872E5C',
          light: '#a34573',
          dark: '#6a2449',
          50: '#fdf2f7',
          100: '#fce7f0',
          200: '#fbcfe2',
          300: '#f9a8c9',
          400: '#f472a5',
          500: '#872E5C',
          600: '#6a2449',
          700: '#5a1e3d',
          800: '#4a1932',
          900: '#3d1529',
        },
        goldenBell: {
          DEFAULT: '#E18425',
          light: '#e89d4d',
          dark: '#c06e1c',
          50: '#fef7ed',
          100: '#fdecd4',
          200: '#fad5a8',
          300: '#f6b871',
          400: '#f19038',
          500: '#E18425',
          600: '#c06e1c',
          700: '#9f5519',
          800: '#80441b',
          900: '#6a3a19',
        },
        cashmere: {
          DEFAULT: '#E2CAA9',
          light: '#efe3d4',
          dark: '#c9a87a',
        },
        pesto: {
          DEFAULT: '#8A7D4B',
          light: '#a69862',
          dark: '#6e6339',
        },
        seaform: {
          DEFAULT: '#7ABDCD',
          light: '#a3d4e0',
          dark: '#5aa3b5',
        },
        teal: {
          DEFAULT: '#0A7C8E',
          light: '#0d9bb2',
          dark: '#085f6d',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
