/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Cairo", "serif"],
      },
      colors: {
        navy: {
          950: "#070E17",
          900: "#0D1B2A",
          800: "#132233",
          700: "#1A2B3C",
          600: "#223348",
        },
        gold: {
          300: "#FFD97A",
          400: "#F5C842",
          500: "#F0A500",
          600: "#D4900A",
        },
        parchment: {
          100: "#F5EDD8",
          200: "#EDE0C4",
          300: "#D9C9A8",
          400: "#B8A882",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.45s cubic-bezier(0.16,1,0.3,1)",
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
      },
    },
  },
  plugins: [],
};
