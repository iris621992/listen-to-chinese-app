import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fff8ed",
        paper: "#fffdf8",
        cinnabar: "#e85d3f",
        persimmon: "#f47a45",
        ink: "#2f241f",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(133, 72, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
