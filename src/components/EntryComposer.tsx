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
import { Button, Chip, ChipRow, Field, inputClass } from "./ui";
import { MicIcon } from "./icons";

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
      {/* Stacked rather than one cramped row: at 375px a three-across layout
          left the text field about 200px wide, so the placeholder truncated
          before you'd typed anything. Full-width field, controls beneath. */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="450 swiggy dinner, cab to office 180…"
          disabled={busy || !!draft}
          enterKeyHint="done"
          className={`${inputClass} min-h-[52px] shadow-[var(--shadow-card)]`}
        />
        <div className="flex gap-2">
          {micSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={transcribing || loading || !!draft}
              aria-label={recording ? "Stop recording" : "Record an entry"}
              className={`press flex min-h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl transition disabled:pointer-events-none disabled:opacity-40 ${
                recording
                  ? "bg-negative text-white"
                  : "border border-line bg-surface text-muted hover:bg-subtle"
              }`}
            >
              <MicIcon className="h-5 w-5" />
            </button>
          )}
          <Button
            type="submit"
            disabled={busy || !!draft || !input.trim()}
            full
            className="min-h-[52px]"
          >
            {loading ? "Reading…" : "Add"}
          </Button>
        </div>
      </form>
      {recording || transcribing ? (
        <p className="mt-2 flex items-center gap-1.5 px-1 text-footnote text-muted">
          {recording && (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-negative" />
              Listening…
            </>
          )}
          {transcribing && "Transcribing…"}
        </p>
      ) : (
        <p className="mt-2 px-1 text-footnote text-faint">
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
    <div className="animate-fade-in mt-3 rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full bg-subtle p-1 text-footnote font-semibold">
          {(["expense", "income"] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => onChange({ ...draft, kind })}
              className={`press min-h-[36px] rounded-full px-3.5 transition-colors ${
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
          <span className="tnum shrink-0 rounded-full bg-subtle px-2.5 py-1 text-footnote font-semibold text-muted">
            {step.index + 1} of {step.total}
          </span>
        )}
      </div>
      {step && step.total > 1 && (
        <p className="mt-2 text-footnote text-faint">
          Found {step.total} entries in what you typed — confirm each one below.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Amount (₹)">
          <input
            type="number"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => onChange({ ...draft, amount: Number(e.target.value) })}
            className={`${inputClass} tnum font-medium`}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ ...draft, date: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label={isIncome ? "Source" : "Name"} className="col-span-2">
          <input
            type="text"
            value={draft.merchant}
            onChange={(e) => onChange({ ...draft, merchant: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      {!isIncome && (
        <>
          {/* Chips rather than a <select>: on a phone a select opens a modal
              picker for what is a one-tap choice, and it hides the other
              options behind an extra interaction. */}
          <div className="mt-4">
            <span className="text-footnote font-medium text-muted">Category</span>
            <div className="mt-1.5">
              <ChipRow>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c}
                    active={draft.category === c}
                    onClick={() => onChange({ ...draft, category: c as Category })}
                    style={
                      draft.category === c
                        ? undefined
                        : { color: CATEGORY_STYLES[c].hex }
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
                {PAYMENT_METHODS.map((method) => {
                  const active = draft.payment_method === method;
                  return (
                    <Chip
                      key={method}
                      active={active}
                      onClick={() =>
                        onChange({
                          ...draft,
                          payment_method: active ? null : (method as PaymentMethod),
                        })
                      }
                    >
                      {method}
                    </Chip>
                  );
                })}
              </ChipRow>
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-3 text-subhead text-negative">{error}</p>}

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" onClick={onDiscard} full>
          {step && step.index + 1 < step.total ? "Skip" : "Discard"}
        </Button>
        <Button
          variant={isIncome ? "positive" : "primary"}
          onClick={onSave}
          disabled={saving}
          full
        >
          {saving
            ? "Saving…"
            : step && step.index + 1 < step.total
              ? "Save & next"
              : "Save"}
        </Button>
      </div>
    </div>
  );
}
