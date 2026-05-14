import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Next.js runtime requires unsafe-eval + unsafe-inline in dev; in prod only inline is needed
  // for hydration scripts. Keep both so the build works in both modes.
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  // API calls go only to our own origin — no third-party JS/data from the browser
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Prevent the browser from sniffing MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block iframe embedding entirely
  { key: "X-Frame-Options", value: "DENY" },
  // Force HTTPS for 2 years, include subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Don't leak the full URL to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features this app never uses
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
