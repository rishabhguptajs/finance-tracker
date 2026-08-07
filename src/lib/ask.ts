import { Type, type FunctionDeclaration } from "@google/genai";
import { supabase } from "./supabase";
import { CATEGORIES, PAYMENT_METHODS, type Expense, type Income } from "./types";
import { detectRecurring, committedMonthlySpend } from "./recurring";
import { monthRange, todayISO } from "./format";

/**
 * The model never sees raw rows to add up itself — every number it can quote is
 * summed here in JS first. That is the difference between an answer you can
 * trust and one that merely looks right.
 */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface ToolStep {
  tool: string;
  args: Record<string, unknown>;
  summary: string;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupKeyFor(
  expense: Expense,
  groupBy: string
): string {
  switch (groupBy) {
    case "category":
      return expense.category;
    case "month":
      return expense.spent_on.slice(0, 7);
    case "merchant":
      return expense.merchant ?? "Unknown";
    case "payment_method":
      return expense.payment_method ?? "Not recorded";
    case "day_of_week":
      return DAY_NAMES[new Date(`${expense.spent_on}T00:00:00`).getDay()];
    case "weekday_weekend": {
      const day = new Date(`${expense.spent_on}T00:00:00`).getDay();
      return day === 0 || day === 6 ? "Weekend" : "Weekday";
    }
    default:
      return "all";
  }
}

function aggregate<T>(
  rows: T[],
  amountOf: (row: T) => number,
  keyOf: (row: T) => string
) {
  const groups = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = groups.get(key) ?? { total: 0, count: 0 };
    bucket.total += amountOf(row);
    bucket.count += 1;
    groups.set(key, bucket);
  }
  return [...groups.entries()]
    .map(([key, v]) => ({ key, total: round(v.total), count: v.count }))
    .sort((a, b) => b.total - a.total);
}

/* ------------------------------------------------------------------ tools */

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "query_expenses",
    description:
      "Sum and group the user's expenses over a date range. Returns totals computed server-side. Use this for any question about spending.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: { type: Type.STRING, description: "Start date, inclusive, YYYY-MM-DD" },
        to: { type: Type.STRING, description: "End date, inclusive, YYYY-MM-DD" },
        category: {
          type: Type.STRING,
          description: `Optional filter. One of: ${CATEGORIES.join(", ")}`,
        },
        payment_method: {
          type: Type.STRING,
          description: `Optional filter. One of: ${PAYMENT_METHODS.join(", ")}`,
        },
        merchant_contains: {
          type: Type.STRING,
          description: "Optional case-insensitive substring match on merchant name",
        },
        group_by: {
          type: Type.STRING,
          description:
            "How to break down the total: category, month, merchant, payment_method, day_of_week, weekday_weekend, or none. Ask for the exact split you need — never sum the groups yourself.",
        },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "query_income",
    description:
      "Sum and group the user's income over a date range. Returns totals computed server-side.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: { type: Type.STRING, description: "Start date, inclusive, YYYY-MM-DD" },
        to: { type: Type.STRING, description: "End date, inclusive, YYYY-MM-DD" },
        group_by: {
          type: Type.STRING,
          description: "How to break down the total: month, source, or none",
        },
      },
      required: ["from", "to"],
    },
  },
];

export async function runTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ result: unknown; summary: string }> {
  if (name === "query_expenses") {
    const from = String(args.from);
    const to = String(args.to);
    const groupBy = typeof args.group_by === "string" ? args.group_by : "none";

    let query = supabase.from("expenses").select("*").gte("spent_on", from).lte("spent_on", to);
    if (typeof args.category === "string") query = query.eq("category", args.category);
    if (typeof args.payment_method === "string")
      query = query.eq("payment_method", args.payment_method);
    if (typeof args.merchant_contains === "string")
      query = query.ilike("merchant", `%${args.merchant_contains}%`);

    const { data, error } = await query;
    if (error) return { result: { error: error.message }, summary: `failed: ${error.message}` };

    const rows = (data ?? []) as Expense[];
    const amounts = rows.map((r) => Number(r.amount));
    const total = round(sum(amounts));
    const groups = groupBy === "none" ? [] : aggregate(rows, (r) => Number(r.amount), (r) => groupKeyFor(r, groupBy));

    const top = [...rows]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 10)
      .map((r) => ({
        date: r.spent_on,
        merchant: r.merchant,
        category: r.category,
        amount: Number(r.amount),
        payment_method: r.payment_method,
      }));

    const filters = [
      args.category && `category=${args.category}`,
      args.payment_method && `paid by ${args.payment_method}`,
      args.merchant_contains && `merchant~"${args.merchant_contains}"`,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      result: {
        range: { from, to },
        total_spent: total,
        transaction_count: rows.length,
        average_transaction: rows.length ? round(total / rows.length) : 0,
        grouped_by: groupBy,
        groups,
        largest_transactions: top,
      },
      summary: `Expenses ${from} → ${to}${filters ? ` (${filters})` : ""}${
        groupBy !== "none" ? `, by ${groupBy}` : ""
      } — ₹${total.toLocaleString("en-IN")} across ${rows.length} txns`,
    };
  }

  if (name === "query_income") {
    const from = String(args.from);
    const to = String(args.to);
    const groupBy = typeof args.group_by === "string" ? args.group_by : "none";

    const { data, error } = await supabase
      .from("income")
      .select("*")
      .gte("received_on", from)
      .lte("received_on", to);
    if (error) return { result: { error: error.message }, summary: `failed: ${error.message}` };

    const rows = (data ?? []) as Income[];
    const total = round(sum(rows.map((r) => Number(r.amount))));
    const groups =
      groupBy === "none"
        ? []
        : aggregate(
            rows,
            (r) => Number(r.amount),
            (r) => (groupBy === "source" ? (r.source ?? "Unknown") : r.received_on.slice(0, 7))
          );

    return {
      result: {
        range: { from, to },
        total_income: total,
        entry_count: rows.length,
        grouped_by: groupBy,
        groups,
      },
      summary: `Income ${from} → ${to}${
        groupBy !== "none" ? `, by ${groupBy}` : ""
      } — ₹${total.toLocaleString("en-IN")} across ${rows.length} entries`,
    };
  }

  return { result: { error: `Unknown tool: ${name}` }, summary: `unknown tool ${name}` };
}

