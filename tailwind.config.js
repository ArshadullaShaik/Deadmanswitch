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
        background: '#111827', // Gray 900
        surface: '#1F2937',    // Gray 800
        primary: '#10B981',    // Emerald 500
        secondary: '#3B82F6',  // Blue 500
        accent: '#F43F5E',     // Rose 500
      }
    },
  },
  plugins: [],
}
