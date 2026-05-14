// Countries where Google AI Overview and/or AI Mode are available.
// AI Overview launched in the US (May 2024), then rolled out to these markets.
// AI Mode (Labs) is currently US-only. Keeping the full list so the selector
// covers wherever SE Ranking has coverage — the API will return what it has.
export const SUPPORTED_COUNTRIES = [
  { code: "US", label: "United States"  },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia"      },
  { code: "CA", label: "Canada"         },
  { code: "IN", label: "India"          },
  { code: "JP", label: "Japan"          },
  { code: "DE", label: "Germany"        },
  { code: "FR", label: "France"         },
  { code: "BR", label: "Brazil"         },
  { code: "MX", label: "Mexico"         },
  { code: "ID", label: "Indonesia"      },
  { code: "NG", label: "Nigeria"        },
  { code: "KE", label: "Kenya"          },
  { code: "ZA", label: "South Africa"   },
] as const;

export type CountryCode = typeof SUPPORTED_COUNTRIES[number]["code"];