/* ---------------------------------------------------------------- context */

/**
 * A small always-on briefing so the model can answer the common questions
 * without a tool round-trip, and knows what date "last quarter" is relative to.
 */
export async function buildContext(): Promise<string> {
  const today = todayISO();
  const now = new Date();
  const windowStart = monthRange(now.getFullYear(), now.getMonth() - 11).start;
  const thisMonth = monthRange(now.getFullYear(), now.getMonth());

  const [expensesRes, incomeRes, budgetRes, categoryBudgetRes] = await Promise.all([
    supabase.from("expenses").select("*").gte("spent_on", windowStart).lte("spent_on", thisMonth.end),
    supabase.from("income").select("*").gte("received_on", windowStart).lte("received_on", thisMonth.end),
    supabase.from("budget").select("*").eq("month", thisMonth.start).maybeSingle(),
    supabase.from("category_budgets").select("*").eq("month", thisMonth.start),
  ]);

  const expenses = (expensesRes.data ?? []) as Expense[];
  const income = (incomeRes.data ?? []) as Income[];

  const monthly = new Map<string, { spent: number; earned: number }>();
  for (let i = 11; i >= 0; i--) {
    monthly.set(monthRange(now.getFullYear(), now.getMonth() - i).start.slice(0, 7), {
      spent: 0,
      earned: 0,
    });
  }
  for (const e of expenses) {
    const bucket = monthly.get(e.spent_on.slice(0, 7));
    if (bucket) bucket.spent += Number(e.amount);
  }
  for (const i of income) {
    const bucket = monthly.get(i.received_on.slice(0, 7));
    if (bucket) bucket.earned += Number(i.amount);
  }

  const thisMonthExpenses = expenses.filter((e) => e.spent_on >= thisMonth.start);
  const categoryTotals = aggregate(
    thisMonthExpenses,
    (e) => Number(e.amount),
    (e) => e.category
  );

  const recurring = detectRecurring(expenses, today);

  const lines: string[] = [
    `Today is ${today}. All amounts are Indian rupees (₹).`,
    "",
    "MONTHLY TOTALS (last 12 months, spent / earned):",
    ...[...monthly.entries()].map(
      ([month, v]) => `  ${month}: spent ${round(v.spent)}, earned ${round(v.earned)}`
    ),
    "",
    `THIS MONTH (${thisMonth.start.slice(0, 7)}) BY CATEGORY:`,
    ...(categoryTotals.length
      ? categoryTotals.map((c) => `  ${c.key}: ${c.total} (${c.count} txns)`)
      : ["  nothing logged yet"]),
    "",
    "BUDGETS THIS MONTH:",
    budgetRes.data
      ? `  overall limit: ${Number(budgetRes.data.limit_amount)}`
      : "  no overall limit set",
    ...((categoryBudgetRes.data ?? []).map(
      (b) => `  ${b.category} limit: ${Number(b.limit_amount)}`
    ) as string[]),
    "",
    "DETECTED RECURRING CHARGES:",
    ...(recurring.length
      ? recurring.map(
          (r) =>
            `  ${r.merchant} (${r.category}): ~${r.typicalAmount} ${r.cadence}, next ~${r.expectedNext}, status ${r.status}` +
            (r.priceChange
              ? `, price changed ${round(r.priceChange.from)} → ${round(r.priceChange.to)}`
              : "")
        )
      : ["  none detected"]),
    `  total committed per month: ${round(committedMonthlySpend(recurring))}`,
  ];

  return lines.join("\n");
}

export const SYSTEM_INSTRUCTION = `You are the analyst for a personal finance tracker used by one person in India. Answer questions about their money.

Rules:
- NEVER do arithmetic yourself. Not over transactions, and not over the groups a tool returns. If you need a coarser split (e.g. weekend vs weekday) call the tool again with the group_by that produces it directly — do not add up buckets.
- Every figure you state must appear verbatim in the briefing or in a tool result. If you are about to write a number you cannot point at, call a tool instead.
- Before making a comparison ("more than", "up from"), re-read the two figures and check the direction actually holds.
- The briefing already contains monthly totals, this month's category totals, budgets, and detected recurring charges. Answer straight from it when it suffices.
- Use tools for anything narrower: specific date ranges, a single merchant, a category over time, weekday vs weekend, payment method breakdowns.
- Amounts are rupees. Format them like ₹12,340 (no decimals unless they matter).
- Be direct and short. Lead with the number, then one or two sentences of context. No preamble, no bullet lists unless comparing three or more things.
- If the data does not answer the question, say so plainly and say what is missing. Never invent a figure.
- "Last N months" means the N most recent months including the current one, unless the user says otherwise.
- For forecasting questions ("can I afford X"), base it on their actual averages and say which months you used.`;
