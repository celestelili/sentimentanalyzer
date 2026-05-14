"use client";

import { useState, useCallback } from "react";
import KawaiBucket from "@/components/KawaiBucket";
import type { BrandScore, EngineSOV } from "@/lib/seranking";

const ENGINE_LABELS: Record<keyof EngineSOV, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  ai_overview: "AI Overview",
  ai_mode: "AI Mode",
};

const ENGINE_COLORS: Record<keyof EngineSOV, string> = {
  chatgpt: "#10A37F",
  perplexity: "#20B2AA",
  gemini: "#4285F4",
  ai_overview: "#EA4335",
  ai_mode: "#FBBC05",
};

const SIGNAL_LABELS = [
  { key: "visibility", label: "Visibility" },
  { key: "negativeQueryShare", label: "Neg. Query Share" },
  { key: "reviewRisk", label: "Review Risk" },
  { key: "persuasionStrength", label: "Persuasion" },
] as const;

interface AnalysisResult {
  demo: boolean;
  category: string;
  brands: BrandScore[];
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70 ? "#4A7C59" : score >= 45 ? "#C8A96E" : "#9B3A3A";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E0D8"
        strokeWidth="6"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="score-ring"
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.22}
        fontFamily="var(--font-dm-mono)"
        fontWeight="600"
      >
        {score}
      </text>
    </svg>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs text-muted w-7 text-right">{value}</span>
    </div>
  );
}

