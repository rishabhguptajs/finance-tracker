"use client";

import { useCallback, useEffect, useState } from "react";
import type { Expense } from "@/lib/types";
import { formatINR, monthStartISO, todayISO } from "@/lib/format";
import ExpenseEntry from "@/components/ExpenseEntry";
import ExpenseRow from "@/components/ExpenseRow";
import BudgetBar from "@/components/BudgetBar";
import BudgetAlertBanner from "@/components/BudgetAlertBanner";
import { BUDGET_UPDATED_EVENT } from "@/components/SettingsModal";

export default function HomePage() {
  const [today] = useState(todayISO());
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [monthSpent, setMonthSpent] = useState<number | null>(null);
  const [budgetLimit, setBudgetLimit] = useState<number | null>(null);

  const loadToday = useCallback(async () => {
    setLoadingToday(true);
    const res = await fetch(`/api/expenses?from=${today}&to=${today}&sortBy=created_at&sortDir=desc`);
    const data = await res.json();
    setTodayExpenses(data.expenses ?? []);
    setLoadingToday(false);
  }, [today]);

  const loadMonth = useCallback(async () => {
    const month = monthStartISO();
    const monthEnd = new Date();
    const lastDay = new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    const [expensesRes, budgetRes] = await Promise.all([
      fetch(`/api/expenses?from=${month}&to=${lastDay}`),
      fetch(`/api/budget?month=${month}`),
    ]);
    const expensesData = await expensesRes.json();
    const budgetData = await budgetRes.json();

    const total = (expensesData.expenses ?? []).reduce(
      (sum: number, e: Expense) => sum + Number(e.amount),
      0
    );
    setMonthSpent(total);
    setBudgetLimit(budgetData.budget ? Number(budgetData.budget.limit_amount) : null);
  }, []);

  useEffect(() => {
    loadToday();
    loadMonth();
  }, [loadToday, loadMonth]);

  useEffect(() => {
    const handler = () => loadMonth();
    window.addEventListener(BUDGET_UPDATED_EVENT, handler);
    return () => window.removeEventListener(BUDGET_UPDATED_EVENT, handler);
  }, [loadMonth]);

  function handleSaved(expense: Expense) {
    if (expense.spent_on === today) {
      setTodayExpenses((prev) => [expense, ...prev]);
    }
    loadMonth();
  }

  function handleUpdated(expense: Expense) {
    setTodayExpenses((prev) =>
      expense.spent_on === today
        ? prev.map((e) => (e.id === expense.id ? expense : e))
        : prev.filter((e) => e.id !== expense.id)
    );
    loadMonth();
  }

  function handleDeleted(id: string) {
    setTodayExpenses((prev) => prev.filter((e) => e.id !== id));
    loadMonth();
  }

  const todayTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {monthSpent !== null && <BudgetBar spent={monthSpent} limit={budgetLimit} />}
      {monthSpent !== null && <BudgetAlertBanner spent={monthSpent} limit={budgetLimit} />}

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">What did you spend on?</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Type it however feels natural — we&apos;ll figure out the rest.
        </p>
        <div className="mt-4">
          <ExpenseEntry onSaved={handleSaved} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800">Today</h2>
          <span className="text-sm font-medium text-neutral-500">
            {formatINR(todayTotal)}
          </span>
        </div>
        <div className="mt-2 divide-y divide-neutral-100">
          {loadingToday ? (
            <div className="space-y-2 py-2">
              <div className="h-12 animate-pulse rounded-xl bg-neutral-50" />
              <div className="h-12 animate-pulse rounded-xl bg-neutral-50" />
            </div>
          ) : todayExpenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              No expenses logged today yet.
            </p>
          ) : (
            todayExpenses.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
