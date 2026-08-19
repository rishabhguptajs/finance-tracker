"use client";

import { useEffect, useState } from "react";
import type { Income } from "@/lib/types";
import { formatDateDDMMYYYY, formatINR } from "@/lib/format";
import { revalidateIncome } from "@/lib/revalidate";
import Sheet from "./Sheet";
import { Button, Field, inputClass } from "./ui";
import { TrashIcon } from "./icons";

export default function IncomeRow({
  income,
  showDate = false,
}: {
  income: Income;
  showDate?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="press press-subtle flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left hover:bg-subtle"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-body font-medium text-ink">
              {income.source || "Unknown"}
            </span>
            <span className="shrink-0 rounded-full bg-positive-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-positive uppercase">
              Income
            </span>
          </div>
          <p className="mt-0.5 truncate text-footnote text-faint">
            {showDate ? `${formatDateDDMMYYYY(income.received_on)} · ` : ""}
            {income.raw_input}
          </p>
        </div>
        <span className="tnum shrink-0 text-body font-semibold text-positive">
          +{formatINR(income.amount)}
        </span>
      </button>

      <EditIncomeSheet income={income} open={editing} onClose={() => setEditing(false)} />
    </>
  );
}

function EditIncomeSheet({
  income,
  open,
  onClose,
}: {
  income: Income;
  open: boolean;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(income.amount));
  const [source, setSource] = useState(income.source ?? "");
  const [receivedOn, setReceivedOn] = useState(income.received_on);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(String(income.amount));
    setSource(income.source ?? "");
    setReceivedOn(income.received_on);
    setConfirmingDelete(false);
    setError(null);
  }, [open, income]);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/income/${income.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          source,
          received_on: receivedOn,
        }),
      });
      if (!res.ok) throw new Error();
      await revalidateIncome();
      onClose();
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/income/${income.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await revalidateIncome();
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
      title="Edit income"
      description={income.raw_input || undefined}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} full>
            Cancel
          </Button>
          <Button variant="positive" onClick={handleSave} disabled={busy} full>
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
            value={receivedOn}
            onChange={(e) => setReceivedOn(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Source" className="col-span-2">
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={inputClass}
          />
        </Field>
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
          {confirmingDelete ? "Tap again to delete" : "Delete income"}
        </Button>
      </div>
    </Sheet>
  );
}
