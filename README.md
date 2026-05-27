# SERP Sentiment and Trust Tracker ✿

A brand intelligence tool that measures how your brand appears across AI-powered search engines — ChatGPT, Perplexity, Gemini, Google AI Overview, and Google AI Mode. Built on [SE Ranking's AI Search API](https://seranking.com).

---

## What It Does

When someone searches for your product category in an AI search engine, your brand either appears — or it doesn't. This tool measures:

- **How often** your brand is cited across each AI engine (Share of Voice)
- **How the AI responds** about your brand — positive, neutral, or critical tone
- **How exposed** your brand is to trust-damaging content in AI answers (Trust Exposure Score)

You can compare up to three domains side by side: your own site plus two competitors.

---

## How to Use

1. Select the **country** where you want to measure AI search visibility. AI Overview and AI Mode are only available in select markets — choosing the right country avoids wasting API credits.
2. Paste your **SE Ranking API key** (leave blank to run in demo mode with sample TV brand data).
3. Enter your **target domain** and up to two **competitor domains** (e.g. `sony.com`, `samsung.com`, `lg.com`).
4. Click **Run Analysis**.

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

The result is a percentage (0–100). A score of 40% means 40% of all brand citations in that engine belong to your brand. The highest-scoring brand per engine is highlighted in the table.

When SE Ranking returns no citation data for an engine, the cell shows `—` rather than `0%` to distinguish genuine zero-share from missing data.

**Engines tracked:**
| Engine | What it covers |
|---|---|
| ChatGPT | OpenAI's conversational search (Browse mode) |
| Perplexity | Perplexity AI's real-time answer engine |
| Gemini | Google's Gemini AI responses |
| AI Overview | Google's AI-generated summary at the top of search results |
| AI Mode | Google's full AI Mode search experience |

---

### Trust Exposure Score

The Trust Exposure Score is a single 0–100 number that summarises how well-positioned your brand is in the AI search landscape from a trust and intent perspective. It is the **unweighted average of four signals**, each scored 0–100.

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
- **Deployment:** Vercel

**Security headers applied to all routes:**
- `Content-Security-Policy` — restricts script/style/connect sources
- `Strict-Transport-Security` — enforces HTTPS
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables camera, microphone, geolocation

---

## Rate Limiting

SE Ranking's AI Search endpoints have per-second rate limits. The tool handles this by:

1. Running all API calls sequentially (one at a time), never in parallel bursts
2. Waiting 600 ms between each engine call within a brand's prompt fetch
3. Waiting 600 ms between brands during discovery
4. Automatically retrying on rate-limit responses (HTTP 429 or rate-limit 500) with exponential backoff: 3 s → 6 s → 12 s

This means a full analysis for three brands takes approximately 20–30 seconds end to end, but results appear progressively as each step completes.

---

Built by [Celeste Gonzalez](https://celesteseo.com) · Data by [SE Ranking](https://seranking.com)
