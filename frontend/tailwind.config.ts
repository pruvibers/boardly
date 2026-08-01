import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
      },
    },
  },
  plugins: [],
};

export default config;
