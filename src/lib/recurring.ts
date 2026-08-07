import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Category, Expense } from "./types";

export type Cadence = "monthly" | "yearly";

export interface RecurringItem {
  key: string;
  /** Most common spelling of the merchant across its occurrences. */
  merchant: string;
  category: Category;
  cadence: Cadence;
  /** Median charge — resistant to a one-off odd month. */
  typicalAmount: number;
  lastAmount: number;
  /** typicalAmount normalised to a per-month figure, for the committed-spend total. */
  monthlyEquivalent: number;
  occurrences: number;
  lastSeen: string; // YYYY-MM-DD
  expectedNext: string; // YYYY-MM-DD
  status: "active" | "due-soon" | "overdue";
  priceChange: { from: number; to: number; pct: number } | null;
  /** Three or more hits is "confirmed"; a yearly charge seen twice is only "likely". */
  confidence: "likely" | "confirmed";
}

const DUE_SOON_DAYS = 5;
const OVERDUE_GRACE_DAYS = 7;

const CADENCE_WINDOWS: { cadence: Cadence; min: number; max: number; perMonth: number }[] = [
  { cadence: "monthly", min: 25, max: 35, perMonth: 1 },
  { cadence: "yearly", min: 350, max: 380, perMonth: 1 / 12 },
];

/** Collapses spelling drift ("Netflix ", "netflix.com") onto one key. */
function normalizeMerchant(merchant: string | null): string {
  return (merchant ?? "")
    .toLowerCase()
    .replace(/\.(com|in|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || b[0].length - a[0].length
  )[0][0];
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function classifyCadence(gaps: number[]): (typeof CADENCE_WINDOWS)[number] | null {
  const typical = median(gaps);
  return CADENCE_WINDOWS.find((w) => typical >= w.min && typical <= w.max) ?? null;
}

function detectPriceChange(amounts: number[]): RecurringItem["priceChange"] {
  if (amounts.length < 3) return null;
  const latest = amounts[amounts.length - 1];
  const baseline = median(amounts.slice(0, -1));
  if (baseline <= 0) return null;

  const delta = latest - baseline;
  // Ignore rounding-level drift; only surface a change worth noticing.
  if (Math.abs(delta) < 10 || Math.abs(delta) / baseline < 0.05) return null;

  return { from: baseline, to: latest, pct: (delta / baseline) * 100 };
}

/**
 * Finds charges that repeat on a monthly or yearly rhythm — subscriptions, rent,
 * EMIs, bills. Deliberately ignores merchants hit more than once in a month
 * (that is a habit like food delivery, not a commitment).
 */
export function detectRecurring(expenses: Expense[], today: string): RecurringItem[] {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = normalizeMerchant(expense.merchant);
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.push(expense);
    else groups.set(key, [expense]);
  }

  const items: RecurringItem[] = [];
  const todayDate = parseISO(today);

  for (const [key, group] of groups) {
    if (group.length < 2) continue;

    const sorted = [...group].sort((a, b) => a.spent_on.localeCompare(b.spent_on));

    // More than one charge in the same month means it is repeat spending, not a
    // subscription — skip the whole merchant.
    const months = new Set(sorted.map((e) => monthKey(e.spent_on)));
    if (months.size !== sorted.length) continue;

    const gaps = sorted
      .slice(1)
      .map((e, i) =>
        differenceInCalendarDays(parseISO(e.spent_on), parseISO(sorted[i].spent_on))
      );

    const window = classifyCadence(gaps);
    if (!window) continue;
    if (window.cadence === "monthly" && sorted.length < 3) continue;

    const amounts = sorted.map((e) => Number(e.amount));
    const typicalAmount = median(amounts);
    const lastSeen = sorted[sorted.length - 1].spent_on;
    const expectedNextDate = addDays(parseISO(lastSeen), Math.round(median(gaps)));
    const daysUntilNext = differenceInCalendarDays(expectedNextDate, todayDate);

    items.push({
      key,
      merchant: mostCommon(sorted.map((e) => e.merchant ?? "Unknown")),
      category: sorted[sorted.length - 1].category,
      cadence: window.cadence,
      typicalAmount,
      lastAmount: amounts[amounts.length - 1],
      monthlyEquivalent: typicalAmount * window.perMonth,
      occurrences: sorted.length,
      lastSeen,
      expectedNext: format(expectedNextDate, "yyyy-MM-dd"),
      status:
        daysUntilNext < -OVERDUE_GRACE_DAYS
          ? "overdue"
          : daysUntilNext <= DUE_SOON_DAYS
            ? "due-soon"
            : "active",
      priceChange: detectPriceChange(amounts),
      confidence: sorted.length >= 3 ? "confirmed" : "likely",
    });
  }

  return items.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}

/** Total money already spoken for each month by everything detected as recurring. */
export function committedMonthlySpend(items: RecurringItem[]): number {
  return items
    .filter((item) => item.status !== "overdue")
    .reduce((sum, item) => sum + item.monthlyEquivalent, 0);
}
