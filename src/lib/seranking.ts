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
  /\b(2024|new|latest|upgrade|black friday|cyber monday)\b/i,
  /\b(for gaming|for movies|for home theater|for bedroom|for living room)\b/i,
];

export function classifyQuery(query: string): "positive" | "neutral" | "negative" {
  const isNegative = NEGATIVE_PATTERNS.some((p) => p.test(query));
  if (isNegative) return "negative";

  const isPositive = PERSUASION_PATTERNS.some((p) => p.test(query));
  if (isPositive) return "positive";

  return "neutral";
}

function avgSOV(sov: EngineSOV): number {
  const vals = Object.values(sov);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreBrand(
  entry: LeaderboardEntry,
  allPrompts: { positive: string[]; neutral: string[]; negative: string[] },
  maxAvgSOV: number
): BrandScore {
  const avg = avgSOV(entry.sov);

  const visibility = clamp((avg / Math.max(maxAvgSOV, 1)) * 100);

  const allQueries = [
    ...allPrompts.positive,
    ...allPrompts.neutral,
    ...allPrompts.negative,
  ];
  const total = allQueries.length;

  const negCount = allPrompts.negative.length;
  const negativeQueryShare = clamp(100 - (negCount / Math.max(total, 1)) * 100);

  const reviewRiskCount = allQueries.filter((q) =>
    REVIEW_RISK_PATTERNS.some((p) => p.test(q))
  ).length;
  const reviewRisk = clamp(100 - (reviewRiskCount / Math.max(total, 1)) * 100);

  const persuasionCount = allQueries.filter((q) =>
    PERSUASION_PATTERNS.some((p) => p.test(q))
  ).length;
  const persuasionStrength = clamp((persuasionCount / Math.max(total, 1)) * 100);

  const trustExposureScore = clamp(
    (visibility + negativeQueryShare + reviewRisk + persuasionStrength) / 4
  );

  return {
    brand: entry.brand,
    sov: entry.sov,
    avgSOV: Math.round(avg * 10) / 10,
    visibility,
    negativeQueryShare,
    reviewRisk,
    persuasionStrength,
    trustExposureScore,
    prompts: allPrompts,
  };
}

const BASE_URL = "https://api.seranking.com/v2";

async function seRequest<T>(
  path: string,
  apiKey: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Token ${apiKey}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`SE Ranking API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchLeaderboard(
  apiKey: string,
  category: string
): Promise<LeaderboardEntry[]> {
  const data = await seRequest<{ items: Array<{ brand: string; shares: Record<string, number> }> }>(
    "/ai-search/leaderboard",
    apiKey,
    { category }
  );
  return data.items.map((item) => ({
    brand: item.brand,
    sov: {
      chatgpt: item.shares["chatgpt"] ?? 0,
      perplexity: item.shares["perplexity"] ?? 0,
      gemini: item.shares["gemini"] ?? 0,
      ai_overview: item.shares["ai_overview"] ?? 0,
      ai_mode: item.shares["ai_mode"] ?? 0,
    },
  }));
}

export async function fetchPromptsByBrand(
  apiKey: string,
  brand: string
): Promise<{ positive: string[]; neutral: string[]; negative: string[] }> {
  const data = await seRequest<{ prompts: string[] }>(
    "/ai-search/prompts/brand",
    apiKey,
    { brand }
  );
  const classified: { positive: string[]; neutral: string[]; negative: string[] } = {
    positive: [],
    neutral: [],
    negative: [],
  };
  for (const q of data.prompts) {
    classified[classifyQuery(q)].push(q);
  }
  return classified;
}
