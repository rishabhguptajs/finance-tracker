"use client";

import { useState } from "react";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  type Category,
  type ExtractedEntry,
  type PaymentMethod,
} from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { revalidateExpenses, revalidateIncome } from "@/lib/revalidate";

export default function EntryComposer() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<ExtractedEntry[] | null>(null);
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
      const extracted: ExtractedEntry[] = data.extracted;
      setQueue(extracted);
      setIndex(0);
      setSavedCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(next: ExtractedEntry) {
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
      const isIncome = draft.kind === "income";
      const res = await fetch(isIncome ? "/api/income" : "/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isIncome
            ? {
                raw_input: input.trim(),
                amount: draft.amount,
                source: draft.merchant,
                received_on: draft.date,
              }
            : {
                raw_input: input.trim(),
                amount: draft.amount,
                merchant: draft.merchant,
                category: draft.category,
                spent_on: draft.date,
                payment_method: draft.payment_method,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      await (isIncome ? revalidateIncome() : revalidateExpenses());
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
          className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base shadow-sm outline-none placeholder:text-faint focus:border-line-strong disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !!draft || !input.trim()}
          className="shrink-0 rounded-2xl bg-accent px-5 py-4 font-medium text-accent-ink shadow-sm transition hover:bg-accent-hover disabled:opacity-40"
        >
          {loading ? "…" : "Add"}
        </button>
      </form>
      <p className="mt-1.5 px-1 text-xs text-faint">
        Tip: log several at once, and income too — “450 swiggy, netflix 500 on card, salary 90000
        credited”
      </p>

      {error && !draft && <p className="mt-2 text-sm text-negative">{error}</p>}

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
  draft: ExtractedEntry;
  onChange: (d: ExtractedEntry) => void;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
  error: string | null;
  step: { index: number; total: number; savedCount: number } | null;
}) {
  const isIncome = draft.kind === "income";

  return (
    <div className="mt-3 animate-fade-in rounded-2xl bg-surface p-5 shadow-md ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full bg-subtle p-0.5 text-xs font-semibold">
          {(["expense", "income"] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => onChange({ ...draft, kind })}
              className={`rounded-full px-3 py-1.5 capitalize transition-colors ${
                draft.kind === kind
                  ? kind === "income"
                    ? "bg-positive text-positive-ink"
                    : "bg-accent text-accent-ink"
                  : "text-muted"
              }`}
            >
              {kind === "income" ? "Money in" : "Money out"}
            </button>
          ))}
        </div>
        {step && (
          <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold text-muted">
            {step.index + 1} of {step.total}
          </span>
        )}
      </div>
      {step && step.total > 1 && (
        <p className="mt-2 text-xs text-faint">
          Found {step.total} entries in what you typed — confirm each one below.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted">Amount (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => onChange({ ...draft, amount: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-medium outline-none focus:border-line-strong"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Date</label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ ...draft, date: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-medium outline-none focus:border-line-strong"
          />
        </div>
        <div className={isIncome ? "col-span-2" : undefined}>
          <label className="text-xs font-medium text-muted">
            {isIncome ? "Source" : "Name"}
          </label>
          <input
            type="text"
            value={draft.merchant}
            onChange={(e) => onChange({ ...draft, merchant: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-medium outline-none focus:border-line-strong"
          />
        </div>
        {!isIncome && (
          <div>
            <label className="text-xs font-medium text-muted">Category</label>
            <select
              value={draft.category}
              onChange={(e) => onChange({ ...draft, category: e.target.value as Category })}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-medium outline-none focus:border-line-strong"
              style={{ color: CATEGORY_STYLES[draft.category].hex }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!isIncome && (
        <div className="mt-3">
          <label className="text-xs font-medium text-muted">Paid with</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((method) => {
              const active = draft.payment_method === method;
              return (
                <button
                  key={method}
                  onClick={() =>
                    onChange({ ...draft, payment_method: active ? null : (method as PaymentMethod) })
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-ink"
                      : "bg-subtle text-muted hover:bg-subtle-strong"
                  }`}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-negative">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onDiscard}
          className="flex-1 rounded-xl border border-line py-2.5 font-medium text-muted hover:bg-subtle"
        >
          {step && step.index + 1 < step.total ? "Skip" : "Discard"}
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className={`flex-1 rounded-xl py-2.5 font-medium disabled:opacity-50 ${
            isIncome
              ? "bg-positive text-positive-ink hover:opacity-90"
              : "bg-accent text-accent-ink hover:bg-accent-hover"
          }`}
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
