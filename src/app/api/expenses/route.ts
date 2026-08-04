import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") ?? "spent_on";
  const sortDir = searchParams.get("sortDir") ?? "desc";

  let query = supabase.from("expenses").select("*");

  if (from) query = query.gte("spent_on", from);
  if (to) query = query.lte("spent_on", to);
  if (category) query = query.eq("category", category);
  if (search) query = query.or(`merchant.ilike.%${search}%,raw_input.ilike.%${search}%`);

  query = query.order(sortBy, { ascending: sortDir === "asc" });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { raw_input, amount, merchant, category, spent_on } = body;

  if (!raw_input || !amount || !category || !spent_on) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      raw_input,
      amount: Number(amount),
      merchant: merchant || "Unknown",
      category,
      spent_on,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
