"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type Expense, type ExtractedExpense } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";

export default function ExpenseEntry({
  onSaved,
}: {
  onSaved: (expense: Expense) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<ExtractedExpense[] | null>(null);
  const [index, setIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const draft = queue ? queue[index] : null;
  const total = queue?.length ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      const extracted: ExtractedExpense[] = data.extracted;
      setQueue(extracted);
      setIndex(0);
      setSavedCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(next: ExtractedExpense) {
    if (!queue) return;
    setQueue(queue.map((d, i) => (i === index ? next : d)));
  }

  function advance() {
    if (!queue) return;
    if (index + 1 < queue.length) {
      setIndex(index + 1);
    } else {
      setQueue(null);
      setIndex(0);
      setInput("");
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_input: input.trim(),
          amount: draft.amount,
          merchant: draft.merchant,
          category: draft.category,
          spent_on: draft.date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved(data.expense);
      setSavedCount((c) => c + 1);
      advance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setError(null);
    advance();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="450 swiggy dinner, cab to office 180…"
          disabled={loading || !!draft}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-base shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !!draft || !input.trim()}
          className="shrink-0 rounded-2xl bg-neutral-900 px-5 py-4 font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-40"
        >
          {loading ? "…" : "Add"}
        </button>
      </form>
      <p className="mt-1.5 px-1 text-xs text-neutral-400">
        Tip: you can log several in one go — “450 swiggy dinner, cab 180, netflix 500”
      </p>

      {error && !draft && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {draft && (
        <ConfirmCard
          draft={draft}
          onChange={updateDraft}
          onSave={handleSave}
          onDiscard={handleDiscard}
          saving={saving}
          error={error}
          step={total > 1 ? { index, total, savedCount } : null}
        />
      )}
    </div>
  );
}

function ConfirmCard({
  draft,
  onChange,
  onSave,
  onDiscard,
  saving,
  error,
  step,
}: {
  draft: ExtractedExpense;
  onChange: (d: ExtractedExpense) => void;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
  error: string | null;
  step: { index: number; total: number; savedCount: number } | null;
}) {
  return (
    <div className="mt-3 animate-fade-in rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          Confirm details
        </p>
        {step && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
            {step.index + 1} of {step.total}
          </span>
        )}
      </div>
      {step && step.total > 1 && (
        <p className="mt-1 text-xs text-neutral-400">
          Found {step.total} expenses in what you typed — confirm each one below.
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-500">Amount (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => onChange({ ...draft, amount: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-medium outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Date</label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ ...draft, date: e.target.value })}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-medium outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Merchant</label>
          <input
            type="text"
            value={draft.merchant}
            onChange={(e) => onChange({ ...draft, merchant: e.target.value })}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-medium outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Category</label>
          <select
            value={draft.category}
            onChange={(e) => onChange({ ...draft, category: e.target.value as Category })}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-medium outline-none focus:border-neutral-400"
            style={{ color: CATEGORY_STYLES[draft.category].hex }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onDiscard}
          className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {step && step.index + 1 < step.total ? "Skip" : "Discard"}
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-neutral-900 py-2.5 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : step && step.index + 1 < step.total
              ? "Save & next"
              : "Save"}
        </button>
      </div>
    </div>
  );
}
