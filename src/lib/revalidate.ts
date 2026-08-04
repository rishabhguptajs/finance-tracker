import { mutate } from "swr";
import { BUDGET_PREFIX, EXPENSES_PREFIX } from "./fetcher";

export function revalidateExpenses() {
  return mutate((key) => typeof key === "string" && key.startsWith(EXPENSES_PREFIX));
}

export function revalidateBudget() {
  return mutate((key) => typeof key === "string" && key.startsWith(BUDGET_PREFIX));
}
