"use client";

import { useState, useCallback } from "react";
import KawaiBucket from "@/components/KawaiBucket";
import type { BrandScore, EngineSOV } from "@/lib/seranking";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

// ─── types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  demo: boolean;
  country: string;
  domains: string[];
  brands: BrandScore[];
}

// ─── constants ────────────────────────────────────────────────────────────────

const ENGINES = ["chatgpt", "perplexity", "gemini", "ai_overview", "ai_mode"] as const;

const ENGINE_LABELS: Record<keyof EngineSOV, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  ai_overview: "AI Overview",
  ai_mode: "AI Mode",
};

const TRUST_COLS = [
  { key: "visibility",         label: "Visibility"              },
  { key: "negativeQueryShare", label: "Neg. Query\n(Inverted)"  },
  { key: "reviewRisk",         label: "Review Risk\n(Inverted)" },
  { key: "persuasionStrength", label: "Persuasion"              },
] as const;

// ─── small components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted text-xs uppercase tracking-widest mb-1">{children}</p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted text-xs uppercase tracking-widest py-3 border-b border-border">
      {children}
    </p>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "#6EC99A" : value >= 45 ? "#9B8FD4" : "#E08080";
  const segments = 10;
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: i < filled ? color : "#DFD0BC" }}
          />
        ))}
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function SignalCell({ value }: { value: number }) {
  const color = value >= 70 ? "#6EC99A" : value >= 45 ? "#9B8FD4" : "#E08080";
  return <span style={{ color }} className="tabular-nums">{value}</span>;
}

// ─── SOV table ────────────────────────────────────────────────────────────────

