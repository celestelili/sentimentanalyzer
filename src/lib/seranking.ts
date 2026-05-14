export interface EngineSOV {
  chatgpt: number;
  perplexity: number;
  gemini: number;
  ai_overview: number;
  ai_mode: number;
}

export interface LeaderboardEntry {
  brand: string;
  sov: EngineSOV;
}

export interface BrandPrompts {
  [brand: string]: {
    positive: string[];
    neutral: string[];
    negative: string[];
  };
}

export interface BrandScore {
  brand: string;
  sov: EngineSOV;
  avgSOV: number;
  visibility: number;
  negativeQueryShare: number;
  reviewRisk: number;
  persuasionStrength: number;
  trustExposureScore: number;
  prompts: {
    positive: string[];
    neutral: string[];
    negative: string[];
  };
}

// ─── classification patterns ──────────────────────────────────────────────────

const NEGATIVE_PATTERNS = [
  /\b(complaint|complaints|problem|problems|issue|issues|broken|fail|failing|failed|error|errors)\b/i,
  /\b(alternative|alternatives|instead of|replace|replacement)\b/i,
  /\b(vs\b|versus|compared to|comparison)\b/i,
  /\b(overheat|overheating|freeze|freezing|crash|crashing|slow|lagging|lag)\b/i,
  /\b(worst|bad|terrible|awful|poor|disappointed|disappointing)\b/i,
  /\b(fix|how to fix|repair|broken screen|dead pixel|backlight bleed)\b/i,
  /\b(lawsuit|settlement|recall|privacy|data collection|scam)\b/i,
  /\b(not working|doesn't work|won't turn on|black screen|no sound)\b/i,
];

const REVIEW_RISK_PATTERNS = [
  /\b(review|reviews|rating|ratings|complaints?|bad experience|customer service)\b/i,
  /\b(reliability|quality control|build quality|durability|longevity)\b/i,
  /\b(fail|failing|broke|broken|defective|defect)\b/i,
  /\b(return|refund|warranty claim|warranty issues|out of warranty)\b/i,
];

const PERSUASION_PATTERNS = [
  /\b(buy|buying|purchase|purchasing|order|ordering)\b/i,
  /\b(best|top|recommend|recommended|worth|worth it|should i get)\b/i,
  /\b(deal|deals|discount|sale|price|cheapest|affordable)\b/i,
  /\b(2024|2025|new|latest|upgrade|black friday|cyber monday)\b/i,
  /\b(for gaming|for movies|for home theater|for bedroom|for living room)\b/i,
];

export function classifyQuery(query: string): "positive" | "neutral" | "negative" {
  if (NEGATIVE_PATTERNS.some((p) => p.test(query))) return "negative";
  if (PERSUASION_PATTERNS.some((p) => p.test(query))) return "positive";
  return "neutral";
}

// ─── scoring ──────────────────────────────────────────────────────────────────

