/** @type {import('tailwindcss').Config} */
// ألوان Savana3D مستوحاة من الطباعة نفسها: سطح الطابعة، الغرافيت، وبرتقالي الفيلامنت.
// الأسماء القديمة (navy / teal / gold) باقية عشان كل الصفحات تاخذ الهوية الجديدة تلقائيًا.
module.exports = {
  darkMode: "class",
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1C2422",      // غرافيت — النص والأزرار الأساسية
        teal: "#0E6B5F",      // أخضر الشعار — روابط ونجاح
        gold: "#D9480F",      // برتقالي الفيلامنت — الإجراء الأهم بكل صفحة
        bed: "#ECEEE9",       // سطح الطابعة — خلفية الصفحات
        line: "#D3D8D0",      // خطوط فاصلة هادئة
        filament: "#D9480F",
        graphite: "#1C2422",
      },
      fontFamily: {
        display: ["Alexandria", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
        sans: ["IBM Plex Sans Arabic", "system-ui", "Segoe UI", "Tahoma", "sans-serif"],
      },
      keyframes: {
        layerIn: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        nozzleRun: {
          "0%, 100%": { transform: "translateX(-38px)" },
          "50%": { transform: "translateX(38px)" },
        },
      },
    },
  },
  plugins: [],
};
