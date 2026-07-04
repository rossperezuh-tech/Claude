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
        canvas: "#F7F8FA",
        surface: {
          DEFAULT: "#FFFFFF",
          sunken: "#F1F3F6",
        },
        ink: {
          DEFAULT: "#12141A",
          dim: "#4B5163",
          faint: "#767D8F",
        },
        line: {
          DEFAULT: "#E4E7EC",
          strong: "#CDD2DC",
        },
        brand: {
          DEFAULT: "#3454D1",
          soft: "#EAEFFD",
          ink: "#28409E",
        },
        good: { DEFAULT: "#158A5A", soft: "#E4F6EE" },
        warn: { DEFAULT: "#B4740E", soft: "#FCF1DD" },
        bad: { DEFAULT: "#C4342F", soft: "#FBEAE9" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,20,26,.04), 0 1px 8px rgba(18,20,26,.05)",
        raised: "0 2px 4px rgba(18,20,26,.05), 0 12px 28px rgba(18,20,26,.08)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
