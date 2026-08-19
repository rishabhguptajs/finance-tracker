"use client";

import type { Category } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { formatINR } from "@/lib/format";

export interface CategoryBudgetProgress {
  category: Category;
  spent: number;
  limit: number;
}

export default function CategoryBudgetBars({
  progress,
  onSelect,
}: {
  progress: CategoryBudgetProgress[];
  onSelect?: (category: Category) => void;
}) {
  if (progress.length === 0) {
    return (
      <p className="py-8 text-center text-subhead text-faint">
        No category limits set for this month. Add them in settings to track them here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {progress.map(({ category, spent, limit }) => {
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        const over = pct >= 100;
        const style = CATEGORY_STYLES[category];

        return (
          <button
            key={category}
            onClick={() => onSelect?.(category)}
            className="press press-subtle block w-full rounded-xl py-1 text-left"
          >
            <div className="flex items-baseline justify-between text-subhead">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: style.hex }}
                />
                {category}
              </span>
              <span className={`tnum ${over ? "font-semibold text-negative" : "text-muted"}`}>
                {formatINR(spent)}{" "}
                <span className="text-faint">of {formatINR(limit)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: over ? "#ef4444" : style.hex,
                }}
              />
            </div>
            {over && (
              <p className="tnum mt-1 text-footnote font-medium text-negative">
                Over by {formatINR(spent - limit)}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
