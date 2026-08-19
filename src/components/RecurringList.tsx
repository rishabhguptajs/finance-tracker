"use client";

import type { RecurringItem } from "@/lib/recurring";
import { CATEGORY_STYLES } from "@/lib/categories";
import { formatDateDDMMYYYY, formatINR } from "@/lib/format";

const STATUS_LABEL: Record<RecurringItem["status"], { text: string; className: string }> = {
  "due-soon": { text: "Due soon", className: "bg-warning-soft text-warning" },
  overdue: { text: "Not charged", className: "bg-subtle-strong text-muted" },
  active: { text: "", className: "" },
};

export default function RecurringList({ items }: { items: RecurringItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-subhead text-faint">
        Nothing repeating yet. Once the same name is charged in three separate months, it shows up
        here.
      </p>
    );
  }

  return (
    <div className="divide-y divide-line">
      {items.map((item) => {
        const status = STATUS_LABEL[item.status];

        return (
          <div key={item.key} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_STYLES[item.category].hex }}
                />
                <span className="truncate text-body font-medium text-ink">{item.merchant}</span>
                {status.text && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status.className}`}
                  >
                    {status.text}
                  </span>
                )}
                {item.confidence === "likely" && (
                  <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                    Maybe
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-footnote text-faint">
                {item.cadence === "monthly" ? "Monthly" : "Yearly"} ·{" "}
                {item.status === "overdue"
                  ? `last seen ${formatDateDDMMYYYY(item.lastSeen)}`
                  : `next ~${formatDateDDMMYYYY(item.expectedNext)}`}
              </p>
              {item.priceChange && (
                <p
                  className={`tnum mt-0.5 text-footnote font-medium ${
                    item.priceChange.pct > 0 ? "text-negative" : "text-positive"
                  }`}
                >
                  {item.priceChange.pct > 0 ? "↑" : "↓"} {formatINR(item.priceChange.from)} →{" "}
                  {formatINR(item.priceChange.to)}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <div className="tnum text-body font-semibold text-ink">
                {formatINR(item.typicalAmount)}
              </div>
              {item.cadence === "yearly" && (
                <div className="tnum text-footnote text-faint">
                  {formatINR(item.monthlyEquivalent)}/mo
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
