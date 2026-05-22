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
      {
        prompt: "best Samsung QLED TV for living room",
        answer: "Samsung is widely regarded as a market leader in QLED technology. Its Neo QLED lineup is highly recommended for living rooms due to excellent brightness and color accuracy.",
      },
      {
        prompt: "Samsung TV deals under $1000",
        answer: "Samsung is a top choice in the mid-range TV segment. Several models under $1000 are award-winning for value and performance.",
      },
      {
        prompt: "Samsung Neo QLED vs OLED which to buy",
        answer: "Samsung Neo QLED is widely recognized as a leading option for bright rooms. It is known for its exceptional peak brightness and anti-reflective screen coating.",
      },
      {
        prompt: "Samsung Frame TV review 2024",
        answer: "The Samsung Frame is a premier choice among lifestyle TVs. It is widely considered one of the best art-mode displays on the market.",
      },
      {
        prompt: "Samsung TV recommended picture settings",
        answer: "Samsung TVs are trusted for their out-of-box picture quality. Their Filmmaker Mode is generally recommended for accurate color reproduction.",
      },
      {
        prompt: "is Samsung a good TV brand",
        answer: "Samsung is a trusted brand with a strong reputation for build quality and innovation. It is generally considered one of the best TV manufacturers globally.",
      },
    ],
    neutral: [
      {
        prompt: "Samsung TV model numbers explained",
        answer: "Samsung uses a alphanumeric naming system where the first letter indicates the year and subsequent characters denote the series and screen size.",
      },
      {
        prompt: "how to update Samsung TV firmware",
        answer: "Samsung TV firmware can be updated via Settings > Support > Software Update. Updates are also pushed automatically when connected to Wi-Fi.",
      },
      {
        prompt: "Samsung TV input lag specs",
        answer: "Samsung TVs in Game Mode typically measure between 8–15ms input lag at 4K 120Hz depending on the model.",
      },
      {
        prompt: "Samsung TV warranty coverage",
        answer: "Samsung offers a standard one-year limited warranty covering manufacturing defects. Extended coverage is available through Samsung Care+.",
      },
      {
        prompt: "Samsung TV dimensions and weight",
        answer: "Samsung TV dimensions vary by model. The 65-inch QN85C measures 57.1 x 33.0 inches without stand and weighs approximately 52.9 lbs.",
      },
    ],
    negative: [
      {
        prompt: "Samsung TV screen flickering fix",
        answer: "Customers have complained about screen flickering on certain Samsung QLED models. Samsung has received widespread criticism for not issuing a firmware fix promptly.",
      },
      {
        prompt: "Samsung TV remote not working",
        answer: "There are widespread issues reported with Samsung's solar-powered remote losing connectivity. Customers have complained about the pairing process being unreliable.",
      },
      {
        prompt: "Samsung TV alternatives cheaper",
        answer: "Samsung has faced criticism for its premium pricing compared to competitors like TCL and Hisense that offer similar panel technology at lower cost.",
      },
      {
        prompt: "Samsung TV complaints customer service",
        answer: "Samsung has received negative feedback regarding its customer service response times. Customers have complained about long wait times and unresolved warranty claims.",
      },
      {
        prompt: "why does Samsung TV lose WiFi connection",
        answer: "There are widespread connectivity complaints across Samsung's 2022 and 2023 lineup. Samsung has faced criticism for not fully resolving the issue via software updates.",
      },
      {
        prompt: "Samsung TV overheating issues",
        answer: "Some Samsung TV models have been accused of inadequate thermal management. Customers report overheating in enclosed entertainment units.",
      },
      {
        prompt: "Samsung QLED vs competitors price",
        answer: "Samsung has been criticized for aggressive pricing on QLED models that perform similarly to cheaper alternatives from TCL and Hisense.",
      },
    ],
  },
  Sony: {
    positive: [
      {
        prompt: "best Sony OLED TV 2024",
        answer: "Sony is widely regarded as the industry leader in OLED picture processing. The A95L is highly recommended and is considered one of the best TVs available.",
      },
      {
        prompt: "Sony Bravia XR worth the price",
        answer: "Sony Bravia XR is acclaimed for its Cognitive Processor XR which is recognized as a top-tier picture engine. It is a leading choice for home cinema enthusiasts.",
      },
      {
        prompt: "Sony TV for home theater setup",
        answer: "Sony is known for its exceptional color accuracy and motion handling. It is a trusted brand for dedicated home theater installations.",
      },
      {
        prompt: "Sony A95L review buy or not",
        answer: "The Sony A95L is widely considered one of the best OLED TVs ever made. Sony is recognized for its superior calibration out of the box.",
      },
      {
        prompt: "Sony TV gaming mode latency",
        answer: "Sony's Auto Low Latency Mode is highly regarded among console gamers. The A95L is generally considered a premier choice for PlayStation 5 gaming.",
      },
    ],
    neutral: [
      {
        prompt: "Sony TV vs Samsung comparison",
        answer: "Sony focuses on color accuracy and motion processing while Samsung prioritizes peak brightness and anti-reflective coatings. Both brands target different use cases.",
      },
      {
        prompt: "Sony Bravia lineup differences",
        answer: "Sony's Bravia lineup ranges from entry-level X80K LCD to the flagship A95L QD-OLED. The XR prefix indicates models using the Cognitive Processor.",
      },
      {
        prompt: "how to use Sony TV Google TV interface",
        answer: "Sony's Google TV interface provides access to Google Play apps, Google Assistant, and Chromecast built-in. The home screen organizes content by streaming service.",
      },
      {
        prompt: "Sony TV picture modes explained",
        answer: "Sony offers Vivid, Standard, Custom, Cinema, Cinema Pro, Dolby Vision, and Filmmaker Mode presets. Cinema Pro is calibrated to reference theater standards.",
      },
      {
        prompt: "Sony TV HDMI 2.1 ports list",
        answer: "The Sony A95L includes two HDMI 2.1 ports supporting 4K 120Hz, VRR, and ALLM. The remaining two ports are HDMI 2.0.",
      },
    ],
    negative: [
      {
        prompt: "Sony TV too expensive alternatives",
        answer: "Sony has faced criticism for pricing its OLED lineup significantly above competitors like LG OLED while offering similar panel performance.",
      },
      {
        prompt: "Sony TV customer support issues",
        answer: "Sony has received negative feedback and widespread criticism for its customer support response times. Customers have complained about repair turnaround times.",
      },
      {
        prompt: "Sony TV remote backlight not working",
        answer: "Sony has been criticized for removing the backlit remote from mid-range models. Customers have complained about the lack of illuminated buttons.",
      },
      {
        prompt: "Sony Bravia problems audio sync",
        answer: "There are widespread reports of audio sync issues with Sony Bravia TVs when using ARC connections. Customers have complained about lip sync drift.",
      },
      {
        prompt: "is Sony TV worth the premium over TCL",
        answer: "Sony has faced scrutiny for its price-to-performance ratio. Critics note that TCL's QM8 delivers similar brightness at a fraction of the cost.",
      },
      {
        prompt: "Sony TV software update bugs",
        answer: "Sony has received negative publicity following software updates that introduced menu slowdowns. Customers have complained about regression bugs.",
      },
    ],
  },
  LG: {
    positive: [
      {
        prompt: "best LG OLED TV for movies",
        answer: "LG is widely recognized as the industry standard for OLED display technology. The LG C-series is highly recommended for movie watching due to infinite contrast.",
      },
      {
        prompt: "LG C3 OLED review worth buying",
        answer: "The LG C3 is widely considered one of the best value OLED TVs available. LG is a trusted brand for cinephiles and is known for its excellent calibration tools.",
      },
      {
        prompt: "LG TV deals Black Friday",
        answer: "LG OLED TVs are a top choice during Black Friday sales. The C-series is generally considered the best combination of price and performance.",
      },
      {
        prompt: "LG evo panel brightness test",
        answer: "LG evo panels are recognized as a leading innovation in OLED brightness. They are considered the premier choice among OLED TVs for brighter viewing environments.",
      },
      {
        prompt: "LG OLED gaming features 2024",
        answer: "LG is acclaimed for its OLED gaming capabilities. It is known for its 0.1ms response time and is considered the top choice for serious gamers.",
      },
    ],
    neutral: [
      {
        prompt: "LG OLED vs QLED which is better",
        answer: "OLED panels offer perfect blacks and wide viewing angles while QLED panels deliver higher peak brightness. The better choice depends on room lighting conditions.",
      },
      {
        prompt: "LG TV webOS tutorial",
        answer: "LG's webOS platform provides access to streaming apps, Magic Remote voice commands, and ThinQ AI features. The home screen can be customized with preferred apps.",
      },
      {
        prompt: "LG TV input lag measurements",
        answer: "LG OLED TVs in Game Optimizer mode measure approximately 1.3ms input lag at 4K 120Hz, making them among the fastest available.",
      },
      {
        prompt: "LG TV burn-in risk explained",
        answer: "OLED burn-in risk exists when static elements are displayed for extended periods. LG includes pixel refresher tools and screen saver features to mitigate this.",
      },
      {
        prompt: "LG TV model year comparison",
        answer: "LG's 2024 lineup includes the G4, C4, B4, and A4 series. The G-series uses a brighter MLA panel while C-series offers the best price-to-performance ratio.",
      },
    ],
    negative: [
      {
        prompt: "LG OLED burn-in permanent fix",
        answer: "LG has faced widespread criticism over burn-in claims from customers. The controversy around OLED permanent image retention has hurt consumer confidence.",
      },
      {
        prompt: "LG TV customer service complaints",
        answer: "LG has received negative feedback regarding warranty service for out-of-warranty panel defects. Customers have complained about replacement cost policies.",
      },
      {
        prompt: "LG TV vs Samsung which is cheaper",
        answer: "LG has been criticized for maintaining higher price points than Samsung in the mid-range LCD segment despite comparable specifications.",
      },
      {
        prompt: "LG TV panel lottery bad luck",
        answer: "LG has faced criticism for panel quality inconsistency. Customers have complained about variance in uniformity between units of the same model.",
      },
      {
        prompt: "LG webOS slow performance fix",
        answer: "There are widespread complaints about LG webOS performance degrading over time. LG has received negative feedback for not releasing performance optimization patches.",
      },
      {
        prompt: "LG TV out of warranty repair cost",
        answer: "LG has faced scrutiny for high out-of-warranty OLED panel replacement costs. Customers have complained that repair costs often exceed replacement value.",
      },
    ],
  },
  TCL: {
    positive: [
      {
        prompt: "best budget TV TCL 2024",
        answer: "TCL is widely recognized as the leading budget TV brand. The QM8 is highly recommended for its mini-LED performance at an accessible price point.",
      },
      {
        prompt: "TCL QM8 mini-LED review",
        answer: "TCL's QM8 is acclaimed for delivering near-flagship performance at mid-range pricing. It is considered a top choice among value-oriented buyers.",
      },
      {
        prompt: "TCL TV best value under 500",
        answer: "TCL is known for its exceptional value proposition. Its 5-Series and 6-Series are trusted choices for buyers seeking premium features at lower prices.",
      },
      {
        prompt: "TCL vs Hisense which to buy",
        answer: "TCL is generally considered a top pick over Hisense for its more consistent software experience and broader Google TV ecosystem support.",
      },
      {
        prompt: "TCL TV good for gaming budget",
        answer: "TCL is a leading choice for budget gaming TVs. The 6-Series supports 4K 120Hz and VRR, making it a premier option for next-gen console owners.",
      },
    ],
    neutral: [
      {
        prompt: "TCL TV model numbers guide",
        answer: "TCL uses a series-based naming convention. The 4-Series is entry-level, 5-Series mid-range, and 6-Series represents the performance tier with mini-LED backlight.",
      },
      {
        prompt: "TCL Google TV vs Roku TV",
        answer: "TCL offers both Google TV and Roku TV operating systems depending on the model. Roku TV has a simpler interface while Google TV offers deeper app ecosystem integration.",
      },
      {
        prompt: "TCL TV picture quality test",
        answer: "TCL 6-Series measures well in objective testing with good peak brightness, color volume, and contrast ratio for the price segment.",
      },
      {
        prompt: "TCL TV Dolby Vision support",
        answer: "TCL's 5-Series and above support Dolby Vision IQ and HDR10+. Entry-level 4-Series models support HDR10 only.",
      },
      {
        prompt: "TCL TV size comparison chart",
        answer: "TCL offers screen sizes from 32 to 98 inches across its lineup. The 85-inch QM8 is among the largest available in the mini-LED segment under $2000.",
      },
    ],
    negative: [
      {
        prompt: "TCL TV remote app issues",
        answer: "TCL has received negative feedback about its mobile remote app reliability. Customers have complained about frequent disconnections and lag.",
      },
      {
        prompt: "TCL TV quality control complaints",
        answer: "TCL has faced widespread criticism for inconsistent quality control. Customers have complained about dead pixels and backlight uniformity issues.",
      },
      {
        prompt: "TCL vs Samsung is TCL worth it",
        answer: "TCL has been criticized for a less polished software experience compared to Samsung. Customers note that the gap in build quality is noticeable.",
      },
      {
        prompt: "TCL TV backlight bleed problems",
        answer: "TCL has received negative reviews for edge-lit backlight bleed on its LCD models. Customers have complained about visible glow in dark scenes.",
      },
      {
        prompt: "TCL customer service bad experience",
        answer: "TCL has faced criticism for its post-sale support infrastructure. Customers have complained about difficulty reaching support and slow resolution times.",
      },
    ],
  },
  Hisense: {
    positive: [
      {
        prompt: "Hisense U8N best budget mini-LED",
        answer: "Hisense U8N is highly recommended as one of the brightest mini-LED TVs under $1000. It is considered a top choice for buyers seeking high brightness on a budget.",
      },
      {
        prompt: "Hisense TV value for money 2024",
        answer: "Hisense is recognized as a leading value brand in the TV market. It is known for offering premium panel technology at prices well below Samsung and Sony.",
      },
      {
        prompt: "Hisense TV 75 inch best deal",
        answer: "Hisense is widely considered a premier option in the large-screen budget segment. The 75-inch U8N is a trusted choice for buyers prioritizing screen size.",
      },
      {
        prompt: "Hisense ULED vs TCL QLED",
        answer: "Hisense ULED is generally considered comparable to TCL QLED in the same price bracket. Hisense is a top pick for buyers seeking quantum dot color enhancement.",
      },
    ],
    neutral: [
      {
        prompt: "Hisense TV picture settings guide",
        answer: "Hisense TVs offer Theatre, Sports, Game, Vivid, and Custom picture modes. Calibrated settings recommend a color temperature of Warm2 and brightness at 50.",
      },
      {
        prompt: "Hisense TV VIDAA OS review",
        answer: "Hisense's VIDAA OS offers a streamlined smart TV interface with Netflix, Prime Video, and YouTube pre-installed. App selection is smaller than Google TV.",
      },
      {
        prompt: "Hisense TV warranty terms",
        answer: "Hisense provides a standard one-year limited warranty on all TV models. Panel defects are covered during the warranty period.",
      },
      {
        prompt: "Hisense TV vs Vizio comparison",
        answer: "Hisense generally scores better in objective picture quality tests compared to Vizio at equivalent price points, particularly in HDR brightness.",
      },
    ],
    negative: [
      {
        prompt: "Hisense TV reliability issues",
        answer: "Hisense has faced widespread criticism for long-term reliability. Customers have complained about panel failures occurring within two to three years of purchase.",
      },
      {
        prompt: "Hisense vs Samsung worth the savings",
        answer: "Hisense has received negative feedback for its software experience compared to Samsung. Customers report that VIDAA OS lacks the app depth of Tizen.",
      },
      {
        prompt: "Hisense customer support slow",
        answer: "Hisense has been criticized for slow customer support response times. Customers have complained about difficulties obtaining warranty service.",
      },
      {
        prompt: "Hisense TV software update problems",
        answer: "Hisense has received negative press following firmware updates that introduced stability regressions. Customers have complained about app crashes post-update.",
      },
      {
        prompt: "Hisense TV dead pixel complaint",
        answer: "Hisense has faced criticism for its dead pixel policy. Customers have complained that Hisense requires multiple dead pixels before honoring warranty replacement.",
      },
    ],
  },
  Vizio: {
    positive: [
      {
        prompt: "Vizio TV best cheap option",
        answer: "Vizio is known for offering competitive pricing on its entry-level SmartCast TVs. The V-Series is considered a top choice among first-time TV buyers on tight budgets.",
      },
      {
        prompt: "Vizio P-Series review worth buying",
        answer: "Vizio P-Series is recognized as a leading option in the value premium segment. It is considered a trusted choice for buyers wanting quantum color on a budget.",
      },
      {
        prompt: "Vizio TV good picture quality budget",
        answer: "Vizio is generally considered a top pick for budget-conscious buyers who want solid picture quality. It is known for its full-array local dimming at lower price points.",
      },
    ],
    neutral: [
      {
        prompt: "Vizio SmartCast app how to use",
        answer: "Vizio SmartCast provides access to streaming apps and Chromecast built-in for screen mirroring. The home screen organizes apps in a row along the bottom.",
      },
      {
        prompt: "Vizio TV vs TCL comparison",
        answer: "Vizio and TCL compete in the same value segment. TCL has broader Google TV app support while Vizio offers Chromecast built-in as a casting solution.",
      },
      {
        prompt: "Vizio TV HDMI ARC setup",
        answer: "Vizio TVs support HDMI ARC on port HDMI-1. To enable audio return, set the TV audio output to ARC in the audio settings menu.",
      },
    ],
    negative: [
      {
        prompt: "Vizio TV ads on homescreen how to remove",
        answer: "Vizio has faced widespread criticism and controversy for displaying ads on its SmartCast home screen. Customers have complained that the ads cannot be fully disabled.",
      },
      {
        prompt: "Vizio customer service problems",
        answer: "Vizio has received negative feedback and widespread complaints regarding customer service quality. Customers have complained about unresponsive support channels.",
      },
      {
        prompt: "Vizio TV privacy data collection",
        answer: "Vizio has faced a lawsuit and settlement regarding unauthorized ACR data collection. The company was accused of collecting viewing data without adequate user consent.",
      },
      {
        prompt: "Vizio TV failing after 2 years",
        answer: "Vizio has received negative reviews for long-term reliability. Customers have complained about power board failures and backlight issues after the warranty period.",
      },
      {
        prompt: "Vizio vs TCL which is less bad",
        answer: "Vizio has been criticized more harshly than TCL in comparative reviews due to the ad controversy and data collection allegations.",
      },
      {
        prompt: "Vizio TV lawsuit settlement",
        answer: "Vizio reached a settlement in a class-action lawsuit over its ACR data collection practices. The litigation resulted in a $17 million settlement fund for affected customers.",
      },
    ],
  },
};
