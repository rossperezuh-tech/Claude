import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A0C",
          900: "#101013",
          850: "#141417",
          800: "#18181C",
          700: "#212127",
          600: "#2E2E36",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
        fg: {
          DEFAULT: "#EDEDEF",
          mid: "#9B9BA3",
          dim: "#63636C",
        },
        acid: {
          DEFAULT: "#CDF463",
          dim: "#A8CC4B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        caps: "0.14em",
      },
      animation: {
        "spin-slow": "spin 4s linear infinite",
        "spin-slower": "spin 6.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
