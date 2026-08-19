"use client";

import { formatINR } from "@/lib/format";
import { AlertIcon } from "./icons";

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
      className={`animate-fade-in flex items-center gap-2.5 rounded-2xl px-4 py-3 text-subhead font-medium ${
        over ? "bg-negative-soft text-negative" : "bg-warning-soft text-warning"
      }`}
      role="status"
    >
      <AlertIcon className="h-[18px] w-[18px] shrink-0" />
      <span className="tnum">
        {over
          ? `Over budget by ${formatINR(spent - limit)}`
          : `You've used ${Math.round(pct)}% of this month's budget`}
      </span>
    </div>
  );
}
