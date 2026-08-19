"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Budget, Expense, Income } from "@/lib/types";
import { formatINR, monthEndISO, monthStartISO, todayISO } from "@/lib/format";
import EntryComposer from "@/components/EntryComposer";
import ExpenseRow from "@/components/ExpenseRow";
import IncomeRow from "@/components/IncomeRow";
import BudgetBar from "@/components/BudgetBar";
import BudgetAlertBanner from "@/components/BudgetAlertBanner";
import { Card } from "@/components/ui";

export default function HomePage() {
  const [today] = useState(todayISO());
  const month = monthStartISO();
  const lastDay = monthEndISO();

  const { data: todayData, isLoading: loadingToday } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${today}&to=${today}&sortBy=created_at&sortDir=desc`
  );
  const { data: todayIncomeData } = useSWR<{ income: Income[] }>(
    `/api/income?from=${today}&to=${today}&sortBy=created_at&sortDir=desc`
  );
  const { data: monthData } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?from=${month}&to=${lastDay}`
  );
  const { data: budgetData } = useSWR<{ budget: Budget | null }>(`/api/budget?month=${month}`);

  const todayExpenses = todayData?.expenses ?? [];
  const todayIncome = todayIncomeData?.income ?? [];
  const monthSpent = monthData
    ? monthData.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    : null;
  const budgetLimit = budgetData?.budget ? Number(budgetData.budget.limit_amount) : null;
  const todayTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const isEmpty = todayExpenses.length === 0 && todayIncome.length === 0;

  return (
    <div className="space-y-6">
      {monthSpent !== null && <BudgetBar spent={monthSpent} limit={budgetLimit} />}
      {monthSpent !== null && <BudgetAlertBanner spent={monthSpent} limit={budgetLimit} />}

      <div>
        <h1 className="text-large-title text-ink">What did you spend on?</h1>
        <p className="mt-1.5 text-subhead text-muted">
          Type it however feels natural — we&apos;ll figure out the rest.
        </p>
        <div className="mt-4">
          <EntryComposer />
        </div>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between px-2 pt-1">
          <h2 className="text-section text-ink">Today</h2>
          <span className="tnum text-subhead font-medium text-muted">
            {formatINR(todayTotal)}
          </span>
        </div>
        <div className="mt-1.5 divide-y divide-line">
          {loadingToday ? (
            <div className="space-y-2 py-2">
              <div className="h-14 animate-pulse rounded-xl bg-subtle" />
              <div className="h-14 animate-pulse rounded-xl bg-subtle" />
            </div>
          ) : isEmpty ? (
            <p className="py-10 text-center text-subhead text-faint">
              Nothing logged today yet.
            </p>
          ) : (
            <>
              {todayIncome.map((i) => (
                <IncomeRow key={i.id} income={i} />
              ))}
              {todayExpenses.map((e) => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
