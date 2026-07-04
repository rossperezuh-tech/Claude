import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F6F5F1",
        surface: "#FFFFFF",
        ink: "#141310",
        muted: "#4A4640",
        faint: "#6E6A62",
        line: "#E5E2DA",
        "line-strong": "#C7C3B9",
        teal: {
          DEFAULT: "#1F6F66",
          soft: "#E4F2EF",
          ink: "#155048",
          deep: "#0E3B35",
        },
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,25,23,.04), 0 8px 24px rgba(26,25,23,.06)",
        lift: "0 2px 4px rgba(26,25,23,.05), 0 16px 40px rgba(26,25,23,.10)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
