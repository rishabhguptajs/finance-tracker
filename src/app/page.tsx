"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Budget, Expense } from "@/lib/types";
import { formatINR, monthEndISO, monthStartISO, todayISO } from "@/lib/format";
import ExpenseEntry from "@/components/ExpenseEntry";
import ExpenseRow from "@/components/ExpenseRow";
import BudgetBar from "@/components/BudgetBar";
import BudgetAlertBanner from "@/components/BudgetAlertBanner";

export default function HomePage() {
  const [today] = useState(todayISO());
  const month = monthStartISO();
  const lastDay = monthEndISO();

  const { data: todayData, isLoading: loadingToday } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${today}&to=${today}&sortBy=created_at&sortDir=desc`
  );
  const { data: monthData } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${month}&to=${lastDay}`
  );
  const { data: budgetData } = useSWR<{ budget: Budget | null }>(`/api/budget?month=${month}`);

  const todayExpenses = todayData?.expenses ?? [];
  const monthSpent = monthData
    ? monthData.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    : null;
  const budgetLimit = budgetData?.budget ? Number(budgetData.budget.limit_amount) : null;
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
          <ExpenseEntry />
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
            todayExpenses.map((e) => <ExpenseRow key={e.id} expense={e} />)
          )}
        </div>
      </div>
    </div>
  );
}
