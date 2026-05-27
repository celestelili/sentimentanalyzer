import { NextRequest, NextResponse } from "next/server";
import { fetchPromptsByBrand, scorePrompts, type PromptEntry } from "@/lib/seranking";
import { MOCK_PROMPTS } from "@/lib/mockData";

// Allow up to 60 s on Vercel — fetching prompts across 5 engines per brand
// can take 20–40 s depending on SE Ranking response times.
export const maxDuration = 60;

const API_KEY_RE = /^[A-Za-z0-9_\-]{10,200}$/;

function validateApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return API_KEY_RE.test(t) ? t : null;
}

function redactKey(message: string, key: string): string {
  return message.replaceAll(key, "[REDACTED]");
}

export async function POST(req: NextRequest) {
  let apiKey: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    apiKey = validateApiKey(body.apiKey);

    const brands: string[] = Array.isArray(body.brands)
      ? (body.brands as unknown[]).filter((b): b is string => typeof b === "string").slice(0, 5)
      : [];

    if (brands.length === 0) {
      return NextResponse.json({ error: "No brands provided." }, { status: 400 });
    }

    // ── demo mode ──────────────────────────────────────────────────────────
    if (!apiKey) {
      const result = brands.map((brand) => {
        const empty = { positive: [] as PromptEntry[], neutral: [] as PromptEntry[], negative: [] as PromptEntry[] };
        const prompts = MOCK_PROMPTS[brand] ?? empty;
        return { brand, ...scorePrompts(prompts), prompts };
      });
      return NextResponse.json({ demo: true, brands: result });
    }

    // ── live mode — sequential across brands, parallel engines within each ─
    const source = (typeof body.country === "string" ? body.country : "us").toLowerCase();
    const result = [];

    for (const brand of brands) {
      const prompts = await fetchPromptsByBrand(apiKey, brand, source);
      result.push({ brand, ...scorePrompts(prompts), prompts });
    }

    return NextResponse.json({ demo: false, brands: result });
  } catch (err) {
    const raw     = err instanceof Error ? err.message : "Unknown error";
    const message = apiKey ? redactKey(raw, apiKey) : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
