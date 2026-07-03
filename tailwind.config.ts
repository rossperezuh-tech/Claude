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
        surface: {
          DEFAULT: "#0b0e14",
          raised: "#121722",
          overlay: "#1a2130",
          edge: "#232c3f",
        },
        ink: {
          DEFAULT: "#e6eaf2",
          dim: "#9aa5b8",
          faint: "#5c6780",
        },
      },
    },
  },
  plugins: [],
};
export default config;
