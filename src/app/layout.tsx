import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "SERP Sentiment & Trust Tracker ✿",
  description:
    "AI visibility, trust exposure, and sentiment intelligence. Measures whether brands show up and how they show up across ChatGPT, Perplexity, Gemini, AI Overview, and AI Mode.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmMono.variable}`}>
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
