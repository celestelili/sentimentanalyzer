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
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        cream: "#FAF8F3",
        ink: "#1A1A1A",
        muted: "#6B6B6B",
        accent: "#C8A96E",
        positive: "#4A7C59",
        neutral: "#6B7280",
        negative: "#9B3A3A",
        border: "#E5E0D8",
      },
    },
  },
  plugins: [],
};

export default config;
