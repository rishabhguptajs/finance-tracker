"use client";

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
    <div className="flex items-center gap-3">
      <button
        onClick={prev}
        className="rounded-full p-2 text-muted hover:bg-subtle"
        aria-label="Previous month"
      >
        ←
      </button>
      <span className="w-36 text-center font-semibold text-ink">
        {MONTH_NAMES[month]} {year}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="rounded-full p-2 text-muted hover:bg-subtle disabled:opacity-30"
        aria-label="Next month"
      >
        →
      </button>
    </div>
  );
}
