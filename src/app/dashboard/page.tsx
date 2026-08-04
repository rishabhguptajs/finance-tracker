"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { Budget, Category, Expense } from "@/lib/types";
import { formatINR } from "@/lib/format";
import BudgetBar from "@/components/BudgetBar";
import BudgetAlertBanner from "@/components/BudgetAlertBanner";
import CategoryDonutChart from "@/components/CategoryDonutChart";
import DailySpendChart from "@/components/DailySpendChart";
import MonthSelector from "@/components/MonthSelector";
import ExpenseRow from "@/components/ExpenseRow";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthRange(year: number, month: number) {
  const start = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { start, end, lastDay };
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { start, end, lastDay } = monthRange(year, month);
  const monthStr = `${year}-${pad(month + 1)}-01`;
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevRange = monthRange(prevMonthDate.getFullYear(), prevMonthDate.getMonth());

  useEffect(() => {
    setSelectedCategory(null);
  }, [year, month]);

  const { data: expData, isLoading: loading } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${start}&to=${end}`
  );
  const { data: prevData } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${prevRange.start}&to=${prevRange.end}`
  );
  const { data: budgetData } = useSWR<{ budget: Budget | null }>(`/api/budget?month=${monthStr}`);

  const expenses = useMemo(() => expData?.expenses ?? [], [expData]);
  const budgetLimit = budgetData?.budget ? Number(budgetData.budget.limit_amount) : null;
  const prevTotal = prevData
    ? prevData.expenses.reduce((s, e) => s + Number(e.amount), 0)
    : null;

  const total = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const byCategory = useMemo(() => {
    const map = new Map<Category, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const byDay = useMemo(() => {
    const map = new Map<number, number>();
    for (let d = 1; d <= lastDay; d++) map.set(d, 0);
    for (const e of expenses) {
      const day = Number(e.spent_on.slice(8, 10));
      map.set(day, (map.get(day) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).map(([day, total]) => ({ day: String(day), total }));
  }, [expenses, lastDay]);

  const momPct = prevTotal && prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  const filteredExpenses = selectedCategory
    ? expenses.filter((e) => e.category === selectedCategory)
    : expenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      <BudgetAlertBanner spent={total} limit={budgetLimit} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-neutral-500">Total spent</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-neutral-900">
            {formatINR(total)}
          </p>
          {momPct !== null && (
            <p className={`mt-2 text-sm font-medium ${momPct >= 0 ? "text-red-500" : "text-green-600"}`}>
              {momPct >= 0 ? "↑" : "↓"} {Math.abs(Math.round(momPct))}% vs last month
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-neutral-500">Budget</p>
          <div className="mt-3">
            <BudgetBar spent={total} limit={budgetLimit} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold text-neutral-800">Spend by category</h2>
          <p className="text-xs text-neutral-400">Tap a slice to filter transactions below</p>
          <div className="mt-2">
            <CategoryDonutChart data={byCategory} selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold text-neutral-800">Spend by day</h2>
          <div className="mt-2">
            <DailySpendChart data={byDay} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800">
            Transactions {selectedCategory && `· ${selectedCategory}`}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-600"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="mt-2 divide-y divide-neutral-100">
          {loading ? (
            <div className="space-y-2 py-2">
              <div className="h-12 animate-pulse rounded-xl bg-neutral-50" />
              <div className="h-12 animate-pulse rounded-xl bg-neutral-50" />
              <div className="h-12 animate-pulse rounded-xl bg-neutral-50" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No transactions.</p>
          ) : (
            filteredExpenses
              .slice()
              .sort((a, b) => b.spent_on.localeCompare(a.spent_on))
              .map((e) => <ExpenseRow key={e.id} expense={e} showDate />)
          )}
        </div>
      </div>
    </div>
  );
}