function SOVTable({ brands }: { brands: BrandScore[] }) {
  // find max per engine for highlight
  const maxByEngine: Partial<Record<keyof EngineSOV, number>> = {};
  for (const eng of ENGINES) {
    maxByEngine[eng] = Math.max(...brands.map((b) => b.sov[eng]));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted uppercase tracking-widest">
            <th className="text-left py-2 pr-4 font-normal w-28">Brand</th>
            {ENGINES.map((e) => (
              <th key={e} className="text-center py-2 px-3 font-normal">
                {ENGINE_LABELS[e]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brands.map((b, i) => (
            <tr
              key={b.brand}
              className={`border-t border-border ${i === 0 ? "border-border-bright" : ""}`}
            >
              <td className="py-3 pr-4 font-semibold text-purple-bright text-sm">
                {b.brand}
              </td>
              {ENGINES.map((eng) => {
                const isMax = b.sov[eng] === maxByEngine[eng];
                return (
                  <td key={eng} className="py-3 px-3 text-center tabular-nums">
                    {isMax ? (
                      <span className="inline-block bg-surface border border-border-bright rounded px-2 py-0.5 text-text font-semibold">
                        {b.sov[eng]}%
                      </span>
                    ) : (
                      <span className="text-muted">{b.sov[eng]}%</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Trust Exposure table ─────────────────────────────────────────────────────

function TrustTable({ brands }: { brands: BrandScore[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted uppercase tracking-widest">
            <th className="text-left py-2 pr-4 font-normal w-28">Brand</th>
            {TRUST_COLS.map((c) => (
              <th key={c.key} className="text-center py-2 px-3 font-normal leading-tight whitespace-pre-line">
                {c.label}
              </th>
            ))}
            <th className="text-center py-2 px-3 font-normal">Trust Score</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b, i) => (
            <tr
              key={b.brand}
              className={`border-t border-border ${i === 0 ? "border-border-bright" : ""}`}
            >
              <td className="py-3 pr-4 font-semibold text-purple-bright text-sm">
                {b.brand}
              </td>
              {TRUST_COLS.map((c) => (
                <td key={c.key} className="py-3 px-3 text-center">
                  <SignalCell value={b[c.key]} />
                </td>
              ))}
              <td className="py-3 px-3">
                <ScoreBar value={b.trustExposureScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sentiment Breakdown ──────────────────────────────────────────────────────

function SentimentSection({ brands }: { brands: BrandScore[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      {/* bucket icons + overall totals */}
      <div className="flex gap-10 mb-8">
        {(["positive", "neutral", "negative"] as const).map((t) => {
          const total = brands.reduce((s, b) => s + b.prompts[t].length, 0);
          const grand = brands.reduce(
            (s, b) => s + b.prompts.positive.length + b.prompts.neutral.length + b.prompts.negative.length,
            0
          );
          return (
            <KawaiBucket
              key={t}
              type={t}
              count={total}
              pct={grand > 0 ? Math.round((total / grand) * 100) : 0}
            />
          );
        })}
      </div>

      {/* per-brand query lists */}
      <div className="space-y-1">
        {brands.map((b) => {
          const isOpen = expanded === b.brand;
          return (
            <div key={b.brand} className="border border-border rounded">
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-highlight transition-colors"
                onClick={() => setExpanded(isOpen ? null : b.brand)}
              >
                <span className="text-sm font-semibold text-purple-bright">{b.brand}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-positive">+{b.prompts.positive.length}</span>
                  <span className="text-xs text-neutral">~{b.prompts.neutral.length}</span>
                  <span className="text-xs text-negative">−{b.prompts.negative.length}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M2 4l4 4 4-4" stroke="#8A84A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3 grid grid-cols-3 gap-4 fade-up">
                  {(["positive", "neutral", "negative"] as const).map((bucket) => {
                    const colorMap = { positive: "#6EC99A", neutral: "#9B8FD4", negative: "#E08080" };
                    return (
                      <div key={bucket}>
                        <p
                          className="text-xs uppercase tracking-widest mb-2 font-medium"
                          style={{ color: colorMap[bucket] }}
                        >
                          {bucket} ({b.prompts[bucket].length})
                        </p>
                        <ul className="space-y-1">
                          {b.prompts[bucket].map((q, i) => (
                            <li key={i} className="text-xs text-muted leading-relaxed">
                              &ldquo;{q}&rdquo;
                            </li>
                          ))}
                          {b.prompts[bucket].length === 0 && (
                            <li className="text-xs text-muted italic">none</li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [apiKey, setApiKey]         = useState("");
  const [country, setCountry]       = useState("US");
  const [targetDomain, setTarget]   = useState("");
  const [competitor1, setComp1]     = useState("");
  const [competitor2, setComp2]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<AnalysisResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [status, setStatus]         = useState("Enter your details above to begin.");

  const canRun = !loading;

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatus("Fetching AI visibility data…");
    try {
      const trimmedKey = apiKey.trim();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: trimmedKey || undefined,
          country,
          targetDomain: targetDomain.trim() || undefined,
          competitor1: competitor1.trim() || undefined,
          competitor2: competitor2.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
      setStatus(data.demo ? "Showing demo data. Add an API key for live results." : "Analysis complete.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setStatus("Analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, targetDomain, competitor1, competitor2]);

  const clear = useCallback(() => {
    setApiKey(""); setCountry("US"); setTarget(""); setComp1(""); setComp2("");
    setResult(null); setError(null);
    setStatus("Enter your details above to begin.");
  }, []);

  return (
    <main className="min-h-screen bg-bg text-text font-mono">

      {/* ── header ── */}
      <header className="px-8 pt-8 pb-6">
        <h1 className="text-purple-bright font-serif text-3xl md:text-4xl font-bold tracking-tight">
          SERP Sentiment and Trust Tracker ✿
        </h1>
        <p className="text-muted text-xs uppercase tracking-widest mt-1">
          AI Visibility, Trust Exposure, and Sentiment Intelligence
        </p>
      </header>

      {/* ── input panel ── */}
      <section className="px-8 pb-8">
        <div className="bg-surface border border-border rounded-lg p-6 max-w-4xl">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">

            {/* country — first so users don't waste credits on unsupported regions */}
            <div className="sm:col-span-2">
              <Label>Country</Label>
              <div className="flex items-start gap-3">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-input border border-border rounded px-4 py-2.5 text-sm text-text focus:outline-none focus:border-border-bright transition-colors appearance-none cursor-pointer"
                  style={{ minWidth: "200px" }}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* API key */}
            <div className="sm:col-span-2">
              <Label>SE Ranking API Key</Label>
              <input
                type="password"
                placeholder="paste your API key here"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors"
              />
            </div>

            {/* target domain */}
            <div>
              <Label>Target Domain</Label>
              <input
                type="text"
                placeholder="e.g. sony.com"
                value={targetDomain}
                onChange={(e) => setTarget(e.target.value)}
                maxLength={120}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors"
              />
            </div>

            {/* competitor 1 */}
            <div>
              <Label>Competitor 1</Label>
              <input
                type="text"
                placeholder="e.g. samsung.com"
                value={competitor1}
                onChange={(e) => setComp1(e.target.value)}
                maxLength={120}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors"
              />
            </div>

            {/* competitor 2 */}
            <div>
              <Label>Competitor 2</Label>
              <input
                type="text"
                placeholder="e.g. lg.com"
                value={competitor2}
                onChange={(e) => setComp2(e.target.value)}
                maxLength={120}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors"
              />
            </div>
          </div>

          {/* actions row */}
          <div className="flex items-center gap-4">
            <button
              onClick={runAnalysis}
              disabled={!canRun}
              className="text-sm text-purple-bright border border-purple-dim rounded px-5 py-2 hover:bg-highlight disabled:opacity-40 transition-colors"
            >
              {loading ? "Analyzing…" : "Run Analysis ›"}
            </button>
            <button
              onClick={clear}
              className="text-sm text-muted hover:text-text transition-colors"
            >
              Clear
            </button>
            <span className="text-xs text-muted">{status}</span>
          </div>

          {/* privacy notice */}
          <p className="text-muted text-xs mt-4 leading-relaxed">
            🔒 Your API key is sent over HTTPS, used server-side to call SE Ranking, then discarded.
            It is never logged, stored, or retained. Leave it blank to run in demo mode.
          </p>
        </div>
      </section>

      {/* ── error ── */}
      {error && (
        <div className="px-8 mb-6">
          <div className="bg-[#F5D8D8] border border-negative/40 rounded-lg px-5 py-3">
            <p className="text-negative text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ── results ── */}
      {result && (
        <div className="px-8 pb-16 space-y-8 fade-up">

          <div className="bg-surface border border-border rounded px-5 py-2.5 inline-flex items-center gap-3">
            {result.demo && (
              <>
                <span className="text-purple text-xs uppercase tracking-widest">Demo mode</span>
                <span className="text-border-bright text-xs">·</span>
              </>
            )}
            <span className="text-muted text-xs">
              Country:{" "}
              <span className="text-text">
                {SUPPORTED_COUNTRIES.find((c) => c.code === result.country)?.label ?? result.country}
              </span>
            </span>
            {result.demo && (
              <>
                <span className="text-border-bright text-xs">·</span>
                <span className="text-muted text-xs">showing sample TV brand data</span>
              </>
            )}
          </div>

          {/* SOV table */}
          <div>
            <SectionTitle>
              Share of Voice by AI Engine (% of citations per engine per brand)
            </SectionTitle>
            <div className="bg-surface border border-border rounded-lg p-5 mt-3">
              <SOVTable brands={result.brands} />
            </div>
          </div>

          {/* Trust table */}
          <div>
            <SectionTitle>
              Trust Exposure Score (unweighted average of four signals, 0 to 100)
            </SectionTitle>
            <div className="bg-surface border border-border rounded-lg p-5 mt-3">
              <TrustTable brands={result.brands} />
            </div>
          </div>

          {/* Sentiment buckets */}
          <div>
            <SectionTitle>
              Sentiment Bucket Breakdown (share of queries by intent type per brand)
            </SectionTitle>
            <div className="bg-surface border border-border rounded-lg p-5 mt-3">
              <SentimentSection brands={result.brands} />
            </div>
          </div>

        </div>
      )}

      {/* ── footer ── */}
      <footer className="border-t border-border px-8 py-5 mt-4">
        <p className="text-muted text-xs">
          Built by Celeste Gonzalez,{" "}
          <a href="https://celesteseo.com" className="text-purple hover:text-purple-bright transition-colors underline">
            CelesteSEO.com
          </a>
          {" "}· Data by{" "}
          <a href="https://seranking.com" className="text-purple hover:text-purple-bright transition-colors underline">
            SE Ranking
          </a>
        </p>
      </footer>
    </main>
  );
}
