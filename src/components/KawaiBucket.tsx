"use client";

type BucketType = "positive" | "neutral" | "negative";

interface KawaiBucketProps {
  type: BucketType;
  label?: string;
  count?: number;
  pct?: number;
  className?: string;
}

const CFG = {
  positive: { fill: "#D4EDE0", stroke: "#2E7A50", face: "#2E7A50", label: "Positive" },
  neutral:  { fill: "#DDD8EF", stroke: "#6B5FA8", face: "#6B5FA8", label: "Neutral"  },
  negative: { fill: "#EDCECE", stroke: "#A03030", face: "#A03030", label: "Negative" },
};

export default function KawaiBucket({ type, count, pct, className = "" }: KawaiBucketProps) {
  const c = CFG[type];
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <svg width="60" height="64" viewBox="0 0 60 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* handle */}
        <path d="M19 11 C19 4 41 4 41 11" stroke={c.stroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* body */}
        <path d="M9 20 L13 56 C13 58 47 58 47 56 L51 20 Z" fill={c.fill} stroke={c.stroke} strokeWidth="2.5" strokeLinejoin="round" />
        {/* rim */}
        <rect x="7" y="15" width="46" height="7" rx="3.5" fill={c.fill} stroke={c.stroke} strokeWidth="2.5" />
        {/* face */}
        {type === "positive" && <>
          <path d="M22 33 C22 30 27 30 27 33" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M33 33 C33 30 38 30 38 33" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M23 40 C26 44 34 44 37 40" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>}
        {type === "neutral" && <>
          <circle cx="24" cy="33" r="1.8" fill={c.face} />
          <circle cx="36" cy="33" r="1.8" fill={c.face} />
          <line x1="24" y1="41" x2="36" y2="41" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" />
        </>}
        {type === "negative" && <>
          <line x1="21" y1="30" x2="27" y2="35" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="27" y1="30" x2="21" y2="35" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="33" y1="30" x2="39" y2="35" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="39" y1="30" x2="33" y2="35" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M23 43 C26 39 34 39 37 43" stroke={c.face} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>}
      </svg>
      <span className="text-xs uppercase tracking-widest font-medium" style={{ color: c.stroke }}>
        {c.label}
      </span>
      {count !== undefined && (
        <span className="text-xl font-semibold" style={{ color: c.stroke }}>{count}</span>
      )}
      {pct !== undefined && (
        <span className="text-sm" style={{ color: c.stroke }}>{pct}%</span>
      )}
    </div>
  );
}
