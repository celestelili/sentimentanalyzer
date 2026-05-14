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

  const visibility         = clamp((avg / Math.max(maxAvgSOV, 1)) * 100);
  const negativeQueryShare = clamp(100 - (prompts.negative.length / Math.max(total, 1)) * 100);
  const reviewRiskCount    = allQueries.filter((q) => REVIEW_RISK_PATTERNS.some((p) => p.test(q))).length;
  const reviewRisk         = clamp(100 - (reviewRiskCount / Math.max(total, 1)) * 100);
  const persuasionCount    = allQueries.filter((q) => PERSUASION_PATTERNS.some((p) => p.test(q))).length;
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

const ENGINES = ["chatgpt", "perplexity", "gemini", "ai-overview", "ai-mode"] as const;
type Engine = typeof ENGINES[number];

// Map from API engine key (with hyphen) to our EngineSOV key (with underscore)
const ENGINE_KEY_MAP: Record<Engine, keyof EngineSOV> = {
  "chatgpt":    "chatgpt",
  "perplexity": "perplexity",
  "gemini":     "gemini",
  "ai-overview":"ai_overview",
  "ai-mode":    "ai_mode",
};

function authHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" };
}

async function handleError(res: Response): Promise<never> {
  const FRIENDLY: Record<number, string> = {
    401: "Invalid API key — check your SE Ranking credentials and ensure API access is enabled on your plan.",
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

// GET /ai-search/brand/discover
// Response: { brands: string[] }
export async function discoverBrand(
  apiKey: string,
  domain: string,
  source: string
): Promise<string> {
  const url = new URL(`${BASE_URL}/ai-search/discover-brand`);
  url.searchParams.set("target", domain);
  url.searchParams.set("source", source.toLowerCase());
  url.searchParams.set("scope", "base_domain");

  const res = await fetch(url.toString(), { headers: authHeaders(apiKey), cache: "no-store" });
  if (!res.ok) await handleError(res);

  const data = await res.json() as { brands?: string[] };
  // Fall back to capitalising the hostname if the API returns nothing
  return data.brands?.[0] ?? domain.split(".")[0].replace(/^(.)/, (c) => c.toUpperCase());
}

// POST /ai-search/overview/leaderboard
// Response: {
//   results: { [domain]: { [engine]: { brand_presence: number, link_presence: number } } },
//   leaderboard: [{ domain, share_of_voice (0–1), rank, brand_presence, link_presence }]
// }
//
// Per-engine SOV is calculated from brand_presence:
//   engine_total = sum of brand_presence across all domains for that engine
//   domain_sov   = (domain_brand_presence / engine_total) * 100
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
      engines: [...ENGINES],
      scope: "base_domain",
    }),
    cache: "no-store",
  });
  if (!res.ok) await handleError(res);

  const data = await res.json() as {
    results: Record<string, Record<string, { brand_presence: number; link_presence: number }>>;
    leaderboard: Array<{ domain: string; share_of_voice: number; rank: number }>;
  };

  // Build domain → brand map from what we passed in
  const domainToBrand: Record<string, string> = {
    [primary.target]: primary.brand,
    ...Object.fromEntries(competitors.map((c) => [c.target, c.brand])),
  };

  // For each engine, compute total brand_presence across all domains
  const engineTotals: Partial<Record<Engine, number>> = {};
  for (const engine of ENGINES) {
    engineTotals[engine] = Object.values(data.results).reduce(
      (sum, domainData) => sum + (domainData[engine]?.brand_presence ?? 0),
      0
    );
  }

  // Sort by leaderboard rank
  const ranked = [...data.leaderboard].sort((a, b) => a.rank - b.rank);

  return ranked.map(({ domain }) => {
    const domainData = data.results[domain] ?? {};
    const sov: EngineSOV = { chatgpt: 0, perplexity: 0, gemini: 0, ai_overview: 0, ai_mode: 0 };

    for (const engine of ENGINES) {
      const presence = domainData[engine]?.brand_presence ?? 0;
      const total    = engineTotals[engine] ?? 0;
      sov[ENGINE_KEY_MAP[engine]] = total > 0 ? Math.round((presence / total) * 100) : 0;
    }

    return { brand: domainToBrand[domain] ?? domain, sov };
  });
}

// GET /ai-search/prompts/by-brand
// Response: { total: number, date: string, prompts: [{ prompt, volume, type, answer: { text, links } }] }
//
// Fetches for all 5 engines in parallel, deduplicates by prompt text, then classifies.
export async function fetchPromptsByBrand(
  apiKey: string,
  brand: string,
  source: string
): Promise<{ positive: string[]; neutral: string[]; negative: string[] }> {
  const classified = { positive: [] as string[], neutral: [] as string[], negative: [] as string[] };
  const seen = new Set<string>();

  await Promise.all(
    ENGINES.map(async (engine) => {
      const url = new URL(`${BASE_URL}/ai-search/prompts-by-brand`);
      url.searchParams.set("brand", brand);
      url.searchParams.set("source", source.toLowerCase());
      url.searchParams.set("engine", engine);
      url.searchParams.set("limit", "50");
      url.searchParams.set("sort", "volume");
      url.searchParams.set("sort_order", "desc");

      const res = await fetch(url.toString(), { headers: authHeaders(apiKey), cache: "no-store" });
      if (!res.ok) return; // skip failing engines rather than aborting everything

      const data = await res.json() as {
        prompts?: Array<{ prompt: string; volume: number; type: string }>;
      };

      for (const item of data.prompts ?? []) {
        const q = item.prompt?.trim();
        if (!q || seen.has(q)) continue;
        seen.add(q);
        classified[classifyQuery(q)].push(q);
      }
    })
  );

  return classified;
}
