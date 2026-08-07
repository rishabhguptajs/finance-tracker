import { NextResponse } from "next/server";
import { GoogleGenAI, type Content } from "@google/genai";
import {
  SYSTEM_INSTRUCTION,
  TOOL_DECLARATIONS,
  buildContext,
  runTool,
  type ToolStep,
} from "@/lib/ask";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODEL = "gemini-3.5-flash-lite";

/** Cap the tool loop so a confused model cannot spin. */
const MAX_TURNS = 6;

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "A question is required" }, { status: 400 });
    }

    const context = await buildContext();

    const contents: Content[] = [
      {
        role: "user",
        parts: [{ text: `BRIEFING\n${context}\n\nQUESTION\n${question.trim()}` }],
      },
    ];

    const steps: ToolStep[] = [];

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        },
      });

      const calls = response.functionCalls ?? [];

      if (calls.length === 0) {
        const answer = (response.text ?? "").trim();
        if (!answer) {
          return NextResponse.json(
            { error: "No answer came back. Try rephrasing the question." },
            { status: 502 }
          );
        }
        return NextResponse.json({ answer, steps });
      }

      // Echo the model's turn back verbatim, then answer every call it made.
      const modelParts = response.candidates?.[0]?.content?.parts;
      if (modelParts) contents.push({ role: "model", parts: modelParts });

      const responseParts = [];
      for (const call of calls) {
        const name = call.name ?? "";
        const args = (call.args ?? {}) as Record<string, unknown>;
        const { result, summary } = await runTool(name, args);
        steps.push({ tool: name, args, summary });
        responseParts.push({
          functionResponse: { name, response: result as Record<string, unknown> },
        });
      }

      contents.push({ role: "user", parts: responseParts });
    }

    return NextResponse.json(
      { error: "Gave up after too many lookups. Try a narrower question.", steps },
      { status: 504 }
    );
  } catch (err) {
    console.error("Ask error:", err);
    return NextResponse.json(
      { error: "Could not answer that right now. Try again." },
      { status: 500 }
    );
  }
}
