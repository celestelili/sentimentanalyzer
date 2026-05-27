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
// (rate limits and gateway timeouts). Waits `firstDelay` ms between attempts,
// doubling each time. An optional `timeoutMs` aborts each individual attempt
// after that many milliseconds so callers can bound total wall-clock time.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
  firstDelay = 3000,
  timeoutMs?: number
): Promise<Response> {
  let delay = firstDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Wire up a per-attempt AbortController when a timeout is requested.
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
      controller = new AbortController();
      timer = setTimeout(() => controller!.abort(), timeoutMs);
    }

    let res: Response;
    try {
      res = await fetch(url, controller ? { ...init, signal: controller.signal } : init);
    } catch (err) {
      if (timer) clearTimeout(timer);
      // AbortError means the per-attempt timeout fired — treat like a 504.
      if (err instanceof Error && err.name === "AbortError") {
        if (attempt === retries) {
          throw new Error(
            "SE Ranking request timed out. The leaderboard endpoint is slow right now — please try again in a moment."
          );
        }
        await sleepMs(delay);
        delay *= 2;
        continue;
      }
      throw err;
    }
    if (timer) clearTimeout(timer);

    // Success or a definitive client error (4xx except 429) — return immediately.
    if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) return res;

    // Peek at body to decide whether this error is worth retrying.
    const text = await res.text().catch(() => "");
    if (!isRetryable(res.status, text)) {
      return new Response(text, { status: res.status });
    }

    if (attempt === retries) {
      return new Response(text, { status: res.status });
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
// Verified response shape:
// {
//   results: { [domain]: { [engine]: { brand_presence, link_presence } } },
//   leaderboard: [{ rank, domain, brand_presence, link_presence, share_of_voice, is_primary_target }]
// }
//
// Calls the endpoint once per engine sequentially (with `delayMs` between
// calls) instead of asking for all 5 at once. Each call has a hard 8 s cap
// and never retries — if an engine 504s, we just skip it and continue.
// Total worst-case wall-clock: 5 × 8 s + 4 × 0.6 s ≈ 42 s (within Vercel's 60 s).
//
// Never throws — failures are reported via the returned `failed` array.
async function fetchLeaderboardForEngine(
  apiKey: string,
  primary: { target: string; brand: string },
  competitors: { target: string; brand: string }[],
  source: string,
  engine: Engine
): Promise<{
  ok: boolean;
  results: Record<string, Record<string, { brand_presence?: number | null; link_presence?: number | null }>>;
  leaderboard: Array<{ domain: string; share_of_voice?: number; rank?: number; brand_presence?: number }>;
}> {
  try {
    const res = await fetchWithRetry(
      `${BASE_URL}/ai-search/overview/leaderboard`,
      {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify({
          primary,
          competitors,
          source: source.toLowerCase(),
          engines: [engine],
          scope: "base_domain",
        }),
        cache: "no-store",
      },
      /* retries    */ 0,
      /* firstDelay */ 0,
      /* timeoutMs  */ 12000
    );
    if (!res.ok) return { ok: false, results: {}, leaderboard: [] };
    const data = await res.json() as {
      results?: Record<string, Record<string, { brand_presence?: number | null; link_presence?: number | null }>>;
      leaderboard?: Array<{ domain: string; share_of_voice?: number; rank?: number; brand_presence?: number }>;
    };
    return { ok: true, results: data.results ?? {}, leaderboard: data.leaderboard ?? [] };
  } catch {
    return { ok: false, results: {}, leaderboard: [] };
  }
}

// Per-engine SOV = (domain_brand_presence / sum_of_brand_presence_for_engine) * 100
export async function fetchLeaderboard(
  apiKey: string,
  primary: { target: string; brand: string },
  competitors: { target: string; brand: string }[],
  source: string,
): Promise<LeaderboardEntry[]> {
  // Fire all 5 engine calls in parallel. Each has a 12 s hard timeout and
  // never retries. Total wall-clock time = max of the 5 calls (~6–12 s),
  // not their sum — this is the fix for Vercel's 60 s function limit.
  const settled = await Promise.allSettled(
    ENGINES.map(engine => fetchLeaderboardForEngine(apiKey, primary, competitors, source, engine))
  );

  const results: Record<string, Record<string, { brand_presence?: number | null; link_presence?: number | null }>> = {};
  let rankSource: Array<{ domain: string; rank?: number }> = [];
  let succeeded = 0;

  for (const result of settled) {
    if (result.status !== "fulfilled" || !result.value.ok) continue;
    succeeded++;
    const { results: r, leaderboard: lb } = result.value;
    for (const [domain, perEngine] of Object.entries(r)) {
      results[domain] ??= {};
      for (const [eng, vals] of Object.entries(perEngine)) {
        results[domain][eng] = vals;
      }
    }
    if (rankSource.length === 0 && lb.length > 0) rankSource = lb;
  }

  if (succeeded === 0) {
    throw new Error(
      "SE Ranking's leaderboard API timed out on all 5 engines. " +
      "This is usually transient — please wait a moment and try again."
    );
  }

  // Build domain → brand map from what we passed in
  const allDomains = [primary, ...competitors];
  const domainToBrand: Record<string, string> = Object.fromEntries(
    allDomains.map((d) => [d.target, d.brand])
  );

  // Rank by leaderboard order when available; fall back to input order
  const ranked: string[] = rankSource.length > 0
    ? [...rankSource]
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((e) => e.domain)
        .filter((d) => domainToBrand[d])
    : allDomains.map((d) => d.target);

  // Per-engine totals across all queried domains (denominator for relative SOV)
  const engineTotals: Partial<Record<Engine, number>> = {};
  for (const engine of ENGINES) {
    engineTotals[engine] = Object.values(results).reduce(
      (sum, domainData) => sum + (domainData[engine]?.brand_presence ?? 0),
      0
    );
  }

  return ranked.map((domain) => {
    const domainData = results[domain] ?? {};
    const sov: EngineSOV = { chatgpt: 0, perplexity: 0, gemini: 0, ai_overview: 0, ai_mode: 0 };

    for (const engine of ENGINES) {
      const presence = domainData[engine]?.brand_presence ?? 0;
      const total    = engineTotals[engine] ?? 0;
      // When total is 0, no brand in the set has citations for this engine —
      // leave SOV as 0 so the UI can distinguish "no data" from a genuine zero.
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
