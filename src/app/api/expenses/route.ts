import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { orIlikeFilter } from "@/lib/query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const paymentMethod = searchParams.get("paymentMethod");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") ?? "spent_on";
  const sortDir = searchParams.get("sortDir") ?? "desc";

  let query = supabase.from("expenses").select("*");

  if (from) query = query.gte("spent_on", from);
  if (to) query = query.lte("spent_on", to);
  if (category) query = query.eq("category", category);
  if (paymentMethod) query = query.eq("payment_method", paymentMethod);
  if (search) query = query.or(orIlikeFilter(["merchant", "raw_input"], search));

  query = query.order(sortBy, { ascending: sortDir === "asc" });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { raw_input, amount, merchant, category, spent_on, payment_method } = body;

  if (!raw_input || amount === undefined || !category || !spent_on) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (payment_method && !PAYMENT_METHODS.includes(payment_method)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      raw_input,
      amount: numericAmount,
      merchant: merchant || "Unknown",
      category,
      spent_on,
      payment_method: payment_method || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
