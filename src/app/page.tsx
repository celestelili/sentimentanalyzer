"use client";

import { useState, useCallback, useRef } from "react";
import KawaiBucket from "@/components/KawaiBucket";
import type { EngineSOV, PromptEntry } from "@/lib/seranking";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

// ─── types ────────────────────────────────────────────────────────────────────

interface OverviewBrand {
  brand: string;
  sov: EngineSOV;
  avgSOV: number;
  visibility: number;
}

interface PromptsBrand {
  brand: string;
  negativeQueryShare: number;
  reviewRisk: number;
  persuasionStrength: number;
  prompts: { positive: PromptEntry[]; neutral: PromptEntry[]; negative: PromptEntry[] };
}

interface OverviewResult {
  demo: boolean;
  country: string;
  domains: string[];
  brands: OverviewBrand[];
}

type StepStatus = "running" | "done" | "error";
interface Step { label: string; status: StepStatus }

// ─── constants ────────────────────────────────────────────────────────────────

const ENGINES = ["chatgpt", "perplexity", "gemini", "ai_overview", "ai_mode"] as const;

const ENGINE_LABELS: Record<keyof EngineSOV, string> = {
  chatgpt:    "ChatGPT",
  perplexity: "Perplexity",
  gemini:     "Gemini",
  ai_overview:"AI Overview",
  ai_mode:    "AI Mode",
};

// ─── small components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-muted text-xs uppercase tracking-widest mb-1">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted text-xs uppercase tracking-widest py-3 border-b border-border">
      {children}
    </p>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color    = value >= 70 ? "#6EC99A" : value >= 45 ? "#9B8FD4" : "#E08080";
  const segments = 10;
  const filled   = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: i < filled ? color : "#DFD0BC" }} />
        ))}
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function SignalCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted opacity-40">—</span>;
  const color = value >= 70 ? "#6EC99A" : value >= 45 ? "#9B8FD4" : "#E08080";
  return <span style={{ color }} className="tabular-nums">{value}</span>;
}

// ─── Step log ─────────────────────────────────────────────────────────────────

