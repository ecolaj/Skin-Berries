/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'skin-blush': '#fdf2f8', // very light pink
        'skin-rose': '#f472b6',
        'skin-accent': '#db2777', // deeper rose gold
        'skin-dark': '#4b5563', // elegant gray text
        'skin-bg': '#fcfcfc',
        'skin-card': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

