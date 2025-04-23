
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    theme: {
      extend: {
        colors: {
          gray: {
            900: '#121212', // Hintergrundfarbe
            800: '#1e1e1e', // Kartenfarbe
            700: '#2d2d2d', // Inputfelder
            600: '#3d3d3d', // Bordercol
            500: '#6b7280', // Text
            400: '#9ca3af', // Text
            300: '#d1d5db', // Text
          },
          orange: {
            400: '#fb923c', // Helle Akzentfarbe
            500: '#f97316', // Standardakzentfarbe 
            600: '#ea580c', // Dunkle Akzentfarbe (Buttons)
            700: '#c2410c', // Hover-Zustand
          }
        },
        boxShadow: {
          'dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        }
      },
    },
    plugins: [],
  }
