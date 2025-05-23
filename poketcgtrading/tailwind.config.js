/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // <-- this line tells Tailwind to scan your React files
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