function SOVBar({ sov }: { sov: EngineSOV }) {
  const engines = Object.keys(sov) as (keyof EngineSOV)[];
  return (
    <div className="space-y-2">
      {engines.map((engine) => (
        <div key={engine} className="flex items-center gap-2">
          <span
            className="font-mono text-xs w-24 shrink-0"
            style={{ color: ENGINE_COLORS[engine] }}
          >
            {ENGINE_LABELS[engine]}
          </span>
          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${sov[engine]}%`,
                backgroundColor: ENGINE_COLORS[engine],
              }}
            />
          </div>
          <span className="font-mono text-xs text-muted w-8 text-right">
            {sov[engine]}%
          </span>
        </div>
      ))}
    </div>
  );
}

function BrandCard({ brand, rank }: { brand: BrandScore; rank: number }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"sov" | "signals" | "queries">("sov");

  const scoreColor =
    brand.trustExposureScore >= 70
      ? "text-positive"
      : brand.trustExposureScore >= 45
      ? "text-accent"
      : "text-negative";

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden fade-in">
      {/* header row */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-cream transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="font-mono text-sm text-muted w-5 shrink-0">{rank}.</span>

        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-2xl font-semibold">{brand.brand}</h2>
          <p className="font-mono text-xs text-muted mt-0.5">
            Avg SOV {brand.avgSOV}% across engines
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden sm:block">
            <ScoreRing score={brand.trustExposureScore} />
          </div>
          <div className={`font-mono text-xs font-medium ${scoreColor} hidden md:block`}>
            Trust<br />Exposure
          </div>

          {/* sentiment pill summary */}
          <div className="flex gap-2">
            <span className="bg-[#D4EDDA] text-positive font-mono text-xs px-2 py-1 rounded-full">
              +{brand.prompts.positive.length}
            </span>
            <span className="bg-[#E9ECEF] text-neutral font-mono text-xs px-2 py-1 rounded-full">
              ~{brand.prompts.neutral.length}
            </span>
            <span className="bg-[#F8D7DA] text-negative font-mono text-xs px-2 py-1 rounded-full">
              -{brand.prompts.negative.length}
            </span>
          </div>

          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M3 6l5 5 5-5" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* expanded detail */}
      {open && (
        <div className="border-t border-border">
          {/* tabs */}
          <div className="flex border-b border-border">
            {(["sov", "signals", "queries"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-mono text-xs px-4 py-2.5 capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-ink text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab === "sov" ? "Share of Voice" : tab === "signals" ? "Trust Signals" : "Query Buckets"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === "sov" && (
              <div>
                <p className="font-mono text-xs text-muted mb-4 uppercase tracking-wider">
                  AI Engine Citations — Share of Voice
                </p>
                <SOVBar sov={brand.sov} />
              </div>
            )}

            {activeTab === "signals" && (
              <div>
                <p className="font-mono text-xs text-muted mb-4 uppercase tracking-wider">
                  Trust Exposure Score breakdown (higher = better)
                </p>
                <div className="space-y-3">
                  {SIGNAL_LABELS.map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-xs">{label}</span>
                      </div>
                      <MiniBar
                        value={brand[key]}
                        color={brand[key] >= 70 ? "#4A7C59" : brand[key] >= 45 ? "#C8A96E" : "#9B3A3A"}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                  <ScoreRing score={brand.trustExposureScore} size={64} />
                  <div>
                    <p className="font-mono text-xs text-muted">Trust Exposure Score</p>
                    <p className="font-mono text-xs text-muted mt-1">
                      Unweighted avg of 4 signals
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "queries" && (
              <div>
                <p className="font-mono text-xs text-muted mb-4 uppercase tracking-wider">
                  Sampled prompts per sentiment bucket
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <KawaiBucket type="positive" count={brand.prompts.positive.length} />
                  <KawaiBucket type="neutral" count={brand.prompts.neutral.length} />
                  <KawaiBucket type="negative" count={brand.prompts.negative.length} />
                </div>

                <div className="space-y-3">
                  {(["positive", "neutral", "negative"] as const).map((bucket) => (
                    <details key={bucket} className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none py-2 border-t border-border">
                        <span
                          className="font-mono text-xs uppercase tracking-wider font-medium"
                          style={{
                            color:
                              bucket === "positive"
                                ? "#4A7C59"
                                : bucket === "neutral"
                                ? "#6B7280"
                                : "#9B3A3A",
                          }}
                        >
                          {bucket} queries ({brand.prompts[bucket].length})
                        </span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="group-open:rotate-180 transition-transform shrink-0"
                        >
                          <path d="M2 4l4 4 4-4" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </summary>
                      <ul className="mt-2 space-y-1 pl-2">
                        {brand.prompts[bucket].map((q, i) => (
                          <li key={i} className="font-mono text-xs text-muted py-1 border-b border-border/50 last:border-0">
                            &ldquo;{q}&rdquo;
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [apiKey, setApiKey] = useState("");
  const [category, setCategory] = useState("televisions");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setHasRun(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() || undefined, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [apiKey, category]);

  const top = result?.brands[0];
  const topScore = top?.trustExposureScore ?? 0;

  return (
    <main className="min-h-screen">
      {/* masthead */}
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted uppercase tracking-widest mb-2">
                CelesteSEO.com · Powered by SE Ranking
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight">
                SERP Sentiment<br />
                <span className="font-semibold">&amp; Trust Tracker</span>
              </h1>
              <p className="font-mono text-sm text-muted mt-3 max-w-lg leading-relaxed">
                Not just whether brands show up — but <em>how</em> they show up across
                ChatGPT, Perplexity, Gemini, AI Overview, and AI Mode.
              </p>
            </div>
            <div className="hidden lg:block shrink-0 text-right">
              <p className="font-mono text-xs text-muted">Trust Exposure Score</p>
              <p className="font-mono text-xs text-muted text-right">4 signals · 0–100</p>
            </div>
          </div>
        </div>
      </header>

      {/* controls */}
      <section className="border-b border-border bg-cream">
        <div className="max-w-5xl mx-auto px-5 py-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              placeholder="SE Ranking API key (leave blank for demo mode)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 font-mono text-sm border border-border rounded-md px-4 py-2.5 bg-white placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
            <input
              type="text"
              placeholder="Category (e.g. televisions)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-48 font-mono text-sm border border-border rounded-md px-4 py-2.5 bg-white placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="font-mono text-sm bg-ink text-cream px-6 py-2.5 rounded-md hover:bg-ink/80 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {loading ? "Analyzing…" : "Run Analysis"}
            </button>
          </div>
          {!hasRun && (
            <p className="font-mono text-xs text-muted mt-2">
              Running without an API key loads sample TV brand data for demo.
            </p>
          )}
        </div>
      </section>

      {/* results */}
      <div className="max-w-5xl mx-auto px-5 py-8">
        {error && (
          <div className="bg-[#F8D7DA] border border-negative/30 rounded-lg p-4 mb-6">
            <p className="font-mono text-sm text-negative">{error}</p>
          </div>
        )}

        {result && (
          <>
            {/* summary strip */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div>
                <p className="font-mono text-xs text-muted uppercase tracking-wider">
                  {result.demo ? "Demo mode · TV brands" : `Category: ${result.category}`}
                </p>
                <p className="font-serif text-2xl font-semibold mt-1">
                  {result.brands.length} brands ranked
                </p>
              </div>
              {top && (
                <div className="text-right">
                  <p className="font-mono text-xs text-muted">Top trust score</p>
                  <p className="font-serif text-xl font-semibold text-positive">
                    {top.brand} · {top.trustExposureScore}
                  </p>
                </div>
              )}
            </div>

            {/* leaderboard bar */}
            <div className="bg-white border border-border rounded-lg p-5 mb-6">
              <p className="font-mono text-xs text-muted uppercase tracking-wider mb-4">
                Trust Exposure Score — all brands
              </p>
              <div className="space-y-3">
                {result.brands.map((brand) => (
                  <div key={brand.brand} className="flex items-center gap-3">
                    <span className="font-mono text-xs w-20 shrink-0">{brand.brand}</span>
                    <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${brand.trustExposureScore}%`,
                          backgroundColor:
                            brand.trustExposureScore >= 70
                              ? "#4A7C59"
                              : brand.trustExposureScore >= 45
                              ? "#C8A96E"
                              : "#9B3A3A",
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted w-6 text-right">
                      {brand.trustExposureScore}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 pt-3 border-t border-border">
                {[
                  { color: "#4A7C59", label: "Strong (70+)" },
                  { color: "#C8A96E", label: "Moderate (45–69)" },
                  { color: "#9B3A3A", label: "Weak (<45)" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono text-xs text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* brand cards */}
            <div className="space-y-3">
              {result.brands.map((brand, i) => (
                <BrandCard key={brand.brand} brand={brand} rank={i + 1} />
              ))}
            </div>

            {/* scoring notes */}
            <div className="mt-8 bg-white border border-border rounded-lg p-5">
              <p className="font-mono text-xs text-muted uppercase tracking-wider mb-3">
                Scoring methodology
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Visibility", desc: "Avg SOV across engines, scaled to top brand" },
                  { label: "Neg. Query Share", desc: "% negative prompts, inverted (higher = safer)" },
                  { label: "Review Risk", desc: "% review/complaint language, inverted" },
                  { label: "Persuasion", desc: "% buying-stage intent language" },
                ].map(({ label, desc }) => (
                  <div key={label}>
                    <p className="font-mono text-xs font-semibold">{label}</p>
                    <p className="font-mono text-xs text-muted mt-1 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!result && !loading && !error && (
          <div className="text-center py-16">
            <p className="font-serif text-3xl font-light text-muted mb-3">
              Click <em>Run Analysis</em> to begin
            </p>
            <p className="font-mono text-sm text-muted">
              No API key? Leave it blank — demo data loads automatically.
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-mono text-sm text-muted">Fetching AI visibility data…</p>
          </div>
        )}
      </div>

      <footer className="border-t border-border mt-8 py-6">
        <div className="max-w-5xl mx-auto px-5">
          <p className="font-mono text-xs text-muted">
            Built by Celeste Gonzalez,{" "}
            <a href="https://celesteseo.com" className="underline hover:text-ink transition-colors">
              CelesteSEO.com
            </a>{" "}
            · Data by{" "}
            <a href="https://seranking.com" className="underline hover:text-ink transition-colors">
              SE Ranking
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
