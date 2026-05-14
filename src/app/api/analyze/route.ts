import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, fetchPromptsByBrand, scoreBrand, type BrandScore } from "@/lib/seranking";
import { MOCK_LEADERBOARD, MOCK_PROMPTS } from "@/lib/mockData";
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
  const t = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return DOMAIN_RE.test(t) ? t : null;
}

function validateCountry(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  return SUPPORTED_COUNTRIES.some((c) => c.code === t) ? t : null;
}

function brandFromDomain(domain: string): string {
  const name = domain.replace(/\.(com|net|org|io|co|tv|biz|info|us|uk)(\.[a-z]+)?$/i, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function redactKey(message: string, key: string): string {
  return message.replaceAll(key, "[REDACTED]");
}

function computeScores(leaderboard: typeof MOCK_LEADERBOARD, promptsMap: typeof MOCK_PROMPTS) {
  const maxAvgSOV = Math.max(...leaderboard.map((e) => {
    const vals = Object.values(e.sov);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }));
  return leaderboard.map((entry) =>
    scoreBrand(entry, promptsMap[entry.brand] ?? { positive: [], neutral: [], negative: [] }, maxAvgSOV)
  ) as BrandScore[];
}

export async function POST(req: NextRequest) {
  let apiKey: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    apiKey = validateApiKey(body.apiKey);

    if (body.apiKey && !apiKey) {
      return NextResponse.json({ error: "Invalid API key format." }, { status: 400 });
    }

    const country = validateCountry(body.country);
    if (!country) {
      return NextResponse.json(
        { error: "Select a supported country. AI Overview and AI Mode data is country-specific." },
        { status: 400 }
      );
    }

    const targetDomain = validateDomain(body.targetDomain);
    const competitor1  = validateDomain(body.competitor1);
    const competitor2  = validateDomain(body.competitor2);
    const domains      = [targetDomain, competitor1, competitor2].filter(Boolean) as string[];

    let scores: BrandScore[];

    if (!apiKey) {
      const demo = MOCK_LEADERBOARD.slice(0, 3);
      scores = computeScores(demo, MOCK_PROMPTS);
    } else {
      if (domains.length === 0) {
        return NextResponse.json({ error: "Provide at least a target domain." }, { status: 400 });
      }
      const brands = domains.map(brandFromDomain);
      const leaderboard = await fetchLeaderboard(apiKey, brands.join(","), country);
      const promptResults = await Promise.all(
        brands.map((b) => fetchPromptsByBrand(apiKey!, b, country))
      );
      const promptsMap = Object.fromEntries(brands.map((b, i) => [b, promptResults[i]]));
      scores = computeScores(leaderboard, promptsMap as typeof MOCK_PROMPTS);
    }

    return NextResponse.json({
      demo: !apiKey,
      country,
      domains: domains.length ? domains : ["sony.com", "samsung.com", "lg.com"],
      brands: scores,
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unknown error";
    const message = apiKey ? redactKey(raw, apiKey) : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const demo = MOCK_LEADERBOARD.slice(0, 3);
  const scores = computeScores(demo, MOCK_PROMPTS);
  return NextResponse.json({
    demo: true,
    country: "US",
    domains: ["sony.com", "samsung.com", "lg.com"],
    brands: scores,
  });
}
