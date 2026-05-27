import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, visibilityScore, type EngineSOV, type LeaderboardEntry } from "@/lib/seranking";
import { MOCK_LEADERBOARD } from "@/lib/mockData";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

// Allow up to 60 s on Vercel — the leaderboard POST can be slow when SE
// Ranking's gateway is under load (504s are retried with backoff).
export const maxDuration = 60;

const API_KEY_RE = /^[A-Za-z0-9_\-]{10,200}$/;

function validateApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return API_KEY_RE.test(t) ? t : null;
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

    // demo mode
    if (!apiKey) {
      const country = validateCountry(body.country) ?? "US";
      return NextResponse.json({
        demo: true,
        country,
        brands: leaderboardToOverview(MOCK_LEADERBOARD.slice(0, 3)),
        domains: ["sony.com", "samsung.com", "lg.com"],
      });
    }

    const country = validateCountry(body.country);
    if (!country) {
      return NextResponse.json({ error: "Select a supported country." }, { status: 400 });
    }

    const primary     = body.primary     as { target: string; brand: string };
    const competitors = body.competitors as { target: string; brand: string }[];

    if (!primary?.target || !primary?.brand) {
      return NextResponse.json({ error: "Missing primary domain/brand." }, { status: 400 });
    }

    const source     = country.toLowerCase();
    const leaderboard = await fetchLeaderboard(apiKey, primary, competitors ?? [], source);
    const brands      = leaderboardToOverview(leaderboard);
    const domains     = [primary.target, ...(competitors ?? []).map((c) => c.target)];

    return NextResponse.json({ demo: false, country, brands, domains });
  } catch (err) {
    const raw     = err instanceof Error ? err.message : "Unknown error";
    const message = apiKey ? redactKey(raw, apiKey) : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
