import { NextRequest, NextResponse } from "next/server";
import { discoverBrand } from "@/lib/seranking";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

const API_KEY_RE = /^[A-Za-z0-9_\-]{10,200}$/;
const DOMAIN_RE  = /^[A-Za-z0-9][A-Za-z0-9\-\.]{1,100}\.[A-Za-z]{2,10}$/;

function validateApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return API_KEY_RE.test(t) ? t : null;
}

function validateDomain(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  return DOMAIN_RE.test(t) ? t : null;
}

function validateCountry(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  return SUPPORTED_COUNTRIES.some((c) => c.code === t) ? t : null;
}

function redactKey(message: string, key: string): string {
  return message.replaceAll(key, "[REDACTED]");
}

export async function POST(req: NextRequest) {
  let apiKey: string | null = null;
  try {
    const body  = await req.json().catch(() => ({}));
    apiKey      = validateApiKey(body.apiKey);
    const domain = validateDomain(body.domain);

    if (!domain) {
      return NextResponse.json({ error: "Invalid domain." }, { status: 400 });
    }

    // demo mode — return capitalised domain stem as brand
    if (!apiKey) {
      const brand = domain.split(".")[0].replace(/^(.)/, (c) => c.toUpperCase());
      return NextResponse.json({ demo: true, brand });
    }

    const country = validateCountry(body.country) ?? "us";
    const brand   = await discoverBrand(apiKey, domain, country.toLowerCase());
    return NextResponse.json({ demo: false, brand });
  } catch (err) {
    const raw     = err instanceof Error ? err.message : "Unknown error";
    const message = apiKey ? redactKey(raw, apiKey) : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
