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
        bg: "#FAF0E4",
        surface: "#F5E8D8",
        card: "#EFE0CC",
        input: "#F0E4D2",
        border: "#DFD0BC",
        "border-bright": "#B8A090",
        text: "#2A1F14",
        muted: "#7A6A58",
        purple: "#6B5FA8",
        "purple-bright": "#4A3D8A",
        "purple-dim": "#9080C0",
        positive: "#2E7A50",
        neutral: "#6B5FA8",
        negative: "#A03030",
        highlight: "#EBD9C4",
      },
    },
  },
  plugins: [],
};

export default config;
