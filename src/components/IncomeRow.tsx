"use client";

import { useState } from "react";
import type { Income } from "@/lib/types";
import { formatDateDDMMYYYY, formatINR } from "@/lib/format";
import { revalidateIncome } from "@/lib/revalidate";

export default function IncomeRow({
  income,
  showDate = false,
}: {
  income: Income;
  showDate?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(income.amount));
  const [source, setSource] = useState(income.source ?? "");
  const [receivedOn, setReceivedOn] = useState(income.received_on);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
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
      if (res.ok) {
        await revalidateIncome();
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this income entry?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/income/${income.id}`, { method: "DELETE" });
      if (res.ok) await revalidateIncome();
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
            value={receivedOn}
            onChange={(e) => setReceivedOn(e.target.value)}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="col-span-2 rounded-lg border border-line px-2 py-1.5 text-sm"
          />
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
            {income.source || "Unknown"}
          </span>
          <span className="shrink-0 rounded-full bg-positive-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-positive">
            Income
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-faint">
          {showDate ? `${formatDateDDMMYYYY(income.received_on)} · ` : ""}
          {income.raw_input}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-semibold text-positive">+{formatINR(income.amount)}</span>
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
