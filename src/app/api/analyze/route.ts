import { NextRequest, NextResponse } from "next/server";
import {
  fetchLeaderboard,
  fetchPromptsByBrand,
  scoreBrand,
  type BrandScore,
} from "@/lib/seranking";
import {
  MOCK_LEADERBOARD,
  MOCK_PROMPTS,
  MOCK_BRANDS,
} from "@/lib/mockData";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey: string | undefined = body.apiKey;
    const category: string = body.category ?? "televisions";

    let leaderboard;
    let promptsMap: Record<string, { positive: string[]; neutral: string[]; negative: string[] }>;

    if (!apiKey) {
      leaderboard = MOCK_LEADERBOARD;
      promptsMap = MOCK_PROMPTS;
    } else {
      leaderboard = await fetchLeaderboard(apiKey, category);
      const brands = leaderboard.map((e) => e.brand);
      const promptResults = await Promise.all(
        brands.map((b) => fetchPromptsByBrand(apiKey, b))
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

    return NextResponse.json({
      demo: !apiKey,
      category,
      brands: scores,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
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
