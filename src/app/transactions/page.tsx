"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { Category, Expense, Income, PaymentMethod } from "@/lib/types";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { CATEGORY_STYLES } from "@/lib/categories";
import ExpenseRow from "@/components/ExpenseRow";
import IncomeRow from "@/components/IncomeRow";
import Sheet from "@/components/Sheet";
import { Button, Card, Chip, ChipRow, Field, inputClass } from "@/components/ui";
import { ArrowDownIcon, ArrowUpIcon, DownloadIcon, FilterIcon, SearchIcon } from "@/components/icons";

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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Everything that lives behind the Filters sheet, so the button can say how
  // much is hidden in there rather than leaving it to be discovered.
  const advancedCount = [category, paymentMethod, from, to].filter(Boolean).length;

  const exportParams = new URLSearchParams(sharedParams);
  exportParams.delete("sortDir");
  if (category) exportParams.set("category", category);
  if (paymentMethod) exportParams.set("paymentMethod", paymentMethod);
  if (entryType !== "all") exportParams.set("entryType", entryType);
  const exportHref = `/api/export?${exportParams.toString()}`;

  function clearAdvanced() {
    setCategory("");
    setPaymentMethod("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-large-title text-ink">Activity</h1>
        <p className="tnum mt-1.5 text-subhead font-medium text-muted">
          {showExpenses && <>{formatINR(spent)} out</>}
          {showExpenses && showIncome && " · "}
          {showIncome && <span className="text-positive">{formatINR(earned)} in</span>}
        </p>
      </div>

      {/* Search and the type/sort chips stay on the page; the rarely-touched
          controls move into a sheet. All five stacked full-width used to push
          the first transaction below the fold on a phone. */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or text…"
              type="search"
              className={`${inputClass} pl-10`}
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="press relative flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl border border-line bg-surface px-4 text-subhead font-medium text-ink hover:bg-subtle"
          >
            <FilterIcon className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Filters</span>
            {advancedCount > 0 && (
              <span className="tnum flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
                {advancedCount}
              </span>
            )}
          </button>
          <a
            href={exportHref}
            download
            className="press flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl border border-line bg-surface px-4 text-subhead font-medium text-ink hover:bg-subtle"
          >
            <DownloadIcon className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Export</span>
          </a>
        </div>

        <ChipRow>
          {(["all", "expense", "income"] as EntryType[]).map((t) => (
            <Chip key={t} active={entryType === t} onClick={() => setEntryType(t)}>
              {t === "all" ? "All" : t === "expense" ? "Money out" : "Money in"}
            </Chip>
          ))}
          <span className="my-1 w-px shrink-0 bg-line" />
          {(["spent_on", "amount"] as SortBy[]).map((s) => (
            <Chip
              key={s}
              active={sortBy === s}
              onClick={() => {
                if (sortBy === s) setSortDir(sortDir === "asc" ? "desc" : "asc");
                else {
                  setSortBy(s);
                  setSortDir("desc");
                }
              }}
            >
              {s === "spent_on" ? "Date" : "Amount"}
              {sortBy === s &&
                (sortDir === "asc" ? (
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownIcon className="h-3.5 w-3.5" />
                ))}
            </Chip>
          ))}
        </ChipRow>

        {expenseOnlyFilter && entryType !== "expense" && (
          <p className="px-1 text-footnote text-faint">
            Income is hidden while a category or payment filter is on.
          </p>
        )}
      </div>

      <Card className="p-3 sm:p-4">
        <div className="divide-y divide-line">
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-subtle" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-subhead text-faint">
              No transactions match your filters.
            </p>
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
      </Card>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description="Category and payment apply to expenses only."
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={clearAdvanced} full disabled={advancedCount === 0}>
              Clear
            </Button>
            <Button onClick={() => setFiltersOpen(false)} full>
              Done
            </Button>
          </div>
        }
      >
        <div>
          <span className="text-footnote font-medium text-muted">Category</span>
          <div className="mt-1.5">
            <ChipRow>
              <Chip active={category === ""} onClick={() => setCategory("")}>
                All
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  active={category === c}
                  onClick={() => setCategory(category === c ? "" : c)}
                  style={category === c ? undefined : { color: CATEGORY_STYLES[c].hex }}
                >
                  {c}
                </Chip>
              ))}
            </ChipRow>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-footnote font-medium text-muted">Paid with</span>
          <div className="mt-1.5">
            <ChipRow>
              <Chip active={paymentMethod === ""} onClick={() => setPaymentMethod("")}>
                Any
              </Chip>
              {PAYMENT_METHODS.map((m) => (
                <Chip
                  key={m}
                  active={paymentMethod === m}
                  onClick={() => setPaymentMethod(paymentMethod === m ? "" : m)}
                >
                  {m}
                </Chip>
              ))}
            </ChipRow>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="From">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
