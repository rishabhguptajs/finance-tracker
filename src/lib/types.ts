export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Entertainment",
  "Health",
  "Groceries",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_METHODS = ["UPI", "Card", "Cash", "Netbanking", "Other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Expense {
  id: string;
  raw_input: string;
  amount: number;
  merchant: string | null;
  category: Category;
  spent_on: string; // YYYY-MM-DD
  payment_method: PaymentMethod | null;
  created_at: string;
}

export interface Income {
  id: string;
  raw_input: string;
  amount: number;
  source: string | null;
  received_on: string; // YYYY-MM-DD
  created_at: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM-01
  limit_amount: number;
  created_at: string;
}

export interface CategoryBudget {
  id: string;
  month: string; // YYYY-MM-01
  category: Category;
  limit_amount: number;
  created_at: string;
}

/** One entry pulled out of a free-text line. Income entries have no category. */
export interface ExtractedEntry {
  kind: "expense" | "income";
  amount: number;
  /** Merchant for expenses, source (employer, client, …) for income. */
  merchant: string;
  category: Category;
  date: string; // YYYY-MM-DD
  payment_method: PaymentMethod | null;
}
