"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { Category, Expense, Income, PaymentMethod } from "@/lib/types";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { CATEGORY_STYLES } from "@/lib/categories";
import ExpenseRow from "@/components/ExpenseRow";
import IncomeRow from "@/components/IncomeRow";

type SortBy = "spent_on" | "amount";
type EntryType = "all" | "expense" | "income";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("all");
  const [category, setCategory] = useState<Category | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("spent_on");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Category and payment method only exist on expenses, so either one narrows
  // the view to expenses regardless of the type toggle.
  const expenseOnlyFilter = Boolean(category || paymentMethod);
  const showExpenses = entryType !== "income";
  const showIncome = entryType !== "expense" && !expenseOnlyFilter;

  const sharedParams = new URLSearchParams();
  if (debouncedSearch) sharedParams.set("search", debouncedSearch);
  if (from) sharedParams.set("from", from);
  if (to) sharedParams.set("to", to);
  sharedParams.set("sortDir", sortDir);

  const expenseParams = new URLSearchParams(sharedParams);
  if (category) expenseParams.set("category", category);
  if (paymentMethod) expenseParams.set("paymentMethod", paymentMethod);
  expenseParams.set("sortBy", sortBy);

  const incomeParams = new URLSearchParams(sharedParams);
  incomeParams.set("sortBy", sortBy === "spent_on" ? "received_on" : "amount");

  const { data: expenseData, isLoading: loadingExpenses } = useSWR<{ expenses: Expense[] }>(
    showExpenses ? `/api/expenses?${expenseParams.toString()}` : null
  );
  const { data: incomeData, isLoading: loadingIncome } = useSWR<{ income: Income[] }>(
    showIncome ? `/api/income?${incomeParams.toString()}` : null
  );

  const expenses = useMemo(() => expenseData?.expenses ?? [], [expenseData]);
  const income = useMemo(() => incomeData?.income ?? [], [incomeData]);
  const loading = (showExpenses && loadingExpenses) || (showIncome && loadingIncome);

  const rows = useMemo(() => {
    const merged = [
      ...(showExpenses
        ? expenses.map((e) => ({
            id: e.id,
            kind: "expense" as const,
            date: e.spent_on,
            amount: Number(e.amount),
            expense: e,
          }))
        : []),
      ...(showIncome
        ? income.map((i) => ({
            id: i.id,
            kind: "income" as const,
            date: i.received_on,
            amount: Number(i.amount),
            income: i,
          }))
        : []),
    ];

    const direction = sortDir === "asc" ? 1 : -1;
    return merged.sort((a, b) =>
      sortBy === "amount"
        ? (a.amount - b.amount) * direction
        : a.date.localeCompare(b.date) * direction
    );
  }, [expenses, income, showExpenses, showIncome, sortBy, sortDir]);

  const spent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const earned = income.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink">All transactions</h1>
        <span className="text-sm font-medium text-muted">
          {showExpenses && <>{formatINR(spent)} out</>}
          {showExpenses && showIncome && " · "}
          {showIncome && <span className="text-positive">{formatINR(earned)} in</span>}
        </span>
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or text…"
            className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line-strong lg:col-span-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "")}
            className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line-strong"
            style={category ? { color: CATEGORY_STYLES[category].hex } : undefined}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
            className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line-strong"
          >
            <option value="">Any payment</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line-strong"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line-strong"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-faint">Show</span>
            {(["all", "expense", "income"] as EntryType[]).map((t) => (
              <button
                key={t}
                onClick={() => setEntryType(t)}
                className={`rounded-full px-3 py-1 font-medium capitalize ${
                  entryType === t ? "bg-accent text-accent-ink" : "bg-subtle text-muted"
                }`}
              >
                {t === "all" ? "All" : t === "expense" ? "Money out" : "Money in"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-faint">Sort by</span>
            {(["spent_on", "amount"] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (sortBy === s) setSortDir(sortDir === "asc" ? "desc" : "asc");
                  else { setSortBy(s); setSortDir("desc"); }
                }}
                className={`rounded-full px-3 py-1 font-medium ${
                  sortBy === s ? "bg-accent text-accent-ink" : "bg-subtle text-muted"
                }`}
              >
                {s === "spent_on" ? "Date" : "Amount"} {sortBy === s && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>
        </div>
        {expenseOnlyFilter && entryType !== "expense" && (
          <p className="mt-2 text-xs text-faint">
            Income is hidden while a category or payment filter is on.
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
        <div className="divide-y divide-line">
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-subtle" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-faint">No transactions match your filters.</p>
          ) : (
            rows.map((row) =>
              row.kind === "expense" ? (
                <ExpenseRow key={`e-${row.id}`} expense={row.expense} showDate />
              ) : (
                <IncomeRow key={`i-${row.id}`} income={row.income} showDate />
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
