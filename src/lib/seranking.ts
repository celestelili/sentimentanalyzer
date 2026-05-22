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

export interface PromptEntry {
  prompt: string;
  answer: string;
}

export interface BrandPrompts {
  [brand: string]: {
    positive: PromptEntry[];
    neutral: PromptEntry[];
    negative: PromptEntry[];
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
    positive: PromptEntry[];
    neutral: PromptEntry[];
    negative: PromptEntry[];
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

// ─── response-based classification ───────────────────────────────────────────

const RESPONSE_POSITIVE_PATTERNS = [
  /\b(is|are)\s+(highly|widely|generally|strongly)\s+(recommended|regarded|recognized|respected)\b/i,
  /\b(is|are)\s+(recognized|acclaimed|celebrated|renowned)\s+(as|for)\b/i,
  /\b(market leader|industry leader|industry standard|sets the standard)\b/i,
  /\bis known for (its|their)?\s*(quality|innovation|performance|excellence|reliability|durability)\b/i,
  /\baward[- ]winning\b/i,
  /\btrusted\s+(brand|name|choice|source)\b/i,
  /\bis\s+(widely|generally)?\s*considered\s+(one of\s+)?(a|the\s+)?best\b/i,
  /\bis\s+(a|the)\s+(top|leading|premier)\s+(choice|brand|option|pick)\b/i,
];

const RESPONSE_NEGATIVE_PATTERNS = [
  /\bhas\s+(faced|received|come under|attracted)\s+(criticism|backlash|scrutiny|fire|complaints)\b/i,
  /\bhas been criticized\b/i,
  /\b(controversy|controversial|scandal)\b/i,
  /\b(lawsuit|lawsuits|legal action|legal dispute|settlement|litigation)\b/i,
  /\b(product\s+)?recall\b/i,
  /\baccused of\b/i,
  /\ballegations?\b/i,
  /\bwidespread\s+(complaint|complaints|criticism|issues|problems|negative)\b/i,
  /\b(negative reviews|negative feedback|negative press|negative publicity)\b/i,
  /\bcustomers?\s+(complaint|complaints|report issues|have complained)\b/i,
];

// When `brand` is supplied, the response is only positive or negative when the
// brand is actually named — a generic answer that never mentions the brand is
// always neutral regardless of its language.
export function classifyResponse(text: string, brand = ""): "positive" | "neutral" | "negative" {
  if (!text) return "neutral";
  if (brand && !text.toLowerCase().includes(brand.toLowerCase())) return "neutral";
  if (RESPONSE_NEGATIVE_PATTERNS.some((p) => p.test(text))) return "negative";
  if (RESPONSE_POSITIVE_PATTERNS.some((p) => p.test(text))) return "positive";
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

// Compute the three prompt-dependent trust signals.
// negativeQueryShare uses response-based bucket counts.
// reviewRisk and persuasionStrength still run against prompt text (intent signals).
export function scorePrompts(
  prompts: { positive: PromptEntry[]; neutral: PromptEntry[]; negative: PromptEntry[] }
): { negativeQueryShare: number; reviewRisk: number; persuasionStrength: number } {
  const all     = [...prompts.positive, ...prompts.neutral, ...prompts.negative];
  const total   = all.length;
  const queries = all.map((e) => e.prompt);
  return {
    negativeQueryShare: clamp(100 - (prompts.negative.length / Math.max(total, 1)) * 100),
    reviewRisk:         clamp(100 - queries.filter((q) => REVIEW_RISK_PATTERNS.some((p) => p.test(q))).length / Math.max(total, 1) * 100),
    persuasionStrength: clamp(queries.filter((q) => PERSUASION_PATTERNS.some((p) => p.test(q))).length / Math.max(total, 1) * 100),
  };
}

export function visibilityScore(sov: EngineSOV, maxAvgSOV: number): number {
  return clamp((avgSOV(sov) / Math.max(maxAvgSOV, 1)) * 100);
}

export function scoreBrand(
  entry: LeaderboardEntry,
  prompts: { positive: PromptEntry[]; neutral: PromptEntry[]; negative: PromptEntry[] },
  maxAvgSOV: number
): BrandScore {
  const avg        = avgSOV(entry.sov);
  const visibility = clamp((avg / Math.max(maxAvgSOV, 1)) * 100);
  const { negativeQueryShare, reviewRisk, persuasionStrength } = scorePrompts(prompts);
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

function sleepMs(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRateLimit(status: number, text: string): boolean {
  return status === 429 || (status === 500 && text.toLowerCase().includes("too many"));
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
    detail = json.message ?? json.error ?? json.error_description ?? JSON.stringify(json);
  } catch {
    detail = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  }
  if (detail.toLowerCase().includes("too many")) {
    throw new Error("Too many requests — SE Ranking rate limit hit. Wait a moment and try again.");
  }
  throw new Error(`SE Ranking error ${res.status}${detail ? `: ${detail}` : "."}`);
}

// Wraps fetch with up to `retries` automatic retries on rate-limit responses.
// Waits 3 s, then 6 s, then 12 s before each successive retry.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3
): Promise<Response> {
  let delay = 3000;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 && !(res.status === 500)) return res;

    // Peek at body to see if it's really a rate-limit 500
    const text = await res.text().catch(() => "");
    if (!isRateLimit(res.status, text)) {
      // Re-wrap the consumed body so callers can still read it
      return new Response(text, { status: res.status, headers: res.headers });
    }

    if (attempt === retries) {
      return new Response(text, { status: res.status, headers: res.headers });
    }

    await sleepMs(delay);
    delay *= 2;
  }
  // unreachable
  return fetch(url, init);
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

  const res = await fetchWithRetry(url.toString(), { headers: authHeaders(apiKey), cache: "no-store" });
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
  const res = await fetchWithRetry(`${BASE_URL}/ai-search/overview/leaderboard`, {
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

  // For each engine, sum brand_presence across all queried domains.
  // This is the denominator for per-engine relative SOV among the queried brands.
  // When total = 0 for an engine, no queried brand has any citations there —
  // sov stays 0 and the UI shows "—" rather than "0%".
  const engineTotals: Partial<Record<Engine, number>> = {};
  for (const engine of ENGINES) {
    engineTotals[engine] = Object.values(data.results ?? {}).reduce(
      (sum, domainData) => sum + (domainData[engine]?.brand_presence ?? 0),
      0
    );
  }

  // Sort by leaderboard rank
  const ranked = [...(data.leaderboard ?? [])].sort((a, b) => a.rank - b.rank);

  return ranked.map(({ domain }) => {
    const domainData = (data.results ?? {})[domain] ?? {};
    const sov: EngineSOV = { chatgpt: 0, perplexity: 0, gemini: 0, ai_overview: 0, ai_mode: 0 };

    for (const engine of ENGINES) {
      const presence = domainData[engine]?.brand_presence ?? 0;
      const total    = engineTotals[engine] ?? 0;
      // SOV is relative share among queried brands. When total is 0, no brand in
      // the comparison set has any citations for this engine — leave as 0 so the
      // UI can distinguish "no data" from a genuine zero.
      sov[ENGINE_KEY_MAP[engine]] = total > 0 ? Math.round((presence / total) * 100) : 0;
    }

    return { brand: domainToBrand[domain] ?? domain, sov };
  });
}

// GET /ai-search/prompts/by-brand
// Response: { total: number, date: string, prompts: [{ prompt, volume, type, answer: { text, links } }] }
//
// Fetches for all 5 engines in parallel, deduplicates by prompt text, then classifies.
async function fetchOneEngine(
  apiKey: string,
  brand: string,
  source: string,
  engine: Engine
): Promise<Array<{ prompt: string; volume: number; type: string; answer: string }>> {
  const url = new URL(`${BASE_URL}/ai-search/prompts-by-brand`);
  url.searchParams.set("brand", brand);
  url.searchParams.set("source", source.toLowerCase());
  url.searchParams.set("engine", engine);
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort", "volume");
  url.searchParams.set("sort_order", "desc");

  const res = await fetchWithRetry(url.toString(), { headers: authHeaders(apiKey), cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json() as {
    prompts?: Array<{
      prompt: string;
      volume: number;
      type: string;
      answer?: { text?: string; links?: string[] };
    }>;
  };
  return (data.prompts ?? []).map((p) => ({
    prompt: p.prompt,
    volume: p.volume,
    type:   p.type,
    answer: p.answer?.text ?? "",
  }));
}

// Extract a ~200-char window from `text` centered on the first occurrence of
// `brand`. Falls back to the opening slice when the brand isn't found.
function extractBrandSnippet(text: string, brand: string, windowSize = 220): string {
  if (!text) return "";
  const idx = text.toLowerCase().indexOf(brand.toLowerCase());
  const start = idx === -1 ? 0 : Math.max(0, idx - 80);
  const end   = Math.min(text.length, start + windowSize);
  const snippet = text.slice(start, end);
  return (start > 0 ? "…" : "") + snippet + (end < text.length ? "…" : "");
}

// Fetches prompts for all engines sequentially (one request at a time) to
// avoid hitting SE Ranking's rate limit. Each engine call is separated by
// `delayMs` milliseconds.
export async function fetchPromptsByBrand(
  apiKey: string,
  brand: string,
  source: string,
  delayMs = 600
): Promise<{ positive: PromptEntry[]; neutral: PromptEntry[]; negative: PromptEntry[] }> {
  const classified = {
    positive: [] as PromptEntry[],
    neutral:  [] as PromptEntry[],
    negative: [] as PromptEntry[],
  };
  const seen = new Set<string>();

  for (let i = 0; i < ENGINES.length; i++) {
    if (i > 0) await sleepMs(delayMs);
    const items = await fetchOneEngine(apiKey, brand, source, ENGINES[i]);
    for (const item of items) {
      const q = item.prompt?.trim();
      if (!q || seen.has(q)) continue;
      seen.add(q);
      const sentiment = classifyResponse(item.answer, brand);
      classified[sentiment].push({ prompt: q, answer: extractBrandSnippet(item.answer, brand) });
    }
  }

  return classified;
}
