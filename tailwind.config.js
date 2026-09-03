/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1F3864",
        teal: "#0F6E63",
        gold: "#9C7A29",
      },
    },
  },
  plugins: [],
};
