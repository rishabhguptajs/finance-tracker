"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { Category, Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { CATEGORY_STYLES } from "@/lib/categories";
import ExpenseRow from "@/components/ExpenseRow";

type SortBy = "spent_on" | "amount";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("spent_on");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (category) params.set("category", category);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("sortBy", sortBy);
  params.set("sortDir", sortDir);

  const { data, isLoading: loading } = useSWR<{ expenses: Expense[] }>(
    `/api/expenses?${params.toString()}`
  );
  const expenses = data?.expenses ?? [];

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">All transactions</h1>
        <span className="text-sm font-medium text-neutral-500">{formatINR(total)} total</span>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant or text…"
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 lg:col-span-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "")}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            style={category ? { color: CATEGORY_STYLES[category].hex } : undefined}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-neutral-400">Sort by</span>
          {(["spent_on", "amount"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                if (sortBy === s) setSortDir(sortDir === "asc" ? "desc" : "asc");
                else { setSortBy(s); setSortDir("desc"); }
              }}
              className={`rounded-full px-3 py-1 font-medium ${
                sortBy === s ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {s === "spent_on" ? "Date" : "Amount"} {sortBy === s && (sortDir === "asc" ? "↑" : "↓")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="divide-y divide-neutral-100">
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-50" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-400">No transactions match your filters.</p>
          ) : (
            expenses.map((e) => <ExpenseRow key={e.id} expense={e} showDate />)
          )}
        </div>
      </div>
    </div>
  );
}
