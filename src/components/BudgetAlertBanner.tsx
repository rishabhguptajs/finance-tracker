"use client";

import { formatINR } from "@/lib/format";

export default function BudgetAlertBanner({
  spent,
  limit,
}: {
  spent: number;
  limit: number | null;
}) {
  if (limit === null || limit <= 0) return null;
  const pct = (spent / limit) * 100;
  if (pct < 80) return null;

  const over = pct >= 100;

  return (
    <div
      className={`animate-fade-in rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
        over ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200"
      }`}
    >
      {over
        ? `⚠️ Over budget by ${formatINR(spent - limit)}`
        : `You've used ${Math.round(pct)}% of this month's budget`}
    </div>
  );
}
