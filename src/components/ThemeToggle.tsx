"use client";

import { useTheme, type ThemePreference } from "./ThemeProvider";

const OPTIONS: { value: ThemePreference; icon: string; label: string }[] = [
  { value: "light", icon: "☀️", label: "Light" },
  { value: "dark", icon: "🌙", label: "Dark" },
  { value: "system", icon: "🖥️", label: "System" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = OPTIONS.findIndex((o) => o.value === theme);
  const next = OPTIONS[(current + 1) % OPTIONS.length];

  return (
    <button
      onClick={() => setTheme(next.value)}
      className="rounded-full p-2 text-sm text-muted transition-colors hover:bg-subtle"
      title={`Theme: ${OPTIONS[current]?.label ?? "System"} — switch to ${next.label}`}
      aria-label={`Theme: ${OPTIONS[current]?.label ?? "System"}. Switch to ${next.label}.`}
    >
      {OPTIONS[current]?.icon ?? "🖥️"}
    </button>
  );
}
