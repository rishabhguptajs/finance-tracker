"use client";

import { useEffect, useState } from "react";
import type { Category, Expense, PaymentMethod } from "@/lib/types";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { formatDateDDMMYYYY, formatINR } from "@/lib/format";
import { revalidateExpenses } from "@/lib/revalidate";
import CategoryBadge from "./CategoryBadge";
import Sheet from "./Sheet";
import { Button, Chip, ChipRow, Field, inputClass } from "./ui";
import { TrashIcon } from "./icons";

export default function ExpenseRow({
  expense,
  showDate = false,
}: {
  expense: Expense;
  showDate?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      {/* The whole row is the target. The edit and delete buttons used to be
          revealed on hover, which meant they simply did not exist on a phone. */}
      <button
        onClick={() => setEditing(true)}
        className="press press-subtle flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left hover:bg-subtle"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-body font-medium text-ink">
              {expense.merchant || "Unknown"}
            </span>
            <CategoryBadge category={expense.category} />
            {expense.payment_method && (
              <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                {expense.payment_method}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-footnote text-faint">
            {showDate ? `${formatDateDDMMYYYY(expense.spent_on)} · ` : ""}
            {expense.raw_input}
          </p>
        </div>
        <span className="tnum shrink-0 text-body font-semibold text-ink">
          {formatINR(expense.amount)}
        </span>
      </button>

      <EditExpenseSheet
        expense={expense}
        open={editing}
        onClose={() => setEditing(false)}
      />
    </>
  );
}

function EditExpenseSheet({
  expense,
  open,
  onClose,
}: {
  expense: Expense;
  open: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [merchant, setMerchant] = useState(expense.merchant ?? "");
  const [category, setCategory] = useState<Category>(expense.category);
  const [spentOn, setSpentOn] = useState(expense.spent_on);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    expense.payment_method ?? null
  );
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reopening after a cancelled edit should show what's stored, not the
  // abandoned draft from last time.
  useEffect(() => {
    if (!open) return;
    setAmount(String(expense.amount));
    setMerchant(expense.merchant ?? "");
    setCategory(expense.category);
    setSpentOn(expense.spent_on);
    setPaymentMethod(expense.payment_method ?? null);
    setConfirmingDelete(false);
    setError(null);
  }, [open, expense]);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          merchant,
          category,
          spent_on: spentOn,
          payment_method: paymentMethod,
        }),
      });
      if (!res.ok) throw new Error();
      await revalidateExpenses();
      onClose();
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    // Two taps inside the sheet, rather than the browser's confirm() dialog —
    // a system alert with the site's hostname in it breaks the illusion that
    // this is an app, and it's the one piece of chrome a PWA can't restyle.
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await revalidateExpenses();
      onClose();
    } catch {
      setError("Couldn't delete that. Try again.");
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit expense"
      description={expense.raw_input || undefined}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} full>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy} full>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} tnum font-medium`}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Name" className="col-span-2">
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4">
        <span className="text-footnote font-medium text-muted">Category</span>
        <div className="mt-1.5">
          <ChipRow>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => setCategory(c)}
                style={
                  category === c ? undefined : { color: CATEGORY_STYLES[c].hex }
                }
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
            {PAYMENT_METHODS.map((m) => (
              <Chip
                key={m}
                active={paymentMethod === m}
                onClick={() =>
                  setPaymentMethod(paymentMethod === m ? null : (m as PaymentMethod))
                }
              >
                {m}
              </Chip>
            ))}
          </ChipRow>
        </div>
      </div>

      {error && <p className="mt-3 text-subhead text-negative">{error}</p>}

      <div className="mt-5 border-t border-line pt-4">
        <Button
          variant={confirmingDelete ? "destructive" : "secondary"}
          onClick={handleDelete}
          disabled={busy}
          full
          className={confirmingDelete ? undefined : "text-negative"}
        >
          <TrashIcon className="h-[18px] w-[18px]" />
          {confirmingDelete ? "Tap again to delete" : "Delete expense"}
        </Button>
      </div>
    </Sheet>
  );
}
