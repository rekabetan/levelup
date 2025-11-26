/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        levelup: {
          black: "#000000",
          card: "#111111",
          lime: "#D2FF00", // Your accent color
        },
      },
    },
  },
  plugins: [],
};
