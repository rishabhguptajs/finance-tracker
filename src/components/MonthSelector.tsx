"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthSelector({
  year,
  month, // 0-indexed
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function prev() {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  }

  function next() {
    if (isCurrentMonth) return;
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
      <button
        onClick={prev}
        className="press flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-subtle"
        aria-label="Previous month"
      >
        <ChevronLeftIcon className="h-[18px] w-[18px]" />
      </button>
      <span className="min-w-[8.5rem] text-center text-subhead font-semibold text-ink">
        {MONTH_NAMES[month]} {year}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="press flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-subtle disabled:pointer-events-none disabled:opacity-30"
        aria-label="Next month"
      >
        <ChevronRightIcon className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
