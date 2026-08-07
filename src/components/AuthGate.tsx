"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "paisatrack_unlocked";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || checking) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Incorrect password");
      }
      localStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setChecking(false);
    }
  }

  if (unlocked === null) {
    return null;
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-lg ring-1 ring-line"
        >
          <div className="text-3xl">💸</div>
          <h1 className="mt-2 text-lg font-semibold text-ink">PaisaTrack</h1>
          <p className="mt-1 text-sm text-muted">Enter the password to continue.</p>
          <input
            type="password"
            inputMode="numeric"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="Password"
            className="mt-4 w-full rounded-xl border border-line px-4 py-2.5 text-base outline-none focus:border-line-strong"
          />
          {error && <p className="mt-2 text-sm text-negative">{error}</p>}
          <button
            type="submit"
            disabled={checking || !password}
            className="mt-4 w-full rounded-xl bg-accent py-2.5 font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-50"
          >
            {checking ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
