"use client";

import { useState } from "react";
import type { ToolStep } from "@/lib/ask";

interface Answer {
  question: string;
  answer: string;
  steps: ToolStep[];
}

const SUGGESTIONS = [
  "How much did I spend on food last month?",
  "Weekday vs weekend spending this month?",
  "Which category grew the most in the last 3 months?",
  "Am I on track to stay under budget?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Answer[]>([]);

  async function submit(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not answer that");
      setHistory((h) => [
        { question: text.trim(), answer: data.answer, steps: data.steps ?? [] },
        ...h,
      ]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Ask your money</h1>
        <p className="mt-1 text-sm text-muted">
          Questions about your own spending, answered from your own rows.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="How much on Swiggy in the last 3 months?"
          disabled={loading}
          className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base shadow-sm outline-none placeholder:text-faint focus:border-line-strong disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="shrink-0 rounded-2xl bg-accent px-5 py-4 font-medium text-accent-ink shadow-sm transition hover:bg-accent-hover disabled:opacity-40"
        >
          {loading ? "…" : "Ask"}
        </button>
      </form>

      {history.length === 0 && !loading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-subtle-strong"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-negative">{error}</p>}

      {loading && (
        <div className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
          <div className="h-4 w-2/3 animate-pulse rounded bg-subtle" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-subtle" />
        </div>
      )}

      {history.map((entry, i) => (
        <div
          key={`${entry.question}-${i}`}
          className="animate-fade-in rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line"
        >
          <p className="text-sm font-medium text-muted">{entry.question}</p>
          <p className="mt-2 whitespace-pre-wrap text-ink">{entry.answer}</p>

          {entry.steps.length > 0 && (
            <details className="mt-3 border-t border-line pt-3">
              <summary className="cursor-pointer text-xs font-medium text-faint hover:text-muted">
                Where this came from ({entry.steps.length} lookup
                {entry.steps.length === 1 ? "" : "s"})
              </summary>
              <ul className="mt-2 space-y-1">
                {entry.steps.map((step, j) => (
                  <li key={j} className="text-xs text-muted">
                    <span className="font-mono text-faint">{step.tool}</span> — {step.summary}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
