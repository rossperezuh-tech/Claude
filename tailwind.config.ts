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
        // Warm charcoal palette — softer and less harsh than a cold blue-black.
        surface: {
          DEFAULT: "#17140f",
          raised: "#1f1b15",
          overlay: "#2a241d",
          edge: "#3a3229",
        },
        ink: {
          DEFAULT: "#f1ece2",
          dim: "#b4a894",
          faint: "#7c7061",
        },
      },
    },
  },
  plugins: [],
};
export default config;
