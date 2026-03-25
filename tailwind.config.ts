import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fbf7",
          100: "#d9f6ea",
          200: "#b4ecd7",
          300: "#84ddbF",
          400: "#4cc9a5",
          500: "#12a87f",
          600: "#0e8f6b",
          700: "#0b7658",
          800: "#085e46",
          900: "#064c39",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
