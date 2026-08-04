import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const { password } = await request.json();
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: "App password not configured" }, { status: 500 });
  }

  if (typeof password !== "string" || !safeCompare(password, expected)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
