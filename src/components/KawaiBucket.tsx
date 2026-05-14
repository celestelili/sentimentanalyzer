"use client";

type BucketType = "positive" | "neutral" | "negative";

interface KawaiBucketProps {
  type: BucketType;
  count: number;
  className?: string;
}

const BUCKET_CONFIG = {
  positive: {
    fill: "#D4EDDA",
    stroke: "#4A7C59",
    face: "#4A7C59",
    label: "Positive",
    emoji: "˶ᵔ ᵕ ᵔ˶",
  },
  neutral: {
    fill: "#E9ECEF",
    stroke: "#6B7280",
    face: "#6B7280",
    label: "Neutral",
    emoji: "( ._. )",
  },
  negative: {
    fill: "#F8D7DA",
    stroke: "#9B3A3A",
    face: "#9B3A3A",
    label: "Negative",
    emoji: "(╥_╥)",
  },
};

export default function KawaiBucket({ type, count, className = "" }: KawaiBucketProps) {
  const cfg = BUCKET_CONFIG[type];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        width="56"
        height="60"
        viewBox="0 0 56 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`${cfg.label} bucket`}
      >
        {/* bucket handle */}
        <path
          d="M18 10 C18 4 38 4 38 10"
          stroke={cfg.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* bucket body */}
        <path
          d="M8 18 L12 52 C12 54 44 54 44 52 L48 18 Z"
          fill={cfg.fill}
          stroke={cfg.stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* bucket rim */}
        <rect
          x="6"
          y="14"
          width="44"
          height="6"
          rx="3"
          fill={cfg.fill}
          stroke={cfg.stroke}
          strokeWidth="2.5"
        />
        {/* face — eyes */}
        {type === "positive" && (
          <>
            <path d="M21 32 C21 29 25 29 25 32" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M31 32 C31 29 35 29 35 32" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M22 38 C24 41 32 41 34 38" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
        {type === "neutral" && (
          <>
            <circle cx="22" cy="31" r="1.5" fill={cfg.face} />
            <circle cx="34" cy="31" r="1.5" fill={cfg.face} />
            <line x1="22" y1="38" x2="34" y2="38" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
        {type === "negative" && (
          <>
            <line x1="20" y1="29" x2="26" y2="33" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="26" y1="29" x2="20" y2="33" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="30" y1="29" x2="36" y2="33" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="36" y1="29" x2="30" y2="33" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M22 41 C24 38 32 38 34 41" stroke={cfg.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
      </svg>
      <span
        className="font-mono text-xs font-semibold tracking-wide uppercase"
        style={{ color: cfg.stroke }}
      >
        {cfg.label}
      </span>
      <span
        className="font-mono text-2xl font-bold"
        style={{ color: cfg.stroke }}
      >
        {count}
      </span>
      <span className="font-mono text-xs" style={{ color: cfg.stroke }}>
        {count === 1 ? "query" : "queries"}
      </span>
    </div>
  );
}
