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

// Returns true for transient errors worth retrying automatically:
// rate limits (429), rate-limit disguised as 500, and gateway timeouts (502/503/504).
function isRetryable(status: number, text: string): boolean {
  if (status === 429) return true;
  if (status === 502 || status === 503 || status === 504) return true;
  if (status === 500 && text.toLowerCase().includes("too many")) return true;
  return false;
}

async function handleError(res: Response): Promise<never> {
  const FRIENDLY: Record<number, string> = {
    401: "Invalid API key — check your SE Ranking credentials and ensure API access is enabled on your plan.",
    403: "Access denied — your SE Ranking plan may not include this API endpoint.",
    429: "SE Ranking rate limit reached — wait a moment and try again.",
    502: "SE Ranking is temporarily unavailable (502 Bad Gateway). Please try again in a moment.",
    503: "SE Ranking is temporarily unavailable (503 Service Unavailable). Please try again in a moment.",
    504: "SE Ranking request timed out (504 Gateway Timeout). Please try again — this is usually transient.",
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

// Wraps fetch with up to `retries` automatic retries on transient errors
// (rate limits and gateway timeouts). Waits 3 s → 6 s → 12 s between attempts.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3
): Promise<Response> {
  let delay = 3000;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);

    // Success or a definitive client error (4xx except 429) — return immediately.
    if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) return res;

    // Peek at body to decide whether this error is worth retrying.
    const text = await res.text().catch(() => "");
    if (!isRetryable(res.status, text)) {
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

// GET /ai-search/overview
// Response: { summary: { brand_presence: { current: number | null }, ... } }
//
// Returns brand_presence for one domain+engine combination.
// Used to build per-engine SOV by fetching each domain/engine pair separately.
async function fetchEnginePresence(
  apiKey: string,
  domain: string,
  source: string,
  engine: Engine
): Promise<number> {
  const url = new URL(`${BASE_URL}/ai-search/overview`);
  url.searchParams.set("target", domain);
  url.searchParams.set("source", source.toLowerCase());
  url.searchParams.set("engine", engine);
  url.searchParams.set("scope", "base_domain");

  const res = await fetchWithRetry(url.toString(), { headers: authHeaders(apiKey), cache: "no-store" });
  if (!res.ok) return 0;

  const data = await res.json() as {
    summary?: { brand_presence?: { current?: number | null } };
  };
  return data.summary?.brand_presence?.current ?? 0;
}

// POST /ai-search/overview/leaderboard
// Used for brand name discovery and display order.
// Per-engine SOV is then built from individual overview calls (one per domain×engine)
// because the leaderboard's `results` field structure is unreliable across API versions.
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
    leaderboard?: Array<{ domain: string; share_of_voice?: number; rank?: number }>;
    [key: string]: unknown;
  };

  // Log structure for diagnosing future API changes (values omitted, keys only)
  try {
    const topKeys = Object.keys(data);
    const lbSample = data.leaderboard?.[0] ? Object.keys(data.leaderboard[0]) : [];
    console.error("[leaderboard] top-level keys:", topKeys, "leaderboard[0] keys:", lbSample);
  } catch { /* never block on logging */ }

  // Build domain → brand map
  const allDomains = [primary, ...competitors];
  const domainToBrand: Record<string, string> = Object.fromEntries(
    allDomains.map((d) => [d.target, d.brand])
  );

  // Use leaderboard rank order when available; fall back to input order
  const ranked: string[] = (() => {
    const lb = data.leaderboard ?? [];
    if (lb.length > 0) {
      return [...lb]
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((e) => e.domain)
        .filter((d) => domainToBrand[d]);
    }
    return allDomains.map((d) => d.target);
  })();

  // ── Per-engine brand_presence via overview endpoint ──────────────────────────
  // Fetch all 5 engines for each domain sequentially (domain by domain, engines
  // in parallel per domain) to stay within SE Ranking's rate limits.
  const presenceMap: Record<string, Partial<Record<Engine, number>>> = {};

  for (let di = 0; di < ranked.length; di++) {
    const domain = ranked[di];
    if (di > 0) await sleepMs(300);

    // All 5 engines in parallel for this domain
    const results = await Promise.all(
      ENGINES.map((engine) => fetchEnginePresence(apiKey, domain, source, engine))
    );
    presenceMap[domain] = Object.fromEntries(
      ENGINES.map((engine, i) => [engine, results[i]])
    ) as Partial<Record<Engine, number>>;
  }

  // Per-engine totals (denominator for relative SOV)
  const engineTotals: Partial<Record<Engine, number>> = {};
  for (const engine of ENGINES) {
    engineTotals[engine] = ranked.reduce(
      (sum, domain) => sum + (presenceMap[domain]?.[engine] ?? 0),
      0
    );
  }

  return ranked.map((domain) => {
    const sov: EngineSOV = { chatgpt: 0, perplexity: 0, gemini: 0, ai_overview: 0, ai_mode: 0 };
    for (const engine of ENGINES) {
      const presence = presenceMap[domain]?.[engine] ?? 0;
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
async function fetchOneEngine(
  apiKey: string,
  brand: string,
  source: string,
  engine: Engine,
  limit: number
): Promise<Array<{ prompt: string; volume: number; type: string; answer: string }>> {
  const url = new URL(`${BASE_URL}/ai-search/prompts-by-brand`);
  url.searchParams.set("brand", brand);
  url.searchParams.set("source", source.toLowerCase());
  url.searchParams.set("engine", engine);
  url.searchParams.set("limit", String(limit));
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

// Fetches prompts for all engines sequentially (one request at a time) to
// avoid hitting SE Ranking's rate limit. Each engine call is separated by
// `delayMs` milliseconds.
export async function fetchPromptsByBrand(
  apiKey: string,
  brand: string,
  source: string,
  delayMs = 300,
  limitPerEngine = 50,
  topicFilter = ""
): Promise<{ positive: PromptEntry[]; neutral: PromptEntry[]; negative: PromptEntry[] }> {
  const classified = {
    positive: [] as PromptEntry[],
    neutral:  [] as PromptEntry[],
    negative: [] as PromptEntry[],
  };
  const seen  = new Set<string>();
  const topic = topicFilter.trim().toLowerCase();

  for (let i = 0; i < ENGINES.length; i++) {
    if (i > 0) await sleepMs(delayMs);
    const items = await fetchOneEngine(apiKey, brand, source, ENGINES[i], limitPerEngine);
    for (const item of items) {
      const q = item.prompt?.trim();
      if (!q || seen.has(q)) continue;
      // Apply topic filter before storing — skip prompts that don't match
      if (topic && !q.toLowerCase().includes(topic)) continue;
      seen.add(q);
      const sentiment = classifyResponse(item.answer, brand);
      classified[sentiment].push({ prompt: q, answer: item.answer });
    }
  }

  return classified;
}
