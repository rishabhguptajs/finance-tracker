"use client";

import { formatINR } from "@/lib/format";

const TONES = {
  over: { bar: "bg-negative", text: "text-negative" },
  near: { bar: "bg-warning", text: "text-warning" },
  ok: { bar: "bg-positive", text: "text-positive" },
} as const;

export default function BudgetBar({
  spent,
  limit,
  /** "plain" drops the card chrome, for when this already sits inside a card. */
  variant = "card",
}: {
  spent: number;
  limit: number | null;
  variant?: "card" | "plain";
}) {
  const shell =
    variant === "card"
      ? "rounded-3xl border border-line bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
      : "";

  if (limit === null) {
    return (
      <div
        className={
          variant === "card"
            ? "rounded-3xl border border-dashed border-line-strong px-4 py-3.5 text-subhead text-muted"
            : "text-subhead text-muted"
        }
      >
        No budget set for this month.{" "}
        <span className="font-medium text-ink">Set one in settings.</span>
      </div>
    );
  }

  const rawPct = limit > 0 ? (spent / limit) * 100 : 0;
  const tone = TONES[rawPct >= 100 ? "over" : rawPct >= 70 ? "near" : "ok"];

  return (
    <div className={shell}>
      <div className="tnum flex items-center justify-between text-subhead">
        <span className="font-medium text-ink">
          {formatINR(spent)} <span className="text-faint">of {formatINR(limit)}</span>
        </span>
        <span className={`font-semibold ${tone.text}`}>{Math.round(rawPct)}%</span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-valuenow={Math.round(rawPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget used"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
          style={{ width: `${Math.min(rawPct, 100)}%` }}
        />
      </div>
    </div>
  );
}
