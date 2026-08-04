"use client";

import { useState } from "react";
import type { Category, Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { formatDateDDMMYYYY, formatINR } from "@/lib/format";
import CategoryBadge from "./CategoryBadge";

export default function ExpenseRow({
  expense,
  onUpdated,
  onDeleted,
  showDate = false,
}: {
  expense: Expense;
  onUpdated: (e: Expense) => void;
  onDeleted: (id: string) => void;
  showDate?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(expense.amount));
  const [merchant, setMerchant] = useState(expense.merchant ?? "");
  const [category, setCategory] = useState<Category>(expense.category);
  const [spentOn, setSpentOn] = useState(expense.spent_on);
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
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdated(data.expense);
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
      if (res.ok) onDeleted(expense.id);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-xl bg-neutral-50 p-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
            style={{ color: CATEGORY_STYLES[category].hex }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 rounded-lg border border-neutral-200 py-1.5 text-sm font-medium text-neutral-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 rounded-lg bg-neutral-900 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl px-1 py-2.5 hover:bg-neutral-50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-neutral-800">
            {expense.merchant || "Unknown"}
          </span>
          <CategoryBadge category={expense.category} />
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-400">
          {showDate ? `${formatDateDDMMYYYY(expense.spent_on)} · ` : ""}
          {expense.raw_input}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-semibold text-neutral-900">{formatINR(expense.amount)}</span>
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Edit"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
