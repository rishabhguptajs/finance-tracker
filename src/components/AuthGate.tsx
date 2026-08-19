"use client";

import { useEffect, useState } from "react";
import { PiggyIcon } from "./icons";
import { Button, inputClass } from "./ui";

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
      <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
        >
          <PiggyIcon className="h-9 w-9 text-ink" />
          <h1 className="mt-3 text-title text-ink">PaisaTrack</h1>
          <p className="mt-1 text-subhead text-muted">Enter the password to continue.</p>
          <input
            type="password"
            inputMode="numeric"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="Password"
            enterKeyHint="go"
            className={`${inputClass} mt-5`}
          />
          {error && <p className="mt-2 text-subhead text-negative">{error}</p>}
          <Button type="submit" disabled={checking || !password} full className="mt-3">
            {checking ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
