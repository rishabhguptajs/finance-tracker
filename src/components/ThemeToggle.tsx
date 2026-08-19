"use client";

import { useTheme, type ThemePreference } from "./ThemeProvider";
import { MonitorIcon, MoonIcon, SunIcon, type IconProps } from "./icons";

const OPTIONS: {
  value: ThemePreference;
  Icon: (props: IconProps) => React.ReactElement;
  label: string;
}[] = [
  { value: "light", Icon: SunIcon, label: "Light" },
  { value: "dark", Icon: MoonIcon, label: "Dark" },
  { value: "system", Icon: MonitorIcon, label: "System" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = OPTIONS.findIndex((o) => o.value === theme);
  const active = OPTIONS[current] ?? OPTIONS[2];
  const next = OPTIONS[(current + 1) % OPTIONS.length];
  const { Icon } = active;

  return (
    <button
      onClick={() => setTheme(next.value)}
      className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-subtle"
      title={`Theme: ${active.label} — switch to ${next.label}`}
      aria-label={`Theme: ${active.label}. Switch to ${next.label}.`}
    >
      <Icon className="h-[21px] w-[21px]" />
    </button>
  );
}
