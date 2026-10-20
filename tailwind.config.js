/** @type {import('tailwindcss').Config} */
// هوية Savana3D: أبيض وأسود هادئ، والمنتجات وصورها هي اللي تتكلم.
// الأسماء القديمة (navy / teal / gold / graphite) باقية عشان كل الصفحات تاخذ الهوية تلقائيًا.
module.exports = {
  darkMode: "class",
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",       // النص والأزرار
        navy: "#141414",
        graphite: "#141414",
        gold: "#141414",      // الإجراء الأهم = أسود
        teal: "#2F6B5E",      // نجاح وحالات
        bed: "#F7F7F5",       // خلفية الصفحات
        stone: "#ECECE8",     // خلفية صور المنتجات
        line: "#E3E3DE",
        muted: "#6F6F6A",
      },
      fontFamily: {
        display: ["Segoe UI", "system-ui", "-apple-system", "Tahoma", "Arial", "sans-serif"],
        sans: ["Segoe UI", "system-ui", "-apple-system", "Tahoma", "Arial", "sans-serif"],
      },
      letterSpacing: { tightest: "-0.03em" },
    },
  },
  plugins: [],
};
