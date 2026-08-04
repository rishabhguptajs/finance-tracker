"use client";

import { formatINR } from "@/lib/format";

export default function BudgetBar({
  spent,
  limit,
}: {
  spent: number;
  limit: number | null;
}) {
  if (limit === null) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
        No budget set for this month.{" "}
        <span className="font-medium text-neutral-700">Set one in ⚙️ settings.</span>
      </div>
    );
  }

  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const rawPct = limit > 0 ? (spent / limit) * 100 : 0;

  const color =
    rawPct >= 100 ? "bg-red-500" : rawPct >= 70 ? "bg-yellow-400" : "bg-green-500";

  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">
          {formatINR(spent)} <span className="text-neutral-400">of {formatINR(limit)}</span>
        </span>
        <span
          className={`font-semibold ${
            rawPct >= 100 ? "text-red-600" : rawPct >= 70 ? "text-yellow-600" : "text-green-600"
          }`}
        >
          {Math.round(rawPct)}%
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
