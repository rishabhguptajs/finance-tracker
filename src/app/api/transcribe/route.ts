import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { audio, mimeType } = await request.json();

    if (typeof audio !== "string" || !audio.trim()) {
      return NextResponse.json({ error: "Audio data is required" }, { status: 400 });
    }
    if (typeof mimeType !== "string" || !mimeType.trim()) {
      return NextResponse.json({ error: "Audio mime type is required" }, { status: 400 });
    }

    const text = await transcribeAudio(audio, mimeType);

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: "Couldn't transcribe that. Please try again or type it instead." },
      { status: 500 }
    );
  }
}
