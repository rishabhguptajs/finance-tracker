export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDateDDMMYYYY(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function monthStartISO(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
}

export function monthEndISO(date = new Date()): string {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(lastDay)}`;
}

/**
 * First day, last day and length of a calendar month, from a 0-indexed month.
 * Out-of-range months roll into the neighbouring year, so `monthRange(2026, -3)`
 * is September 2025 — handy for "N months back" windows.
 */
export function monthRange(year: number, month: number) {
  const first = new Date(year, month, 1);
  const y = first.getFullYear();
  const m = first.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    start: `${y}-${pad(m + 1)}-01`,
    end: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
    lastDay,
    year: y,
    month: m,
  };
}

/** "2026-08-01" -> "August 2026" */
export function formatMonthLabel(monthISO: string): string {
  const [year, month] = monthISO.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

/** "2026-08-01" -> "Aug 26", for dense axes. */
export function formatMonthShort(monthISO: string): string {
  const [year, month] = monthISO.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}
