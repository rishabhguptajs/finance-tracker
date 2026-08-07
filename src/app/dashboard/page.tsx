"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { Budget, Category, CategoryBudget, Expense, Income } from "@/lib/types";
import { formatINR, monthRange, todayISO } from "@/lib/format";
import { committedMonthlySpend, detectRecurring } from "@/lib/recurring";
import BudgetBar from "@/components/BudgetBar";
import BudgetAlertBanner from "@/components/BudgetAlertBanner";
import CategoryBudgetBars, {
  type CategoryBudgetProgress,
} from "@/components/CategoryBudgetBars";
import CategoryDonutChart from "@/components/CategoryDonutChart";
import DailySpendChart from "@/components/DailySpendChart";
import MonthSelector from "@/components/MonthSelector";
import RecurringList from "@/components/RecurringList";
import SettingsModal from "@/components/SettingsModal";
import ExpenseRow from "@/components/ExpenseRow";

/** How far back to look when deciding what repeats. Enough to catch yearly plans. */
const RECURRING_LOOKBACK_MONTHS = 12;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { start, end, lastDay } = monthRange(year, month);
  const monthStr = `${year}-${pad(month + 1)}-01`;
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevRange = monthRange(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
  const lookbackStart = monthRange(year, month - RECURRING_LOOKBACK_MONTHS).start;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  useEffect(() => {
    setSelectedCategory(null);
  }, [year, month]);

  const { data: expData, isLoading: loading } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${start}&to=${end}`
  );
  const { data: prevData } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${prevRange.start}&to=${prevRange.end}`
  );
  const { data: incomeData } = useSWR<{ income: Income[] }>(
    `/api/income?from=${start}&to=${end}`
  );
  const { data: budgetData } = useSWR<{ budget: Budget | null }>(`/api/budget?month=${monthStr}`);
  const { data: categoryBudgetData } = useSWR<{ categoryBudgets: CategoryBudget[] }>(
    `/api/budget/categories?month=${monthStr}`
  );
  const { data: historyData } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${lookbackStart}&to=${end}`
  );

  const expenses = useMemo(() => expData?.expenses ?? [], [expData]);
  const income = useMemo(() => incomeData?.income ?? [], [incomeData]);
  const budgetLimit = budgetData?.budget ? Number(budgetData.budget.limit_amount) : null;
  const prevTotal = prevData
    ? prevData.expenses.reduce((s, e) => s + Number(e.amount), 0)
    : null;

  const total = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );
  const earned = useMemo(
    () => income.reduce((s, i) => s + Number(i.amount), 0),
    [income]
  );
  const saved = earned - total;
  const savingsRate = earned > 0 ? (saved / earned) * 100 : null;

  const byCategory = useMemo(() => {
    const map = new Map<Category, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const categoryProgress = useMemo<CategoryBudgetProgress[]>(() => {
    const limits = categoryBudgetData?.categoryBudgets ?? [];
    const spentByCategory = new Map(byCategory.map((c) => [c.category, c.total]));
    return limits
      .map((row) => ({
        category: row.category,
        spent: spentByCategory.get(row.category) ?? 0,
        limit: Number(row.limit_amount),
      }))
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  }, [categoryBudgetData, byCategory]);

  const byDay = useMemo(() => {
    const map = new Map<number, number>();
    for (let d = 1; d <= lastDay; d++) map.set(d, 0);
    for (const e of expenses) {
      const day = Number(e.spent_on.slice(8, 10));
      map.set(day, (map.get(day) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).map(([day, total]) => ({ day: String(day), total }));
  }, [expenses, lastDay]);

  const recurring = useMemo(() => {
    const history = historyData?.expenses ?? [];
    if (history.length === 0) return [];
    return detectRecurring(history, isCurrentMonth ? todayISO() : end);
  }, [historyData, isCurrentMonth, end]);

  const committed = committedMonthlySpend(recurring);
  const momPct = prevTotal && prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  const filteredExpenses = selectedCategory
    ? expenses.filter((e) => e.category === selectedCategory)
    : expenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      <BudgetAlertBanner spent={total} limit={budgetLimit} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <p className="text-sm font-medium text-muted">Total spent</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-ink">
            {formatINR(total)}
          </p>
          {momPct !== null && (
            <p className={`mt-2 text-sm font-medium ${momPct >= 0 ? "text-negative" : "text-positive"}`}>
              {momPct >= 0 ? "↑" : "↓"} {Math.abs(Math.round(momPct))}% vs last month
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Budget</p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs font-medium text-faint hover:text-ink"
            >
              Edit
            </button>
          </div>
          <div className="mt-3">
            <BudgetBar spent={total} limit={budgetLimit} variant="plain" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <p className="text-sm font-medium text-muted">Money in</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-positive">
            {formatINR(earned)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <p className="text-sm font-medium text-muted">Saved</p>
          <p
            className={`mt-1 text-2xl font-bold tracking-tight ${
              saved >= 0 ? "text-ink" : "text-negative"
            }`}
          >
            {formatINR(saved)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {savingsRate === null
              ? "Log income to see your savings rate"
              : `${Math.round(savingsRate)}% of what came in`}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <p className="text-sm font-medium text-muted">Committed</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {formatINR(committed)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {recurring.length === 0
              ? "No recurring charges detected"
              : `Across ${recurring.length} recurring charge${recurring.length === 1 ? "" : "s"} a month`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <h2 className="font-semibold text-ink">Spend by category</h2>
          <p className="text-xs text-faint">Tap a slice to filter transactions below</p>
          <div className="mt-2">
            <CategoryDonutChart data={byCategory} selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <h2 className="font-semibold text-ink">Spend by day</h2>
          <div className="mt-2">
            <DailySpendChart data={byDay} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Category limits</h2>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs font-medium text-faint hover:text-ink"
            >
              Edit
            </button>
          </div>
          <div className="mt-3">
            <CategoryBudgetBars progress={categoryProgress} onSelect={setSelectedCategory} />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <h2 className="font-semibold text-ink">Recurring</h2>
          <p className="text-xs text-faint">
            Detected from your history — subscriptions, bills, EMIs
          </p>
          <div className="mt-2">
            <RecurringList items={recurring} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">
            Transactions {selectedCategory && `· ${selectedCategory}`}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-medium text-faint hover:text-muted"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="mt-2 divide-y divide-line">
          {loading ? (
            <div className="space-y-2 py-2">
              <div className="h-12 animate-pulse rounded-xl bg-subtle" />
              <div className="h-12 animate-pulse rounded-xl bg-subtle" />
              <div className="h-12 animate-pulse rounded-xl bg-subtle" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-faint">No transactions.</p>
          ) : (
            filteredExpenses
              .slice()
              .sort((a, b) => b.spent_on.localeCompare(a.spent_on))
              .map((e) => <ExpenseRow key={e.id} expense={e} showDate />)
          )}
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        month={monthStr}
      />
    </div>
  );
}
