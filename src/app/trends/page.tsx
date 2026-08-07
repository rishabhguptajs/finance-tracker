"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { Category, Expense, Income } from "@/lib/types";
import { CATEGORY_STACK_ORDER, CATEGORY_STYLES } from "@/lib/categories";
import { formatINR, formatMonthLabel, formatMonthShort, monthRange } from "@/lib/format";
import MonthlyFlowChart, { type FlowPoint } from "@/components/MonthlyFlowChart";
import CategoryTrendChart, {
  type CategoryTrendPoint,
} from "@/components/CategoryTrendChart";

const RANGES = [6, 12] as const;
type Range = (typeof RANGES)[number];

interface MonthSummary {
  month: string; // YYYY-MM-01
  label: string;
  spent: number;
  earned: number;
  byCategory: Map<Category, number>;
}

export default function TrendsPage() {
  const [range, setRange] = useState<Range>(12);

  // Pinned once so the memos below have stable deps across renders.
  const [anchor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const windowStart = monthRange(anchor.year, anchor.month - (range - 1)).start;
  const windowEnd = monthRange(anchor.year, anchor.month).end;

  const { data: expenseData, isLoading: loadingExpenses } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${windowStart}&to=${windowEnd}`
  );
  const { data: incomeData, isLoading: loadingIncome } = useSWR<{ income: Income[] }>(
    `/api/income?from=${windowStart}&to=${windowEnd}`
  );

  const loading = loadingExpenses || loadingIncome;

  const months = useMemo<MonthSummary[]>(() => {
    const buckets = new Map<string, MonthSummary>();

    for (let i = range - 1; i >= 0; i--) {
      const { start } = monthRange(anchor.year, anchor.month - i);
      buckets.set(start, {
        month: start,
        label: formatMonthShort(start),
        spent: 0,
        earned: 0,
        byCategory: new Map(),
      });
    }

    for (const expense of expenseData?.expenses ?? []) {
      const key = `${expense.spent_on.slice(0, 7)}-01`;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const amount = Number(expense.amount);
      bucket.spent += amount;
      bucket.byCategory.set(
        expense.category,
        (bucket.byCategory.get(expense.category) ?? 0) + amount
      );
    }

    for (const entry of incomeData?.income ?? []) {
      const key = `${entry.received_on.slice(0, 7)}-01`;
      const bucket = buckets.get(key);
      if (bucket) bucket.earned += Number(entry.amount);
    }

    return [...buckets.values()];
  }, [expenseData, incomeData, range, anchor]);

  const activeCategories = useMemo(
    () =>
      CATEGORY_STACK_ORDER.filter((category) =>
        months.some((m) => (m.byCategory.get(category) ?? 0) > 0)
      ),
    [months]
  );

  const flowData = useMemo<FlowPoint[]>(
    () => months.map((m) => ({ label: m.label, earned: m.earned, spent: m.spent })),
    [months]
  );

  const categoryData = useMemo<CategoryTrendPoint[]>(
    () =>
      months.map((m) => {
        const point: CategoryTrendPoint = { label: m.label };
        for (const category of activeCategories) {
          point[category] = m.byCategory.get(category) ?? 0;
        }
        return point;
      }),
    [months, activeCategories]
  );

  // Averages only count months that actually have data, so a half-filled first
  // month of use does not drag the number down.
  const monthsWithSpend = months.filter((m) => m.spent > 0);
  const monthsWithIncome = months.filter((m) => m.earned > 0);
  const avgSpend = monthsWithSpend.length
    ? monthsWithSpend.reduce((s, m) => s + m.spent, 0) / monthsWithSpend.length
    : 0;
  const avgIncome = monthsWithIncome.length
    ? monthsWithIncome.reduce((s, m) => s + m.earned, 0) / monthsWithIncome.length
    : 0;
  const totalEarned = months.reduce((s, m) => s + m.earned, 0);
  const totalSpent = months.reduce((s, m) => s + m.spent, 0);
  const savingsRate = totalEarned > 0 ? ((totalEarned - totalSpent) / totalEarned) * 100 : null;

  const biggestCategory = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const m of months) {
      for (const [category, amount] of m.byCategory) {
        totals.set(category, (totals.get(category) ?? 0) + amount);
      }
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  }, [months]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Trends</h1>
          <p className="mt-1 text-sm text-muted">
            Where things are drifting, month over month.
          </p>
        </div>
        <div className="flex rounded-full bg-subtle p-0.5 text-xs font-medium">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                range === r ? "bg-accent text-accent-ink" : "text-muted"
              }`}
            >
              {r} months
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Avg monthly spend" value={formatINR(Math.round(avgSpend))} />
        <StatTile
          label="Avg monthly income"
          value={formatINR(Math.round(avgIncome))}
          tone="positive"
        />
        <StatTile
          label="Savings rate"
          value={savingsRate === null ? "—" : `${Math.round(savingsRate)}%`}
          hint={savingsRate === null ? "Log income to see this" : `over ${range} months`}
        />
        <StatTile
          label="Biggest category"
          value={biggestCategory ? biggestCategory[0] : "—"}
          hint={biggestCategory ? formatINR(biggestCategory[1]) : undefined}
          dotColor={biggestCategory ? CATEGORY_STYLES[biggestCategory[0]].hex : undefined}
        />
      </div>

      <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
        <h2 className="font-semibold text-ink">Money in vs money out</h2>
        <div className="mt-2">
          {loading ? <ChartSkeleton /> : <MonthlyFlowChart data={flowData} />}
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
        <h2 className="font-semibold text-ink">Spend by category</h2>
        <p className="text-xs text-faint">Each bar is one month, split by category</p>
        <div className="mt-2">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <CategoryTrendChart data={categoryData} categories={activeCategories} />
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
        <h2 className="px-1 font-semibold text-ink">Month by month</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-faint">
                <th className="px-1 py-2 font-medium">Month</th>
                <th className="px-1 py-2 text-right font-medium">In</th>
                <th className="px-1 py-2 text-right font-medium">Out</th>
                <th className="px-1 py-2 text-right font-medium">Saved</th>
                <th className="px-1 py-2 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...months].reverse().map((m) => {
                const saved = m.earned - m.spent;
                const rate = m.earned > 0 ? (saved / m.earned) * 100 : null;
                return (
                  <tr key={m.month}>
                    <td className="px-1 py-2.5 font-medium text-ink">
                      {formatMonthLabel(m.month)}
                    </td>
                    <td className="px-1 py-2.5 text-right text-positive">
                      {m.earned > 0 ? formatINR(m.earned) : "—"}
                    </td>
                    <td className="px-1 py-2.5 text-right text-ink">
                      {m.spent > 0 ? formatINR(m.spent) : "—"}
                    </td>
                    <td
                      className={`px-1 py-2.5 text-right font-medium ${
                        saved < 0 ? "text-negative" : "text-ink"
                      }`}
                    >
                      {m.earned === 0 && m.spent === 0 ? "—" : formatINR(saved)}
                    </td>
                    <td className="px-1 py-2.5 text-right text-muted">
                      {rate === null ? "—" : `${Math.round(rate)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
  dotColor,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive";
  dotColor?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p
        className={`mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight ${
          tone === "positive" ? "text-positive" : "text-ink"
        }`}
      >
        {dotColor && (
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
        )}
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-64 animate-pulse rounded-xl bg-subtle" />;
}
