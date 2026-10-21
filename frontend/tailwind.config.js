/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { brand: { 50: '#eef2ff', 600: '#4f46e5', 700: '#4338ca' } },
    },
  },
  plugins: [],
}