# SERP Sentiment and Trust Tracker ✿

A brand intelligence tool that measures how your brand appears across AI-powered search engines — ChatGPT, Perplexity, Gemini, Google AI Overview, and Google AI Mode. Built on [SE Ranking's AI Search API](https://seranking.com).

---

## What It Does

When someone searches for your product category in an AI search engine, your brand either appears — or it doesn't. This tool measures:

- **How often** your brand is cited across each AI engine (Share of Voice)
- **How the AI responds** about your brand — positive, neutral, or critical tone
- **How exposed** your brand is to trust-damaging content in AI answers (Trust Exposure Score)
- **Which topic-specific queries** drive brand visibility when you filter by product or service

You can compare up to three domains side by side: your own site plus two competitors.

---

## How to Use

1. Select the **country** where you want to measure AI search visibility. AI Overview and AI Mode are only available in select markets — choosing the right country avoids wasting API credits.
2. Paste your **SE Ranking API key** (leave blank to run in demo mode with sample TV brand data).
3. Enter your **target domain** and up to two **competitor domains** (e.g. `sony.com`, `samsung.com`, `lg.com`).
4. Optionally enter a **topic or product filter** (e.g. `OLED`, `lease`, `SUV`). When set, only prompts containing that keyword are fetched and counted — and a separate Topic SOV chart appears in the Overview tab showing each brand's share of those matching prompts.
5. Click **Run Analysis**.

The tool runs in stages and shows a live progress log as each step completes. The Overview tab appears as soon as leaderboard data is ready; trust scores and query lists fill in brand by brand as prompts are fetched.

---

## Metrics Explained

### Share of Voice (SOV)

Share of Voice measures how often a brand is cited in AI-generated answers relative to all other brands tracked, per engine.

**How it is calculated:**
For each AI engine, the SE Ranking API returns a `brand_presence` value per domain. SOV for a given domain and engine is:

```
engine_total = sum of brand_presence across all tracked domains for that engine
domain_SOV   = (domain_brand_presence / engine_total) × 100
```

The result is a percentage (0–100). A score of 40% means 40% of all brand citations in that engine belong to your brand among the brands you are tracking. The highest-scoring brand per engine is highlighted in the table.

**Important:** because the denominator is the sum of the queried brands' citations, SOV percentages shift when you change which competitors are in the comparison set. This is intentional — if you add a brand with higher presence, existing brands' shares go down. SOV measures relative position within the comparison, not an absolute market share figure.

When SE Ranking returns no citation data for an engine, the cell shows `—` rather than `0%` to distinguish genuine zero-share from missing data. If all cells in the table show `—`, a notice is displayed explaining that SE Ranking's AI index may not yet cover those domains — national brand domains (e.g. `samsung.com`) are more likely to have data than local or niche sites.

**Engines tracked:**
| Engine | What it covers |
|---|---|
| ChatGPT | OpenAI's conversational search (Browse mode) |
| Perplexity | Perplexity AI's real-time answer engine |
| Gemini | Google's Gemini AI responses |
| AI Overview | Google's AI-generated summary at the top of search results |
| AI Mode | Google's full AI Mode search experience |

---

### Topic Share of Voice

When a topic or product filter is active, a second SOV chart appears below the main SOV table in the Overview tab. It shows each brand's **share of prompts matching the keyword** — i.e., of all AI queries containing your topic that mention any of the tracked brands, what percentage mention each brand?

```
topic_total = sum of matching prompts across all brands
brand_topic_SOV = (brand_matching_prompts / topic_total) × 100
```

This is computed client-side from the already-fetched prompt data and updates in real time as each brand's prompts load. It answers the question: "When AI users ask about [topic], which brands come up most?"

---

### Trust Exposure Score

The Trust Exposure Score is a single 0–100 number that summarises how well-positioned your brand is in the AI search landscape from a trust and intent perspective. It is the **unweighted average of four signals**, each scored 0–100.

Each column header in the Trust Exposure table has an **ⓘ tooltip** — hover it to read a plain-language explanation of how that signal is calculated.

Higher is always better. A score of 100 means maximum positive visibility with no trust risk exposure.

#### Signal 1 — Visibility

Measures your brand's average Share of Voice across all five engines relative to the strongest brand in the comparison set.

```
avg_SOV     = mean of SOV across all 5 engines
Visibility  = (avg_SOV / max_avg_SOV_in_set) × 100
```

A score of 100 means your brand has the highest average SOV among the brands being compared. A score of 50 means your average SOV is half that of the leader.

#### Signal 2 — Negative Query Share (inverted)

Measures what proportion of queries surfacing your brand have AI responses classified as negative — criticism, complaints, litigation, or problems.

```
negative_pct         = (negative_response_count / total_responses) × 100
Negative Query Share = 100 − negative_pct
```

The score is **inverted** so that higher = safer. A score of 100 means none of the AI responses about your brand are negative. A score of 60 means 40% of responses carry negative sentiment.

#### Signal 3 — Review Risk (inverted)

Measures the proportion of queries that indicate review-related or reliability-related risk — language in the prompt that suggests customers are researching quality issues or seeking refunds.

```
risk_pct    = (risk_query_count / total_queries) × 100
Review Risk = 100 − risk_pct
```

**Queries are flagged as review risk if they contain:**
- Review and rating language: "reviews", "ratings", "complaints", "bad experience"
- Reliability concerns: "reliability", "quality control", "build quality", "durability"
- Failure language: "fail", "broke", "defective", "defect"
- Return/warranty language: "return", "refund", "warranty claim", "out of warranty"

A score of 100 means no queries about your brand carry review risk signals.

#### Signal 4 — Persuasion Strength

Measures the proportion of queries that show commercial or purchase intent — people actively looking to buy, find deals, or get recommendations.

```
persuasion_pct      = (purchase_intent_queries / total_queries) × 100
Persuasion Strength = persuasion_pct
```

This signal is **not inverted** — more purchase-intent queries means your brand is being discovered when people are ready to buy.

#### Final Score

```
Trust Exposure Score = (Visibility + Negative Query Share + Review Risk + Persuasion Strength) / 4
```

All four signals are given equal weight. The score is rounded to the nearest whole number.

**Interpreting the score:**
| Score | Meaning |
|---|---|
| 70–100 | Strong position — high visibility, low trust risk, good purchase intent |
| 45–69 | Mixed signals — review or act on specific weak signals |
| 0–44 | Needs attention — likely high negative exposure or low visibility |

---

### Query Intelligence (Sentiment Bucket Breakdown)

The Query Intelligence tab shows every prompt SE Ranking tracks for your brand, classified by the **tone of the AI's response** — not by what the user searched for.

#### How sentiment is classified

Each prompt has an AI-generated answer from SE Ranking. The tool reads that answer text and classifies it:

| Bucket | How the AI responded |
|---|---|
| **Positive** | Response contains praise language — "highly recommended", "market leader", "is known for quality", "award-winning", "trusted brand", "widely considered one of the best" |
| **Negative** | Response contains criticism language — "has faced criticism", "has been criticized", "controversy", "lawsuit", "recall", "widespread complaints", "customers have complained" |
| **Neutral** | Response is informational without strong brand sentiment, or the brand is not mentioned in the response at all |

A prompt is only classified as positive or negative when the brand name appears in the AI's answer. If the AI gives a generic answer without naming the brand, the response is always neutral — this is useful signal in itself, showing where your brand is being omitted.

#### Reading the results

Each prompt entry shows:
- The **query** the user asked (in bold)
- A **snippet of the AI's answer**, with the brand name bolded wherever it appears
- A **"brand not mentioned"** badge when the brand name is absent from the response

This lets you quickly see which queries drive brand-specific AI responses versus which ones produce generic answers where your brand is invisible.

#### Filters

Two filters let you cut through noise and focus on the prompts that matter:

**Branded / Non-branded toggle:**
- **Branded** — shows only prompts where the query explicitly names the brand (e.g. "Sony OLED TV review"). These are direct brand queries.
- **Non-branded** — shows only prompts where the brand name is absent from the query (e.g. "best OLED TV for movies"). These reveal how your brand performs in category-level searches.
- **All prompts** — no filter applied (default).

**Keyword filter:**
Type any word or phrase to narrow results to prompts containing that text. Use this to focus on a specific product, service, or topic — for example "delivery", "catering", "organic", or "pricing". The filter matches any substring in the prompt text and can be combined with the branded toggle.

Bucket counts, accordion totals, and the match count update in real time. Brands with zero matching prompts are hidden. A **Clear ×** link resets all filters.

#### Export

Click **Export CSV ↓** in the tab bar to download all visible prompt data as a CSV file with columns: Brand, Bucket, Prompt, AI Response Snippet. The file opens directly in Google Sheets or Excel.

---

## Topic / Product Filter

The optional **Topic / product filter** input (on the main panel, before running) lets you scope the entire prompt analysis to a specific keyword.

**What it does:**
- Only prompts whose text contains the keyword are fetched and counted
- The Query Intelligence tab shows only matching prompts
- A **Topic SOV chart** appears in the Overview tab showing each brand's share of matching prompts
- Trust scores reflect only the filtered prompt set

**When to use it:**
- You sell multiple product lines and want to isolate one (e.g. `OLED` vs `QLED` for a TV brand)
- You want to understand AI visibility for a specific service type (e.g. `lease`, `repair`, `catering`)
- You want to filter out irrelevant queries that mention your brand in unrelated contexts

Leave the field blank to fetch all prompts with no filtering (default).

---

## Supported Countries

AI Overview and AI Mode data is only available where Google has launched these features. The tool limits country selection to:

| Code | Country |
|---|---|
| US | United States |
| GB | United Kingdom |
| AU | Australia |
| CA | Canada |
| IN | India |
| JP | Japan |
| DE | Germany |
| FR | France |
| BR | Brazil |
| MX | Mexico |
| ID | Indonesia |
| NG | Nigeria |
| KE | Kenya |
| ZA | South Africa |

---

## API Key Security

Your SE Ranking API key is sensitive. Here is exactly what happens to it:

**What we do:**
- The key is transmitted over HTTPS only — never over plain HTTP
- It is used exclusively on the server side to call SE Ranking's API on your behalf
- It is never written to a log file, database, session store, analytics system, or any other persistent storage
- It is discarded from memory as soon as the request completes
- It is redacted from any error messages before they are returned to the browser — so even if SE Ranking returns your key in an error body, the browser never sees it

**What we do not do:**
- We do not store your key anywhere
- We do not send your key to any third party other than SE Ranking
- We do not log requests in a way that could expose your key

**Validation:**
The key is validated server-side against the pattern `[A-Za-z0-9_-]{10,200}` before being used. Invalid formats are rejected immediately without being forwarded.

**Demo mode:**
If you leave the API key field blank, the tool runs entirely on mock data — no API calls are made to SE Ranking at all.

---

## Technical Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Data:** SE Ranking AI Search API v1
- **Deployment:** Vercel (60 s function timeout)

**Security headers applied to all routes:**
- `Content-Security-Policy` — restricts script/style/connect sources
- `Strict-Transport-Security` — enforces HTTPS
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables camera, microphone, geolocation

---

## API Performance and Reliability

SE Ranking's AI Search endpoints can be slow (5–15 s per call) and occasionally return gateway timeouts. The tool is designed to stay within Vercel's 60 s serverless function limit while being as resilient as possible.

### Leaderboard fetching

The leaderboard is fetched once per engine (5 engines total) in **parallel** via `Promise.allSettled`. Each call has a hard 12 s `AbortController` timeout and no retries. Total wall-clock time is the slowest single engine call, not the sum — typically 6–12 s.

If some engines time out, data is returned from the engines that did succeed. Only if all 5 engines fail does the leaderboard step error out. This means partial data (a `—` cell for one engine) is treated as a success rather than a hard failure.

All input domains always appear in the SOV table — even if SE Ranking does not return citation data for one of them. Domains with zero brand_presence are appended to the ranked list with 0% rather than being omitted.

### Prompts fetching

Each brand's prompts are fetched across 5 engines with **staggered parallelism**: engines start 200 ms apart (0, 200, 400, 600, 800 ms) and run concurrently. This avoids bursting all 5 requests simultaneously, which would trigger rate-limit responses and cause some engines to be silently dropped. Each engine call has a 15 s timeout and 1 retry with exponential backoff + random jitter (to prevent concurrent callers from re-colliding on the exact same retry slot).

Brands are fetched sequentially, with a 600 ms gap between brands, to further reduce rate-limit pressure.

### Retries and error handling

- Transient errors (HTTP 429, 500 with "too many requests", 502, 503, 504) are retried automatically
- Retry delays use exponential backoff with random jitter to avoid thundering herd
- Each individual engine failure is isolated — one engine failing does not abort the other four
- Friendly error messages are shown for common failure modes (rate limit hit, invalid API key, SE Ranking unavailable)

---

Built by [Celeste Gonzalez](https://celesteseo.com) · Data by [SE Ranking](https://seranking.com)