function avgSOV(sov: EngineSOV): number {
  const vals = Object.values(sov);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreBrand(
  entry: LeaderboardEntry,
  prompts: { positive: string[]; neutral: string[]; negative: string[] },
  maxAvgSOV: number
): BrandScore {
  const avg = avgSOV(entry.sov);
  const allQueries = [...prompts.positive, ...prompts.neutral, ...prompts.negative];
  const total = allQueries.length;

  const visibility        = clamp((avg / Math.max(maxAvgSOV, 1)) * 100);
  const negativeQueryShare = clamp(100 - (prompts.negative.length / Math.max(total, 1)) * 100);
  const reviewRiskCount   = allQueries.filter((q) => REVIEW_RISK_PATTERNS.some((p) => p.test(q))).length;
  const reviewRisk        = clamp(100 - (reviewRiskCount / Math.max(total, 1)) * 100);
  const persuasionCount   = allQueries.filter((q) => PERSUASION_PATTERNS.some((p) => p.test(q))).length;
  const persuasionStrength = clamp((persuasionCount / Math.max(total, 1)) * 100);
  const trustExposureScore = clamp((visibility + negativeQueryShare + reviewRisk + persuasionStrength) / 4);

  return {
    brand: entry.brand,
    sov: entry.sov,
    avgSOV: Math.round(avg * 10) / 10,
    visibility,
    negativeQueryShare,
    reviewRisk,
    persuasionStrength,
    trustExposureScore,
    prompts,
  };
}

// ─── SE Ranking REST client ───────────────────────────────────────────────────

const BASE_URL = "https://api.seranking.com/v1";

const ALL_ENGINES = ["chatgpt", "perplexity", "gemini", "ai-overview", "ai-mode"] as const;
type Engine = typeof ALL_ENGINES[number];

function authHeaders(apiKey: string) {
  return { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" };
}

async function handleError(res: Response): Promise<never> {
  const FRIENDLY: Record<number, string> = {
    401: "Invalid API key — check your SE Ranking credentials and make sure the key has API access enabled.",
    403: "Access denied — your SE Ranking plan may not include this API endpoint.",
    429: "SE Ranking rate limit reached — wait a moment and try again.",
  };
  if (FRIENDLY[res.status]) throw new Error(FRIENDLY[res.status]);

  const body = await res.text().catch(() => "");
  let detail = body;
  try {
    const json = JSON.parse(body);
    detail = json.message ?? json.error ?? JSON.stringify(json);
  } catch {
    detail = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  }
  throw new Error(`SE Ranking error ${res.status}${detail ? `: ${detail}` : "."}`);
}

// Resolve a domain to the brand name SE Ranking associates with it
export async function discoverBrand(
  apiKey: string,
  domain: string,
  source: string        // lowercase alpha-2, e.g. "us"
): Promise<string> {
  const url = new URL(`${BASE_URL}/ai-search/brand/discover`);
  url.searchParams.set("target", domain);
  url.searchParams.set("source", source.toLowerCase());
  url.searchParams.set("scope", "base_domain");

  const res = await fetch(url.toString(), {
    headers: authHeaders(apiKey),
    cache: "no-store",
  });
  if (!res.ok) await handleError(res);

  const data = await res.json() as { brand?: string; name?: string };
  // Fall back to capitalising the domain name if the API doesn't return one
  return data.brand ?? data.name ?? domain.split(".")[0].replace(/^./, (c) => c.toUpperCase());
}

// POST leaderboard — returns SOV per engine for each brand
export async function fetchLeaderboard(
  apiKey: string,
  primary: { target: string; brand: string },
  competitors: { target: string; brand: string }[],
  source: string
): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${BASE_URL}/ai-search/overview/leaderboard`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      primary,
      competitors,
      source: source.toLowerCase(),
      engines: ALL_ENGINES,
      scope: "base_domain",
    }),
    cache: "no-store",
  });
  if (!res.ok) await handleError(res);

  const data = await res.json() as {
    brands?: Array<{
      brand: string;
      engines: Record<Engine, { share_of_voice?: number; sov?: number }>;
    }>;
    // alternate shape
    items?: Array<{
      brand: string;
      shares?: Record<string, number>;
      engines?: Record<Engine, { share_of_voice?: number; sov?: number }>;
    }>;
  };

  const rows = data.brands ?? data.items ?? [];
  return rows.map((row) => {
    const sov = (engine: Engine): number => {
      if (row.engines) {
        const e = row.engines[engine];
        return e ? (e.share_of_voice ?? e.sov ?? 0) : 0;
      }
      if ("shares" in row && row.shares) return row.shares[engine] ?? 0;
      return 0;
    };
    return {
      brand: row.brand,
      sov: {
        chatgpt:     sov("chatgpt"),
        perplexity:  sov("perplexity"),
        gemini:      sov("gemini"),
        ai_overview: sov("ai-overview"),
        ai_mode:     sov("ai-mode"),
      },
    };
  });
}

// GET prompts by brand — fetches across all engines and classifies them
export async function fetchPromptsByBrand(
  apiKey: string,
  brand: string,
  source: string
): Promise<{ positive: string[]; neutral: string[]; negative: string[] }> {
  const classified = { positive: [] as string[], neutral: [] as string[], negative: [] as string[] };
  const seen = new Set<string>();

  await Promise.all(
    ALL_ENGINES.map(async (engine) => {
      const url = new URL(`${BASE_URL}/ai-search/prompts/by-brand`);
      url.searchParams.set("brand", brand);
      url.searchParams.set("source", source.toLowerCase());
      url.searchParams.set("engine", engine);
      url.searchParams.set("limit", "50");

      const res = await fetch(url.toString(), {
        headers: authHeaders(apiKey),
        cache: "no-store",
      });
      if (!res.ok) return; // skip individual engine errors rather than failing everything

      const data = await res.json() as {
        prompts?: Array<string | { prompt?: string; text?: string; query?: string }>;
        data?: Array<string | { prompt?: string; text?: string; query?: string }>;
      };

      const items = data.prompts ?? data.data ?? [];
      for (const item of items) {
        const q = typeof item === "string" ? item : (item.prompt ?? item.text ?? item.query ?? "");
        if (!q || seen.has(q)) continue;
        seen.add(q);
        classified[classifyQuery(q)].push(q);
      }
    })
  );

  return classified;
}
