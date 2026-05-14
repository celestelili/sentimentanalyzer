import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-dm-mono)", "monospace"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        bg: "#13111C",
        surface: "#1E1B2E",
        card: "#252238",
        input: "#1A1728",
        border: "#3A3555",
        "border-bright": "#5A5280",
        text: "#E8E3F5",
        muted: "#8A84A8",
        purple: "#9B8FD4",
        "purple-bright": "#B8AFEA",
        "purple-dim": "#6B5FA8",
        positive: "#6EC99A",
        neutral: "#9B8FD4",
        negative: "#E08080",
        highlight: "#2E2847",
      },
    },
  },
  plugins: [],
};

export default config;
