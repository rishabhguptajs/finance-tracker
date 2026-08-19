"use client";

import clsx from "clsx";

/**
 * The shared shapes every screen is built from. These existed before as strings
 * of Tailwind repeated at each call site, which is how a "Save" button ends up
 * `py-2.5` in one place and `py-1.5` in another — small drifts that together
 * read as sloppiness.
 */

/** Apple's 44pt floor. Anything you tap gets at least this. */
export const TAP = "min-h-[44px]";

const BUTTON_VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line text-ink hover:bg-subtle",
  positive: "bg-positive text-positive-ink hover:opacity-90",
  destructive: "bg-negative text-white hover:opacity-90",
  quiet: "text-muted hover:bg-subtle",
} as const;

export function Button({
  variant = "primary",
  full = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  full?: boolean;
}) {
  return (
    <button
      {...props}
      className={clsx(
        "press press-subtle inline-flex items-center justify-center gap-2 rounded-2xl px-5 text-body font-semibold",
        "disabled:pointer-events-none disabled:opacity-40",
        TAP,
        BUTTON_VARIANTS[variant],
        full && "w-full",
        className
      )}
    />
  );
}

/** A labelled control. The label is always present — placeholders vanish the
 *  moment you type, leaving a filled field with no idea what it holds. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="text-footnote font-medium text-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-caption text-faint">{hint}</span>}
    </label>
  );
}

/** Shared input skin, so a date picker and a text box are the same object. */
export const inputClass = clsx(
  "w-full rounded-2xl border border-line bg-surface px-4 text-body text-ink outline-none",
  "placeholder:text-faint focus:border-line-strong focus:ring-4 focus:ring-line/40",
  "transition-[border-color,box-shadow] disabled:opacity-60",
  TAP
);

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** A horizontally scrolling row of choices. Wrapping chips reflow the page
 *  every time a filter changes; scrolling keeps the layout still. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">{children}</div>
  );
}

export function Chip({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={active}
      className={clsx(
        "press inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-full px-3.5",
        "text-subhead font-medium whitespace-nowrap",
        active
          ? "bg-accent text-accent-ink"
          : "bg-subtle text-muted hover:bg-subtle-strong",
        className
      )}
    />
  );
}
