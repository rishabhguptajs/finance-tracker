"use client";

import { useRef, useState } from "react";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  type Category,
  type ExtractedEntry,
  type PaymentMethod,
} from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { revalidateExpenses, revalidateIncome } from "@/lib/revalidate";

const MIME_CANDIDATES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function EntryComposer() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<ExtractedEntry[] | null>(null);
  const [index, setIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const draft = queue ? queue[index] : null;
  const total = queue?.length ?? 0;
  const busy = loading || recording || transcribing;
  const micSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  async function handleMicClick() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const base64 = await blobToBase64(blob);
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64, mimeType: blob.type }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Transcription failed");
          setInput((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Couldn't access the microphone. Check your browser permissions.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
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
          disabled={busy || !!draft}
          className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base shadow-sm outline-none placeholder:text-faint focus:border-line-strong disabled:opacity-60"
        />
        {micSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={transcribing || loading || !!draft}
            aria-label={recording ? "Stop recording" : "Record an entry"}
            className={`shrink-0 rounded-2xl px-4 py-4 shadow-sm transition disabled:opacity-40 ${
              recording
                ? "animate-pulse bg-negative text-white"
                : "border border-line bg-surface text-muted hover:bg-subtle"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !!draft || !input.trim()}
          className="shrink-0 rounded-2xl bg-accent px-5 py-4 font-medium text-accent-ink shadow-sm transition hover:bg-accent-hover disabled:opacity-40"
        >
          {loading ? "…" : "Add"}
        </button>
      </form>
      {recording || transcribing ? (
        <p className="mt-1.5 flex items-center gap-1.5 px-1 text-xs text-muted">
          {recording && (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-negative" />
              Listening…
            </>
          )}
          {transcribing && "Transcribing…"}
        </p>
      ) : (
        <p className="mt-1.5 px-1 text-xs text-faint">
          Tip: log several at once, and income too — “450 swiggy, netflix 500 on card, salary 90000
          credited”
        </p>
      )}

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
