import { mutate } from "swr";
import { BUDGET_PREFIX, EXPENSES_PREFIX, INCOME_PREFIX } from "./fetcher";

function revalidatePrefix(prefix: string) {
  return mutate((key) => typeof key === "string" && key.startsWith(prefix));
}

export function revalidateExpenses() {
  return revalidatePrefix(EXPENSES_PREFIX);
}

export function revalidateIncome() {
  return revalidatePrefix(INCOME_PREFIX);
}

export function revalidateBudget() {
  return revalidatePrefix(BUDGET_PREFIX);
}
