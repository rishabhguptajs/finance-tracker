"use client";

import { useState } from "react";
import type { Category, Expense, PaymentMethod } from "@/lib/types";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { formatDateDDMMYYYY, formatINR } from "@/lib/format";
import { revalidateExpenses } from "@/lib/revalidate";
import CategoryBadge from "./CategoryBadge";

export default function ExpenseRow({
  expense,
  showDate = false,
}: {
  expense: Expense;
  showDate?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(expense.amount));
  const [merchant, setMerchant] = useState(expense.merchant ?? "");
  const [category, setCategory] = useState<Category>(expense.category);
  const [spentOn, setSpentOn] = useState(expense.spent_on);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    expense.payment_method ?? ""
  );
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          merchant,
          category,
          spent_on: spentOn,
          payment_method: paymentMethod || null,
        }),
      });
      if (res.ok) {
        await revalidateExpenses();
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this expense?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (res.ok) await revalidateExpenses();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-subtle p-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
            style={{ color: CATEGORY_STYLES[category].hex }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
            className="col-span-2 rounded-lg border border-line px-2 py-1.5 text-sm"
          >
            <option value="">Payment method — not set</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 rounded-lg border border-line py-1.5 text-sm font-medium text-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 rounded-lg bg-accent py-1.5 text-sm font-medium text-accent-ink disabled:opacity-50"
          >
            {busy ? "…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 hover:bg-subtle">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-ink">
            {expense.merchant || "Unknown"}
          </span>
          <CategoryBadge category={expense.category} />
          {expense.payment_method && (
            <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              {expense.payment_method}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-faint">
          {showDate ? `${formatDateDDMMYYYY(expense.spent_on)} · ` : ""}
          {expense.raw_input}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-semibold text-ink">{formatINR(expense.amount)}</span>
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-faint hover:bg-subtle hover:text-ink"
            aria-label="Edit"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-lg p-1.5 text-faint hover:bg-negative-soft hover:text-negative"
            aria-label="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