function StepLog({ steps }: { steps: Step[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-5 py-4 space-y-2 mb-6">
      <p className="text-muted text-xs uppercase tracking-widest mb-3">Progress</p>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5 text-xs">
          {s.status === "running" && (
            <span className="spin inline-block w-3 h-3 rounded-full border-2 border-purple/40 border-t-purple flex-shrink-0" />
          )}
          {s.status === "done" && (
            <span className="flex-shrink-0 text-[#6EC99A]">✓</span>
          )}
          {s.status === "error" && (
            <span className="flex-shrink-0 text-[#E08080]">✗</span>
          )}
          <span className={
            s.status === "done"  ? "text-muted" :
            s.status === "error" ? "text-[#E08080]" : "text-text"
          }>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── SOV table ────────────────────────────────────────────────────────────────

function SOVTable({ brands }: { brands: OverviewBrand[] }) {
  // For each engine, find the max SOV across all brands and whether any brand
  // has non-zero data. An engine where every brand shows 0 means SE Ranking
  // returned no citations for that engine — show "—" rather than "0%".
  const maxByEngine: Partial<Record<keyof EngineSOV, number>> = {};
  const engineHasData: Partial<Record<keyof EngineSOV, boolean>> = {};
  if (brands.length > 0) {
    for (const eng of ENGINES) {
      const max = Math.max(...brands.map((b) => b.sov[eng]));
      maxByEngine[eng] = max;
      engineHasData[eng] = max > 0;
    }
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted uppercase tracking-widest">
            <th className="text-left py-2 pr-4 font-normal w-28">Brand</th>
            {ENGINES.map((e) => (
              <th key={e} className="text-center py-2 px-3 font-normal">{ENGINE_LABELS[e]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brands.map((b, i) => (
            <tr key={b.brand} className={`border-t border-border ${i === 0 ? "border-border-bright" : ""}`}>
              <td className="py-3 pr-4 font-semibold text-purple-bright text-sm">{b.brand}</td>
              {ENGINES.map((eng) => {
                const hasData = engineHasData[eng];
                const val = b.sov[eng];
                const isMax = hasData && val > 0 && val === maxByEngine[eng];
                return (
                  <td key={eng} className="py-3 px-3 text-center tabular-nums">
                    {!hasData ? (
                      <span className="text-muted/40">—</span>
                    ) : isMax ? (
                      <span className="inline-block bg-surface border border-border-bright rounded px-2 py-0.5 text-text font-semibold">
                        {val}%
                      </span>
                    ) : (
                      <span className="text-muted">{val}%</span>
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

const TRUST_COLS = [
  { key: "visibility",         label: "Visibility"              },
  { key: "negativeQueryShare", label: "Neg. Query\n(Inverted)"  },
  { key: "reviewRisk",         label: "Review Risk\n(Inverted)" },
  { key: "persuasionStrength", label: "Persuasion"              },
] as const;

interface MergedBrand extends OverviewBrand {
  negativeQueryShare: number | null;
  reviewRisk: number | null;
  persuasionStrength: number | null;
  trustExposureScore: number | null;
}

function mergeBrands(overview: OverviewBrand[], prompts: PromptsBrand[]): MergedBrand[] {
  return overview.map((ob) => {
    const pb = prompts.find((p) => p.brand === ob.brand);
    const trustExposureScore = pb
      ? Math.round((ob.visibility + pb.negativeQueryShare + pb.reviewRisk + pb.persuasionStrength) / 4)
      : null;
    return {
      ...ob,
      negativeQueryShare:  pb?.negativeQueryShare  ?? null,
      reviewRisk:          pb?.reviewRisk          ?? null,
      persuasionStrength:  pb?.persuasionStrength  ?? null,
      trustExposureScore,
    };
  });
}

function TrustTable({ brands }: { brands: MergedBrand[] }) {
  const allLoaded = brands.every((b) => b.trustExposureScore !== null);
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
            <tr key={b.brand} className={`border-t border-border ${i === 0 ? "border-border-bright" : ""}`}>
              <td className="py-3 pr-4 font-semibold text-purple-bright text-sm">{b.brand}</td>
              {TRUST_COLS.map((c) => (
                <td key={c.key} className="py-3 px-3 text-center">
                  <SignalCell value={b[c.key as keyof MergedBrand] as number | null} />
                </td>
              ))}
              <td className="py-3 px-3">
                {b.trustExposureScore !== null
                  ? <ScoreBar value={b.trustExposureScore} />
                  : <span className="text-muted opacity-40 text-xs">loading…</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!allLoaded && (
        <p className="text-muted text-xs mt-3 opacity-60">
          Trust scores fill in as each brand&apos;s prompts are fetched.
        </p>
      )}
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function HighlightBrand({ text, brand }: { text: string; brand: string }) {
  if (!text) return <span className="italic opacity-50">No response text available.</span>;
  const brandPresent = brand && text.toLowerCase().includes(brand.toLowerCase());
  if (!brandPresent) {
    return (
      <>
        {text}
        <span className="ml-1.5 text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 opacity-60 not-italic">
          {brand} not mentioned
        </span>
      </>
    );
  }
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const lower = brand.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lower
          ? <strong key={i} className="text-text font-semibold">{part}</strong>
          : part
      )}
    </>
  );
}

function exportCSV(brands: PromptsBrand[]) {
  const header = ["Brand", "Bucket", "Prompt", "AI Response Snippet"];
  const rows: string[][] = [header];
  for (const b of brands) {
    for (const bucket of ["positive", "neutral", "negative"] as const) {
      for (const entry of b.prompts[bucket]) {
        rows.push([b.brand, bucket, entry.prompt, entry.answer]);
      }
    }
  }
  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "sentiment-analysis.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sentiment / Query Intelligence ──────────────────────────────────────────

function QueryIntelligenceSection({ brands }: { brands: PromptsBrand[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const grand = brands.reduce(
    (s, b) => s + b.prompts.positive.length + b.prompts.neutral.length + b.prompts.negative.length, 0
  );

  return (
    <div>
      <div className="flex gap-10 mb-8">
        {(["positive", "neutral", "negative"] as const).map((t) => {
          const total = brands.reduce((s, b) => s + b.prompts[t].length, 0);
          return (
            <KawaiBucket key={t} type={t}
              count={total}
              pct={grand > 0 ? Math.round((total / grand) * 100) : 0}
            />
          );
        })}
      </div>

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
                  <span className="text-xs" style={{ color: "#6EC99A" }}>+{b.prompts.positive.length}</span>
                  <span className="text-xs" style={{ color: "#9B8FD4" }}>~{b.prompts.neutral.length}</span>
                  <span className="text-xs" style={{ color: "#E08080" }}>−{b.prompts.negative.length}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
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
                        <p className="text-xs uppercase tracking-widest mb-2 font-medium"
                          style={{ color: colorMap[bucket] }}>
                          {bucket} ({b.prompts[bucket].length})
                        </p>
                        <ul className="space-y-2">
                          {b.prompts[bucket].map((entry, i) => (
                            <li key={i} className="text-xs leading-relaxed">
                              <span className="text-text font-medium block">&ldquo;{entry.prompt}&rdquo;</span>
                              {entry.answer && (
                                <span className="text-muted block mt-0.5">
                                  <HighlightBrand text={entry.answer} brand={b.brand} />
                                </span>
                              )}
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

const DOMAIN_RE = /^[A-Za-z0-9][A-Za-z0-9\-\.]{1,100}\.[A-Za-z]{2,10}$/;

function cleanDomain(raw: string): string {
  return raw.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

export default function HomePage() {
  const [apiKey, setApiKey]       = useState("");
  const [country, setCountry]     = useState("US");
  const [targetDomain, setTarget] = useState("");
  const [competitor1, setComp1]   = useState("");
  const [competitor2, setComp2]   = useState("");

  const [running, setRunning]           = useState(false);
  const [steps, setSteps]               = useState<Step[]>([]);
  const [overviewResult, setOverview]   = useState<OverviewResult | null>(null);
  const [promptsBrands, setPromptsBrands] = useState<PromptsBrand[]>([]);
  const [error, setError]               = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<"overview" | "intelligence">("overview");

  const stepIdxRef = useRef(0);

  function pushStep(label: string): number {
    const idx = stepIdxRef.current++;
    setSteps((prev) => [...prev, { label, status: "running" }]);
    return idx;
  }

  function resolveStep(idx: number, label?: string) {
    setSteps((prev) => prev.map((s, i) => i === idx ? { label: label ?? s.label, status: "done" } : s));
  }

  function failStep(idx: number, label?: string) {
    setSteps((prev) => prev.map((s, i) => i === idx ? { label: label ?? s.label, status: "error" } : s));
  }

  const runAnalysis = useCallback(async () => {
    setRunning(true);
    setError(null);
    setOverview(null);
    setPromptsBrands([]);
    setSteps([]);
    setActiveTab("overview");
    stepIdxRef.current = 0;

    const trimmedKey  = apiKey.trim();
    const isDemo      = !trimmedKey;
    const rawDomains  = [targetDomain, competitor1, competitor2].map(cleanDomain).filter(Boolean);
    const validDomains = rawDomains.filter((d) => DOMAIN_RE.test(d));

    try {
      if (isDemo || validDomains.length === 0) {
        // ── Demo / no domains ────────────────────────────────────────────────
        const si = pushStep("Loading demo overview…");
        const res = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        resolveStep(si, "Demo overview loaded");
        setOverview(data);

        for (const brand of (data.brands as OverviewBrand[]).map((b) => b.brand)) {
          const pi = pushStep(`Loading demo prompts for ${brand}…`);
          const pr = await fetch("/api/prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brands: [brand] }),
          });
          const pd = await pr.json();
          if (pr.ok && pd.brands?.[0]) {
            setPromptsBrands((prev) => [...prev, pd.brands[0]]);
            resolveStep(pi, `Demo prompts loaded — ${brand}`);
          } else {
            failStep(pi, `Could not load demo prompts for ${brand}`);
          }
        }
      } else {
        // ── Live mode ────────────────────────────────────────────────────────

        // Step 1: Discover brand names
        const discovered: { domain: string; brand: string }[] = [];
        for (const domain of validDomains) {
          const si = pushStep(`Identifying ${domain}…`);
          const res = await fetch("/api/discover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: trimmedKey, domain, country }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? `Could not identify ${domain}`);
          discovered.push({ domain, brand: data.brand });
          resolveStep(si, `${domain} → ${data.brand}`);
        }

        // Step 2: Fetch leaderboard
        const [primary, ...competitors] = discovered.map(({ domain, brand }) => ({
          target: domain, brand,
        }));
        const li = pushStep("Fetching AI visibility leaderboard…");
        const lbRes = await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: trimmedKey, primary, competitors, country }),
        });
        const lbData = await lbRes.json();
        if (!lbRes.ok) throw new Error(lbData.error ?? "Leaderboard fetch failed");
        resolveStep(li, "Leaderboard loaded");
        setOverview(lbData);

        // Step 3: Prompts per brand (sequential, client-controlled delay)
        for (let i = 0; i < discovered.length; i++) {
          const { brand } = discovered[i];
          if (i > 0) await new Promise<void>((r) => setTimeout(r, 600));
          const pi = pushStep(`Loading prompts for ${brand}…`);
          const pr = await fetch("/api/prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: trimmedKey, country, brands: [brand] }),
          });
          const pd = await pr.json();
          if (pr.ok && pd.brands?.[0]) {
            setPromptsBrands((prev) => [...prev, pd.brands[0]]);
            resolveStep(pi, `Prompts loaded — ${brand}`);
          } else {
            failStep(pi, `Could not load prompts for ${brand}: ${pd.error ?? "unknown error"}`);
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setRunning(false);
    }
  }, [apiKey, country, targetDomain, competitor1, competitor2]);

  const clear = useCallback(() => {
    setApiKey(""); setCountry("US"); setTarget(""); setComp1(""); setComp2("");
    setOverview(null); setPromptsBrands([]); setError(null); setSteps([]);
    setActiveTab("overview");
  }, []);

  const mergedBrands = overviewResult
    ? mergeBrands(overviewResult.brands, promptsBrands)
    : [];

  const allPromptsLoaded = overviewResult
    ? promptsBrands.length === overviewResult.brands.length
    : false;

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

            <div className="sm:col-span-2">
              <Label>Country</Label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="bg-input border border-border rounded px-4 py-2.5 text-sm text-text focus:outline-none focus:border-border-bright transition-colors appearance-none cursor-pointer"
                style={{ minWidth: "200px" }}>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <Label>SE Ranking API Key</Label>
              <input type="password" placeholder="paste your API key here"
                value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off" spellCheck={false}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors" />
            </div>

            <div>
              <Label>Target Domain</Label>
              <input type="text" placeholder="e.g. sony.com"
                value={targetDomain} onChange={(e) => setTarget(e.target.value)}
                maxLength={120}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors" />
            </div>

            <div>
              <Label>Competitor 1</Label>
              <input type="text" placeholder="e.g. samsung.com"
                value={competitor1} onChange={(e) => setComp1(e.target.value)}
                maxLength={120}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors" />
            </div>

            <div>
              <Label>Competitor 2</Label>
              <input type="text" placeholder="e.g. lg.com"
                value={competitor2} onChange={(e) => setComp2(e.target.value)}
                maxLength={120}
                className="w-full bg-input border border-border rounded px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-border-bright transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={runAnalysis} disabled={running}
              className="text-sm text-purple-bright border border-purple-dim rounded px-5 py-2 hover:bg-highlight disabled:opacity-40 transition-colors">
              {running ? "Running…" : "Run Analysis ›"}
            </button>
            <button onClick={clear} className="text-sm text-muted hover:text-text transition-colors">
              Clear
            </button>
          </div>

          <p className="text-muted text-xs mt-4 leading-relaxed">
            🔒 Your API key is sent over HTTPS, used server-side to call SE Ranking, then discarded.
            It is never logged, stored, or retained. Leave it blank to run in demo mode.
          </p>
        </div>
      </section>

      {/* ── error ── */}
      {error && (
        <div className="px-8 mb-6">
          <div className="bg-[#F5D8D8] border border-[#A03030]/40 rounded-lg px-5 py-3">
            <p className="text-[#A03030] text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ── progress log ── */}
      {steps.length > 0 && (
        <div className="px-8 mb-2">
          <StepLog steps={steps} />
        </div>
      )}

      {/* ── results ── */}
      {overviewResult && (
        <div className="px-8 pb-16 fade-up">

          {/* meta strip */}
          <div className="bg-surface border border-border rounded px-5 py-2.5 inline-flex items-center gap-3 mb-6">
            {overviewResult.demo && (
              <>
                <span className="text-purple text-xs uppercase tracking-widest">Demo mode</span>
                <span className="text-border-bright text-xs">·</span>
              </>
            )}
            <span className="text-muted text-xs">
              Country:{" "}
              <span className="text-text">
                {SUPPORTED_COUNTRIES.find((c) => c.code === overviewResult.country)?.label ?? overviewResult.country}
              </span>
            </span>
            {overviewResult.demo && (
              <>
                <span className="text-border-bright text-xs">·</span>
                <span className="text-muted text-xs">showing sample TV brand data</span>
              </>
            )}
          </div>

          {/* ── tab bar ── */}
          <div className="flex items-center justify-between mb-6 border-b border-border">
            <div className="flex gap-0">
              {(["overview", "intelligence"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-purple-bright text-purple-bright"
                      : "border-transparent text-muted hover:text-text"
                  }`}>
                  {tab === "overview" ? "Overview" : (
                    <span className="flex items-center gap-1.5">
                      Query Intelligence
                      {!allPromptsLoaded && running && (
                        <span className="spin inline-block w-2.5 h-2.5 rounded-full border-2 border-purple/40 border-t-purple" />
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {activeTab === "intelligence" && promptsBrands.length > 0 && (
              <button
                onClick={() => exportCSV(promptsBrands)}
                className="mb-1 text-xs text-purple-bright border border-purple-dim rounded px-4 py-1.5 hover:bg-highlight transition-colors"
              >
                Export CSV ↓
              </button>
            )}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <SectionTitle>Share of Voice by AI Engine (% of citations per engine per brand)</SectionTitle>
                <div className="bg-surface border border-border rounded-lg p-5 mt-3">
                  <SOVTable brands={overviewResult.brands} />
                </div>
              </div>
              <div>
                <SectionTitle>Trust Exposure Score (unweighted average of four signals, 0 to 100)</SectionTitle>
                <div className="bg-surface border border-border rounded-lg p-5 mt-3">
                  <TrustTable brands={mergedBrands} />
                </div>
              </div>
            </div>
          )}

          {/* ── Query Intelligence tab ── */}
          {activeTab === "intelligence" && (
            <div className="space-y-8">
              {promptsBrands.length === 0 && running && (
                <p className="text-muted text-sm py-4">Fetching query data — check the progress log above.</p>
              )}
              {promptsBrands.length > 0 && (
                <>
                  <div>
                    <SectionTitle>Sentiment Bucket Breakdown (classified by AI response tone per brand)</SectionTitle>
                    <div className="bg-surface border border-border rounded-lg p-5 mt-3">
                      <QueryIntelligenceSection brands={promptsBrands} />
                    </div>
                  </div>
                  <div>
                    <SectionTitle>Trust Exposure Score (full, all four signals)</SectionTitle>
                    <div className="bg-surface border border-border rounded-lg p-5 mt-3">
                      <TrustTable brands={mergedBrands} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

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
