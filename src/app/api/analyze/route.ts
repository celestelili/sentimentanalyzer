import { NextRequest, NextResponse } from "next/server";
import {
  fetchLeaderboard,
  fetchPromptsByBrand,
  scoreBrand,
  type BrandScore,
} from "@/lib/seranking";
import { MOCK_LEADERBOARD, MOCK_PROMPTS } from "@/lib/mockData";

// SE Ranking keys: alphanumeric + dashes/underscores, 10–200 chars
const API_KEY_RE = /^[A-Za-z0-9_\-]{10,200}$/;
// Category: letters, digits, spaces, hyphens only
const CATEGORY_RE = /^[A-Za-z0-9 \-]{1,80}$/;

function sanitizeCategory(raw: unknown): string {
  if (typeof raw !== "string") return "televisions";
  const trimmed = raw.trim();
  return CATEGORY_RE.test(trimmed) ? trimmed : "televisions";
}

function validateApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return API_KEY_RE.test(trimmed) ? trimmed : null;
}

// Strip any occurrence of the key from error messages before returning them to the client
function redactKey(message: string, key: string): string {
  if (!key) return message;
  return message.replaceAll(key, "[REDACTED]");
}

export async function POST(req: NextRequest) {
  let apiKey: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    apiKey = validateApiKey(body.apiKey);
    const category = sanitizeCategory(body.category);

    if (body.apiKey && !apiKey) {
      return NextResponse.json(
        { error: "Invalid API key format." },
        { status: 400 }
      );
    }

    let leaderboard;
    let promptsMap: Record<string, { positive: string[]; neutral: string[]; negative: string[] }>;

    if (!apiKey) {
      leaderboard = MOCK_LEADERBOARD;
      promptsMap = MOCK_PROMPTS;
    } else {
      leaderboard = await fetchLeaderboard(apiKey, category);
      const brands = leaderboard.map((e) => e.brand);
      const promptResults = await Promise.all(
        brands.map((b) => fetchPromptsByBrand(apiKey!, b))
      );
      promptsMap = Object.fromEntries(brands.map((b, i) => [b, promptResults[i]]));
    }

    const maxAvgSOV = Math.max(
      ...leaderboard.map((e) => {
        const vals = Object.values(e.sov);
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      })
    );

    const scores: BrandScore[] = leaderboard.map((entry) =>
      scoreBrand(entry, promptsMap[entry.brand] ?? { positive: [], neutral: [], negative: [] }, maxAvgSOV)
    );

    scores.sort((a, b) => b.trustExposureScore - a.trustExposureScore);

    return NextResponse.json({ demo: !apiKey, category, brands: scores });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Unknown error";
    // Never send the API key back to the client in an error message
    const message = apiKey ? redactKey(raw, apiKey) : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const maxAvgSOV = Math.max(
    ...MOCK_LEADERBOARD.map((e) => {
      const vals = Object.values(e.sov);
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    })
  );
  const scores: BrandScore[] = MOCK_LEADERBOARD.map((entry) =>
    scoreBrand(entry, MOCK_PROMPTS[entry.brand] ?? { positive: [], neutral: [], negative: [] }, maxAvgSOV)
  );
  scores.sort((a, b) => b.trustExposureScore - a.trustExposureScore);
  return NextResponse.json({ demo: true, category: "televisions", brands: scores });
}
