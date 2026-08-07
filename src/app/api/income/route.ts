import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { orIlikeFilter } from "@/lib/query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") ?? "received_on";
  const sortDir = searchParams.get("sortDir") ?? "desc";

  let query = supabase.from("income").select("*");

  if (from) query = query.gte("received_on", from);
  if (to) query = query.lte("received_on", to);
  if (search) query = query.or(orIlikeFilter(["source", "raw_input"], search));

  query = query.order(sortBy, { ascending: sortDir === "asc" });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ income: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { raw_input, amount, source, received_on } = body;

  if (!raw_input || amount === undefined || !received_on) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("income")
    .insert({
      raw_input,
      amount: numericAmount,
      source: source || "Unknown",
      received_on,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ income: data }, { status: 201 });
}
