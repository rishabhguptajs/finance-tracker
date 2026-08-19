"use client";

import { useState } from "react";
import type { ToolStep } from "@/lib/ask";
import { Button, Card, inputClass } from "@/components/ui";

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
        <h1 className="text-large-title text-ink">Ask your money</h1>
        <p className="mt-1.5 text-subhead text-muted">
          Questions about your own spending, answered from your own rows.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="space-y-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="How much on Swiggy in the last 3 months?"
          disabled={loading}
          enterKeyHint="send"
          className={`${inputClass} min-h-[52px] shadow-[var(--shadow-card)]`}
        />
        <Button
          type="submit"
          disabled={loading || !question.trim()}
          full
          className="min-h-[52px]"
        >
          {loading ? "Thinking…" : "Ask"}
        </Button>
      </form>

      {history.length === 0 && !loading && (
        <div className="space-y-2">
          <p className="px-1 text-footnote text-faint">Try one of these</p>
          {/* Full-width rows rather than wrapped chips: these are sentences, and
              wrapped chips broke into ragged two-line blocks on a phone. */}
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="press press-subtle flex min-h-[44px] w-full items-center rounded-2xl bg-subtle px-4 py-2.5 text-left text-subhead font-medium text-muted hover:bg-subtle-strong"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-subhead text-negative">{error}</p>}

      {loading && (
        <Card className="p-5">
          <div className="h-4 w-2/3 animate-pulse rounded bg-subtle" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-subtle" />
        </Card>
      )}

      {history.map((entry, i) => (
        <Card key={`${entry.question}-${i}`} className="animate-fade-in p-5">
          <p className="text-subhead font-medium text-muted">{entry.question}</p>
          <p className="mt-2 text-body whitespace-pre-wrap text-ink">{entry.answer}</p>

          {entry.steps.length > 0 && (
            <details className="mt-3 border-t border-line pt-3">
              <summary className="cursor-pointer text-footnote font-medium text-faint hover:text-muted">
                Where this came from ({entry.steps.length} lookup
                {entry.steps.length === 1 ? "" : "s"})
              </summary>
              <ul className="mt-2 space-y-1">
                {entry.steps.map((step, j) => (
                  <li key={j} className="text-footnote text-muted">
                    <span className="font-mono text-faint">{step.tool}</span> — {step.summary}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      ))}
    </div>
  );
}
