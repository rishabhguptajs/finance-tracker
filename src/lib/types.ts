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

export interface Expense {
  id: string;
  raw_input: string;
  amount: number;
  merchant: string | null;
  category: Category;
  spent_on: string; // YYYY-MM-DD
  created_at: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM-01
  limit_amount: number;
  created_at: string;
}

export interface ExtractedExpense {
  amount: number;
  merchant: string;
  category: Category;
  date: string; // YYYY-MM-DD
}
