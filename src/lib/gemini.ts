import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import { CATEGORIES, PAYMENT_METHODS, type ExtractedEntry, type PaymentMethod } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function buildPrompt(input: string, todayDDMMYYYY: string): string {
  return `Extract structured data from this money entry: "${input}"
Today's date is ${todayDDMMYYYY} in DD/MM/YYYY format.
Categories (pick exactly one, expenses only): ${CATEGORIES.join(", ")}
Payment methods (pick exactly one, or null if not stated): ${PAYMENT_METHODS.join(", ")}

The entry may describe ONE item or MULTIPLE separate items (e.g. separated by commas, "and", newlines, or several distinct amounts mentioned in one sentence). Identify every distinct item mentioned.

Each item is either money going OUT ("expense") or money coming IN ("income").
Treat salary, freelance payment, refund, cashback, interest, dividend, reimbursement, or anything described as received/credited/earned as "income". Everything else is an "expense".

Return ONLY valid JSON, no markdown formatting: a JSON array where each element is one item, in the order mentioned:
[
  {
    "kind": "expense" | "income",
    "amount": number,
    "merchant": string,
    "category": string,
    "date": "YYYY-MM-DD",
    "payment_method": string | null
  }
]
If there is only one item, return an array with a single object.
If no date is mentioned for an item, use today's date.
Be careful not to confuse a year with an amount: a number immediately followed by "rs", "rupees", "₹", or similar is always the amount, never a year, even if it looks like a year (e.g. "1999rs" is amount 1999, not the year 1999). Dates in this input never include a year unless it's clearly written as part of a date phrase separate from the currency amount.
For income, "merchant" is the source (employer, client, platform) and "category" should be "Other".
If merchant is unclear, make a reasonable guess from context or use "Unknown".
Only set "payment_method" when the text actually indicates it (e.g. "paid by card", "upi", "cash", "gpay" -> UPI). Otherwise use null.`;
}

function parseOne(raw: unknown): ExtractedEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const result = raw as Record<string, unknown>;
  if (!("amount" in result) || !("date" in result)) return null;

  const kind = result.kind === "income" ? "income" : "expense";
  const amount = Number(result.amount);
  const category = CATEGORIES.includes(result.category as never)
    ? (result.category as ExtractedEntry["category"])
    : "Other";
  const merchant =
    typeof result.merchant === "string" && result.merchant.trim()
      ? result.merchant.trim()
      : "Unknown";
  const date =
    typeof result.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result.date)
      ? result.date
      : null;
  const payment_method = PAYMENT_METHODS.includes(result.payment_method as never)
    ? (result.payment_method as PaymentMethod)
    : null;

  if (!Number.isFinite(amount) || amount <= 0 || !date) return null;

  return { kind, amount, merchant, category, date, payment_method };
}

export async function extractEntries(
  input: string,
  todayDDMMYYYY: string
): Promise<ExtractedEntry[]> {
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
  const items = rawItems.map(parseOne).filter((e): e is ExtractedEntry => e !== null);

  if (items.length === 0) {
    throw new Error("Gemini response had no valid entries");
  }

  return items;
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      "Transcribe this audio exactly as spoken. Return only the raw transcription, no commentary, no markdown formatting.",
      createPartFromBase64(base64Audio, mimeType),
    ],
  });

  const text = (response.text ?? "").trim();
  if (!text) {
    throw new Error("Gemini returned an empty transcription");
  }

  return text;
}
