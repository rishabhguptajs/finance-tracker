"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { formatINR, formatMonthLabel, monthStartISO } from "@/lib/format";
import { CATEGORIES, type Budget, type Category, type CategoryBudget } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { revalidateBudget } from "@/lib/revalidate";
import Sheet from "./Sheet";
import { Button, Field, inputClass } from "./ui";

type CategoryLimits = Partial<Record<Category, string>>;

export default function SettingsModal({
  open,
  onClose,
  month = monthStartISO(),
}: {
  open: boolean;
  onClose: () => void;
  /** Which month's budgets to edit. Defaults to the current one. */
  month?: string;
}) {
  const [limit, setLimit] = useState("");
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimits>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useSWR<{ budget: Budget | null }>(
    open ? `/api/budget?month=${month}` : null
  );
  const { data: categoryData, isLoading: loadingCategories } = useSWR<{
    categoryBudgets: CategoryBudget[];
  }>(open ? `/api/budget/categories?month=${month}` : null);

  useEffect(() => {
    if (data) setLimit(data.budget ? String(data.budget.limit_amount) : "");
  }, [data]);

  useEffect(() => {
    if (!categoryData) return;
    const next: CategoryLimits = {};
    for (const row of categoryData.categoryBudgets) {
      next[row.category] = String(row.limit_amount);
    }
    setCategoryLimits(next);
  }, [categoryData]);

  if (!open) return null;

  const loading = isLoading || loadingCategories;
  const categoryTotal = CATEGORIES.reduce(
    (sum, c) => sum + (Number(categoryLimits[c]) || 0),
    0
  );
  const overall = Number(limit) || 0;
  const overAllocated = overall > 0 && categoryTotal > overall;

  async function handleSave() {
    const amount = Number(limit);
    const clearingOverall = limit.trim() === "";

    if (!clearingOverall && (!Number.isFinite(amount) || amount <= 0)) {
      setError("Enter a valid budget amount, or leave it blank for no overall limit");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const overallRequest = clearingOverall
        ? fetch(`/api/budget?month=${month}`, { method: "DELETE" })
        : fetch("/api/budget", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month, limit_amount: amount }),
          });

      const categoriesRequest = fetch("/api/budget/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          budgets: CATEGORIES.map((category) => ({
            category,
            limit_amount: Number(categoryLimits[category]) || 0,
          })),
        }),
      });

      const [overallRes, categoriesRes] = await Promise.all([
        overallRequest,
        categoriesRequest,
      ]);
      if (!overallRes.ok || !categoriesRes.ok) throw new Error();

      await revalidateBudget();
      onClose();
    } catch {
      setError("Failed to save budgets. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Budgets"
      description={`${formatMonthLabel(month)} — no rollover, each month starts fresh.`}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} full>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} full>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-2xl bg-subtle" />
          <div className="h-12 animate-pulse rounded-2xl bg-subtle" />
        </div>
      ) : (
        <>
          <Field label="Overall limit (₹)">
            <input
              type="number"
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="e.g. 30000 — blank for none"
              className={`${inputClass} tnum text-title font-semibold`}
            />
          </Field>

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-footnote font-medium text-muted">
                Per-category limits (₹)
              </span>
              <span className="tnum text-footnote text-faint">
                {categoryTotal > 0 ? formatINR(categoryTotal) : "none set"}
              </span>
            </div>
            <p className="mt-1 text-caption text-faint">
              Leave a category blank to keep it uncapped.
            </p>
            <div className="mt-2.5 divide-y divide-line">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center gap-2.5 py-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_STYLES[category].hex }}
                  />
                  <span className="flex-1 text-body text-ink">{category}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={categoryLimits[category] ?? ""}
                    onChange={(e) =>
                      setCategoryLimits({
                        ...categoryLimits,
                        [category]: e.target.value,
                      })
                    }
                    placeholder="—"
                    aria-label={`${category} limit`}
                    className="tnum min-h-[44px] w-28 rounded-xl border border-line bg-surface px-3 text-right text-body outline-none focus:border-line-strong"
                  />
                </div>
              ))}
            </div>
            {overAllocated && (
              <p className="mt-2.5 text-footnote text-warning">
                Category limits add up to {formatINR(categoryTotal)}, more than your{" "}
                {formatINR(overall)} overall limit.
              </p>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-3 text-subhead text-negative">{error}</p>}
    </Sheet>
  );
}
