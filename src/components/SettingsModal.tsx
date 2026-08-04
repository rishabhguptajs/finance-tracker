"use client";

import { useEffect, useState } from "react";
import { monthStartISO } from "@/lib/format";

export const BUDGET_UPDATED_EVENT = "budget-updated";

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const month = monthStartISO();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/budget?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.budget) setLimit(String(data.budget.limit_amount));
        else setLimit("");
      })
      .catch(() => setError("Could not load budget"))
      .finally(() => setLoading(false));
  }, [open, month]);

  if (!open) return null;

  async function handleSave() {
    const amount = Number(limit);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid budget amount");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, limit_amount: amount }),
      });
      if (!res.ok) throw new Error();
      window.dispatchEvent(new CustomEvent(BUDGET_UPDATED_EVENT));
      onClose();
    } catch {
      setError("Failed to save budget. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Monthly budget</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Set your spending limit for this month. No rollover — resets each month.
        </p>

        {loading ? (
          <div className="mt-6 h-11 animate-pulse rounded-xl bg-neutral-100" />
        ) : (
          <div className="mt-6">
            <label className="text-xs font-medium text-neutral-500">Limit (₹)</label>
            <input
              type="number"
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="e.g. 30000"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-lg font-medium outline-none focus:border-neutral-400"
            />
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 rounded-xl bg-neutral-900 py-2.5 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
