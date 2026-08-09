import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        boardly: {
          app: "var(--boardly-app)",
          surface: "var(--boardly-surface)",
          elevated: "var(--boardly-elevated)",
          text: "var(--boardly-text)",
          muted: "var(--boardly-muted)",
          border: "var(--boardly-border)",
          accent: "var(--boardly-accent)",
          ink: "var(--boardly-ink)",
          success: "var(--boardly-success)",
          warning: "var(--boardly-warning)",
          danger: "var(--boardly-danger)",
        },
        ink: "#172033",
        slate: "#455469",
        mist: "#eef2f6",
        cloud: "#f7f9fb",
        line: "#d9e0e8",
        teal: "#0f766e",
        ochre: "#b45309",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 51, 0.08)",
        surface: "var(--boardly-shadow-surface)",
        overlay: "var(--boardly-shadow-overlay)",
      },
    },
  },
  plugins: [],
};

export default config;
