/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: "#7c5cfc", hover: "#6a4be0" },
        surface: "#141428",
        card: "#1a1a30",
        border: "#2a2a45",
        secondary: "#8888aa",
      },
    },
  },
  plugins: [],
};
