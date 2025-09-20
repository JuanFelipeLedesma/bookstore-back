/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: { brand: { 500: "#22d3ee", 600: "#06b6d4" } },
      boxShadow: { soft: "0 1px 0 rgba(255,255,255,.03) inset, 0 8px 24px rgba(0,0,0,.35)" },
      borderRadius: { xl: "14px", "2xl": "18px" },
    },
  },
  plugins: [],
};