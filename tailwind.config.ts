import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Noto Naskh Arabic", "Amiri", "serif"],
        display: ["Noto Kufi Arabic", "serif"],
      },
      colors: {
        teal: {
          950: "#042f2e",
          900: "#0F4C5C",
          800: "#155e75",
          700: "#0e7490",
          600: "#0891b2",
          500: "#06b6d4",
          100: "#cffafe",
          50: "#ecfeff",
        },
        gold: {
          600: "#b7862b",
          500: "#D4AF37",
          400: "#e4c55a",
          100: "#fef9c3",
          50: "#fefce8",
        },
        cream: {
          100: "#FDF6E3",
          50: "#FEFDF9",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
