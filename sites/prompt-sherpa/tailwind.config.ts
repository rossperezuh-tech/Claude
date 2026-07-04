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
        mist: "#F5F7F2",
        surface: "#FFFFFF",
        ink: "#12160F",
        muted: "#454B40",
        faint: "#666D60",
        line: "#E2E6DC",
        "line-strong": "#C3C9BB",
        lime: {
          DEFAULT: "#4A7A0C",
          soft: "#EDF6DD",
          ink: "#365808",
          deep: "#1F3305",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,22,15,.04), 0 8px 24px rgba(18,22,15,.06)",
        lift: "0 2px 4px rgba(18,22,15,.05), 0 16px 40px rgba(18,22,15,.10)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
