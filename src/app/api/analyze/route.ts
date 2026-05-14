import { NextRequest, NextResponse } from "next/server";
import {
  discoverBrand,
  fetchLeaderboard,
  visibilityScore,
  type LeaderboardEntry,
  type EngineSOV,
} from "@/lib/seranking";
import { MOCK_LEADERBOARD } from "@/lib/mockData";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

const API_KEY_RE = /^[A-Za-z0-9_\-]{10,200}$/;
const DOMAIN_RE  = /^[A-Za-z0-9][A-Za-z0-9\-\.]{1,100}\.[A-Za-z]{2,10}$/;

function validateApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return API_KEY_RE.test(t) ? t : null;
}

function validateDomain(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  return DOMAIN_RE.test(t) ? t : null;
}

function validateCountry(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  return SUPPORTED_COUNTRIES.some((c) => c.code === t) ? t : null;
}

function redactKey(message: string, key: string): string {
  return message.replaceAll(key, "[REDACTED]");
}

function avgSOV(sov: EngineSOV): number {
  const vals = Object.values(sov);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function leaderboardToOverview(leaderboard: LeaderboardEntry[]) {
  const avgs      = leaderboard.map((e) => avgSOV(e.sov));
  const maxAvgSOV = avgs.length > 0 ? Math.max(...avgs) : 0;
  return leaderboard.map((entry, i) => ({
    brand:      entry.brand,
    sov:        entry.sov,
    avgSOV:     Math.round(avgs[i] * 10) / 10,
    visibility: visibilityScore(entry.sov, maxAvgSOV),
  }));
}

export async function POST(req: NextRequest) {
  let apiKey: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    apiKey = validateApiKey(body.apiKey);

    if (body.apiKey && !apiKey) {
      return NextResponse.json({ error: "Invalid API key format." }, { status: 400 });
    }

    // ── demo mode ──────────────────────────────────────────────────────────
    if (!apiKey) {
      const country = validateCountry(body.country) ?? "US";
      const brands  = leaderboardToOverview(MOCK_LEADERBOARD.slice(0, 3));
      return NextResponse.json({
        demo: true,
        country,
        domains: ["sony.com", "samsung.com", "lg.com"],
        brands,
      });
    }

    // ── live mode ──────────────────────────────────────────────────────────
    const country = validateCountry(body.country);
    if (!country) {
      return NextResponse.json({ error: "Select a supported country." }, { status: 400 });
    }

    const targetDomain = validateDomain(body.targetDomain);
    const competitor1  = validateDomain(body.competitor1);
    const competitor2  = validateDomain(body.competitor2);
    const domains      = [targetDomain, competitor1, competitor2].filter(Boolean) as string[];

    if (domains.length === 0) {
      return NextResponse.json({ error: "Provide at least a target domain." }, { status: 400 });
    }

    const source = country.toLowerCase();

    const brandNames: string[] = [];
    for (const domain of domains) {
      if (brandNames.length > 0) await new Promise<void>((r) => setTimeout(r, 600));
      brandNames.push(await discoverBrand(apiKey!, domain, source));
    }

    const primary     = { target: domains[0], brand: brandNames[0] };
    const competitors = domains.slice(1).map((d, i) => ({ target: d, brand: brandNames[i + 1] }));

    const leaderboard = await fetchLeaderboard(apiKey, primary, competitors, source);
    const brands      = leaderboardToOverview(leaderboard);

    return NextResponse.json({ demo: false, country, domains, brands });
  } catch (err) {
    const raw     = err instanceof Error ? err.message : "Unknown error";
    const message = apiKey ? redactKey(raw, apiKey) : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const brands = leaderboardToOverview(MOCK_LEADERBOARD.slice(0, 3));
  return NextResponse.json({
    demo: true,
    country: "US",
    domains: ["sony.com", "samsung.com", "lg.com"],
    brands,
  });
}
