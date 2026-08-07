"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { formatINR, formatMonthLabel, monthStartISO } from "@/lib/format";
import { CATEGORIES, type Budget, type Category, type CategoryBudget } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { revalidateBudget } from "@/lib/revalidate";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-3xl bg-surface shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6">
          <h2 className="text-lg font-semibold">Budgets</h2>
          <p className="mt-1 text-sm text-muted">
            {formatMonthLabel(month)} — no rollover, each month starts fresh.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              <div className="h-11 animate-pulse rounded-xl bg-subtle" />
              <div className="h-11 animate-pulse rounded-xl bg-subtle" />
            </div>
          ) : (
            <>
              <label className="text-xs font-medium text-muted">
                Overall limit (₹)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="e.g. 30000 — blank for none"
                className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-lg font-medium outline-none focus:border-line-strong"
              />

              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-muted">
                    Per-category limits (₹)
                  </span>
                  <span className="text-xs text-faint">
                    {categoryTotal > 0 ? formatINR(categoryTotal) : "none set"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-faint">
                  Leave a category blank to keep it uncapped.
                </p>
                <div className="mt-2 space-y-1.5">
                  {CATEGORIES.map((category) => (
                    <div key={category} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: CATEGORY_STYLES[category].hex }}
                      />
                      <span className="flex-1 text-sm text-ink">{category}</span>
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
                        className="w-28 rounded-lg border border-line px-2.5 py-1.5 text-right text-sm outline-none focus:border-line-strong"
                      />
                    </div>
                  ))}
                </div>
                {overAllocated && (
                  <p className="mt-2 text-xs text-warning">
                    Category limits add up to {formatINR(categoryTotal)}, more than your{" "}
                    {formatINR(overall)} overall limit.
                  </p>
                )}
              </div>
            </>
          )}

          {error && <p className="mt-3 text-sm text-negative">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-2.5 font-medium text-muted hover:bg-subtle"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 rounded-xl bg-accent py-2.5 font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
