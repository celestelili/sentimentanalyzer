import type { LeaderboardEntry, BrandPrompts } from "./seranking";

export const MOCK_BRANDS = ["Samsung", "Sony", "LG", "TCL", "Hisense", "Vizio"];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    brand: "Samsung",
    sov: {
      chatgpt: 31,
      perplexity: 28,
      gemini: 34,
      ai_overview: 29,
      ai_mode: 26,
    },
  },
  {
    brand: "Sony",
    sov: {
      chatgpt: 24,
      perplexity: 22,
      gemini: 26,
      ai_overview: 21,
      ai_mode: 23,
    },
  },
  {
    brand: "LG",
    sov: {
      chatgpt: 19,
      perplexity: 21,
      gemini: 18,
      ai_overview: 20,
      ai_mode: 22,
    },
  },
  {
    brand: "TCL",
    sov: {
      chatgpt: 13,
      perplexity: 15,
      gemini: 11,
      ai_overview: 14,
      ai_mode: 16,
    },
  },
  {
    brand: "Hisense",
    sov: {
      chatgpt: 9,
      perplexity: 10,
      gemini: 8,
      ai_overview: 11,
      ai_mode: 9,
    },
  },
  {
    brand: "Vizio",
    sov: {
      chatgpt: 4,
      perplexity: 4,
      gemini: 3,
      ai_overview: 5,
      ai_mode: 4,
    },
  },
];

export const MOCK_PROMPTS: BrandPrompts = {
  Samsung: {
    positive: [
      "best Samsung QLED TV for living room",
      "Samsung TV deals under $1000",
      "Samsung Neo QLED vs OLED which to buy",
      "Samsung Frame TV review 2024",
      "Samsung TV recommended picture settings",
      "is Samsung a good TV brand",
    ],
    neutral: [
      "Samsung TV model numbers explained",
      "how to update Samsung TV firmware",
      "Samsung TV input lag specs",
      "Samsung TV warranty coverage",
      "Samsung TV dimensions and weight",
    ],
    negative: [
      "Samsung TV screen flickering fix",
      "Samsung TV remote not working",
      "Samsung TV alternatives cheaper",
      "Samsung TV complaints customer service",
      "Samsung QLED vs competitors price",
      "why does Samsung TV lose WiFi connection",
      "Samsung TV overheating issues",
    ],
  },
  Sony: {
    positive: [
      "best Sony OLED TV 2024",
      "Sony Bravia XR worth the price",
      "Sony TV for home theater setup",
      "Sony A95L review buy or not",
      "Sony TV gaming mode latency",
    ],
    neutral: [
      "Sony TV vs Samsung comparison",
      "Sony Bravia lineup differences",
      "how to use Sony TV Google TV interface",
      "Sony TV picture modes explained",
      "Sony TV HDMI 2.1 ports list",
    ],
    negative: [
      "Sony TV too expensive alternatives",
      "Sony TV customer support issues",
      "Sony TV remote backlight not working",
      "Sony Bravia problems audio sync",
      "is Sony TV worth the premium over TCL",
      "Sony TV software update bugs",
    ],
  },
  LG: {
    positive: [
      "best LG OLED TV for movies",
      "LG C3 OLED review worth buying",
      "LG TV deals Black Friday",
      "LG evo panel brightness test",
      "LG OLED gaming features 2024",
    ],
    neutral: [
      "LG OLED vs QLED which is better",
      "LG TV webOS tutorial",
      "LG TV input lag measurements",
      "LG TV burn-in risk explained",
      "LG TV model year comparison",
    ],
    negative: [
      "LG OLED burn-in permanent fix",
      "LG TV customer service complaints",
      "LG TV vs Samsung which is cheaper",
      "LG TV panel lottery bad luck",
      "LG webOS slow performance fix",
      "LG TV out of warranty repair cost",
    ],
  },
  TCL: {
    positive: [
      "best budget TV TCL 2024",
      "TCL QM8 mini-LED review",
      "TCL TV best value under 500",
      "TCL vs Hisense which to buy",
      "TCL TV good for gaming budget",
    ],
    neutral: [
      "TCL TV model numbers guide",
      "TCL Google TV vs Roku TV",
      "TCL TV picture quality test",
      "TCL TV Dolby Vision support",
      "TCL TV size comparison chart",
    ],
    negative: [
      "TCL TV remote app issues",
      "TCL TV quality control complaints",
      "TCL vs Samsung is TCL worth it",
      "TCL TV backlight bleed problems",
      "TCL customer service bad experience",
    ],
  },
  Hisense: {
    positive: [
      "Hisense U8N best budget mini-LED",
      "Hisense TV value for money 2024",
      "Hisense TV 75 inch best deal",
      "Hisense ULED vs TCL QLED",
    ],
    neutral: [
      "Hisense TV picture settings guide",
      "Hisense TV VIDAA OS review",
      "Hisense TV warranty terms",
      "Hisense TV vs Vizio comparison",
    ],
    negative: [
      "Hisense TV reliability issues",
      "Hisense vs Samsung worth the savings",
      "Hisense customer support slow",
      "Hisense TV software update problems",
      "Hisense TV dead pixel complaint",
    ],
  },
  Vizio: {
    positive: [
      "Vizio TV best cheap option",
      "Vizio P-Series review worth buying",
      "Vizio TV good picture quality budget",
    ],
    neutral: [
      "Vizio SmartCast app how to use",
      "Vizio TV vs TCL comparison",
      "Vizio TV HDMI ARC setup",
    ],
    negative: [
      "Vizio TV ads on homescreen how to remove",
      "Vizio customer service problems",
      "Vizio TV privacy data collection",
      "Vizio TV failing after 2 years",
      "Vizio vs TCL which is less bad",
      "Vizio TV lawsuit settlement",
    ],
  },
};
