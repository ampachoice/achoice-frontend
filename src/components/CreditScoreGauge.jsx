import { useState } from "react";

/**
 * OPay/Carbon-style circular credit score gauge.
 *
 * Props:
 *  - score: number (0-100)
 *  - minimumToBorrow: number (0-100) — used for the "min to borrow" tick + copy
 *  - canBorrow: bool
 *  - components: object | undefined — raw breakdown from GET /loans/credit-score,
 *    rendered as an expandable list if present. Shape isn't assumed beyond
 *    "an object of label -> value/detail", so it degrades gracefully if the
 *    backend adds/removes fields.
 *  - compact: bool — smaller inline badge instead of the full card (used on
 *    LoansListPage where space is tighter).
 */
export default function CreditScoreGauge({
  score = 0,
  minimumToBorrow,
  canBorrow,
  components,
  compact = false,
}) {
  const [expanded, setExpanded] = useState(false);

  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const band =
    clamped >= 80
      ? { color: "#1a7a3a", bg: "#eafaf0", label: "Good" }
      : clamped >= 50
        ? { color: "#b36b00", bg: "#fff8e7", label: "Fair" }
        : { color: "#cc0000", bg: "#fdecec", label: "Poor" };

  const radius = compact ? 26 : 52;
  const stroke = compact ? 6 : 10;
  const size = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  const componentEntries =
    components && typeof components === "object"
      ? Object.entries(components)
      : [];

  const formatComponentValue = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") {
      // e.g. { value: 20, max: 25 } or { score: 20, weight: 25 }
      const parts = Object.entries(val)
        .filter(([k]) => k !== "label")
        .map(([k, v]) => `${k}: ${v}`);
      return parts.join(" · ");
    }
    return String(val);
  };

  const formatComponentLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (compact) {
    return (
      <div style={s.compactWrap}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e8e4dc"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <text
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 13, fontWeight: 800, fill: "#111" }}
          >
            {clamped}
          </text>
        </svg>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111" }}>
            Credit score:{" "}
            <span style={{ color: band.color }}>{clamped}%</span>
          </div>
          {!canBorrow && minimumToBorrow != null && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
              Min {minimumToBorrow}% needed to borrow
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <div style={s.title}>Your Credit Score</div>

      <div style={s.ringWrap}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f0ede6"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div style={s.ringCenter}>
          <div style={{ ...s.ringScore, color: band.color }}>{clamped}</div>
          <div style={s.ringMax}>/ 100</div>
        </div>
      </div>

      <div style={{ ...s.bandPill, background: band.bg, color: band.color }}>
        {band.label}
      </div>

      {minimumToBorrow != null && (
        <div style={s.minRow}>
          {canBorrow
            ? "You meet the minimum score to borrow."
            : `Minimum of ${minimumToBorrow}% required to borrow.`}
        </div>
      )}

      {componentEntries.length > 0 && (
        <>
          <button
            type="button"
            style={s.expandBtn}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide breakdown ▲" : "See breakdown ▼"}
          </button>
          {expanded && (
            <div style={s.breakdown}>
              {componentEntries.map(([key, val]) => (
                <div key={key} style={s.breakdownRow}>
                  <span style={s.breakdownLabel}>
                    {formatComponentLabel(key)}
                  </span>
                  <span style={s.breakdownValue}>
                    {formatComponentValue(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  card: {
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 12,
    padding: 22,
    textAlign: "center",
  },
  title: { fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 14 },
  ringWrap: { position: "relative", display: "inline-block" },
  ringCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  ringScore: { fontSize: 24, fontWeight: 800 },
  ringMax: { fontSize: 11, color: "#aaa" },
  bandPill: {
    display: "inline-block",
    marginTop: 12,
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 12px",
    borderRadius: 20,
  },
  minRow: { fontSize: 12, color: "#666", marginTop: 12, lineHeight: 1.5 },
  expandBtn: {
    marginTop: 14,
    background: "none",
    border: "none",
    color: "#1f4d1f",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  },
  breakdown: { marginTop: 12, textAlign: "left" },
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 0",
    borderTop: "1px solid #f2f0ec",
    fontSize: 12.5,
  },
  breakdownLabel: { color: "#888" },
  breakdownValue: { color: "#111", fontWeight: 600, textAlign: "right" },
  compactWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: "1px solid #e8e4dc",
    borderRadius: 10,
    padding: "10px 14px",
  },
};