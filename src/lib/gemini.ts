import { GoogleGenAI } from "@google/genai";
import { CATEGORIES, type ExtractedExpense } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function buildPrompt(input: string, todayDDMMYYYY: string): string {
  return `Extract structured data from this expense entry: "${input}"
Today's date is ${todayDDMMYYYY} in DD/MM/YYYY format.
Categories (pick exactly one): Food, Transport, Shopping, Bills, Subscriptions, Entertainment, Health, Groceries, Other

The entry may describe ONE expense or MULTIPLE separate expenses (e.g. separated by commas, "and", newlines, or several distinct amounts mentioned in one sentence). Identify every distinct expense mentioned.

Return ONLY valid JSON, no markdown formatting: a JSON array where each element is one expense, in the order mentioned:
[
  {
    "amount": number,
    "merchant": string,
    "category": string,
    "date": "YYYY-MM-DD"
  }
]
If there is only one expense, return an array with a single object.
If no date is mentioned for an expense, use today's date.
If merchant is unclear, make a reasonable guess from context or use "Unknown".`;
}

function parseOne(raw: unknown): ExtractedExpense | null {
  if (typeof raw !== "object" || raw === null) return null;
  const result = raw as Record<string, unknown>;
  if (!("amount" in result) || !("category" in result) || !("date" in result)) return null;

  const amount = Number(result.amount);
  const category = CATEGORIES.includes(result.category as never)
    ? (result.category as ExtractedExpense["category"])
    : "Other";
  const merchant =
    typeof result.merchant === "string" && result.merchant.trim()
      ? result.merchant.trim()
      : "Unknown";
  const date =
    typeof result.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result.date)
      ? result.date
      : null;

  if (!Number.isFinite(amount) || amount <= 0 || !date) return null;

  return { amount, merchant, category, date };
}

export async function extractExpenses(
  input: string,
  todayDDMMYYYY: string
): Promise<ExtractedExpense[]> {
  const prompt = buildPrompt(input, todayDDMMYYYY);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const text = (response.text ?? "").trim();
  const cleaned = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  const rawItems = Array.isArray(parsed) ? parsed : [parsed];
  const items = rawItems.map(parseOne).filter((e): e is ExtractedExpense => e !== null);

  if (items.length === 0) {
    throw new Error("Gemini response had no valid expenses");
  }

  return items;
}
