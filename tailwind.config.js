/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Internal token name kept as `savr` — values are PickyBites coral brand colors
        savr: {
          50: "#FFFDFC",
          100: "#FFF0EA",
          200: "#EDE4E0",
          300: "#D4C8C2",
          /** Secondary body text (warm neutral — not coral) */
          350: "#756B67",
          400: "#9D9692",
          500: "#FF8559",
          600: "#E96F45",
          650: "#4A4450",
          700: "#D45F38",
          800: "#3D3540",
          875: "#252030",
          900: "#241F1D",
          925: "#181C28",
          950: "#0F1219",
        },
      },
    },
  },
  plugins: [],
};
