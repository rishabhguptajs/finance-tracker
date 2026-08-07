import { NextResponse } from "next/server";
import { extractEntries } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (typeof input !== "string" || !input.trim()) {
      return NextResponse.json({ error: "Input text is required" }, { status: 400 });
    }

    const now = new Date();
    const todayDDMMYYYY = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${now.getFullYear()}`;

    const extracted = await extractEntries(input.trim(), todayDDMMYYYY);

    return NextResponse.json({ extracted });
  } catch (err) {
    console.error("Extraction error:", err);
    return NextResponse.json(
      { error: "Failed to read that entry. Please try again or enter manually." },
      { status: 500 }
    );
  }
}
