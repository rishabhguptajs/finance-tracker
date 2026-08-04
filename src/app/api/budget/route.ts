import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "month query param required (YYYY-MM-01)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("budget")
    .select("*")
    .eq("month", month)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ budget: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { month, limit_amount } = body;

  if (!month || limit_amount === undefined) {
    return NextResponse.json({ error: "month and limit_amount are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("budget")
    .upsert({ month, limit_amount: Number(limit_amount) }, { onConflict: "month" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ budget: data });
}
