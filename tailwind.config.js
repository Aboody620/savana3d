/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
      keyframes: {
        nozzleSway: {
          "0%, 100%": { transform: "translateX(-6px)" },
          "50%": { transform: "translateX(6px)" },
        },
        layerRise: {
          "0%": { opacity: "0.35", transform: "scaleY(0.9)" },
          "100%": { opacity: "1", transform: "scaleY(1)" },
        },
      },
      animation: {
        "nozzle-sway": "nozzleSway 2.8s ease-in-out infinite",
        "layer-rise": "layerRise 1.4s ease-out infinite alternate",
      },
    },
  },
  plugins: [],
};
