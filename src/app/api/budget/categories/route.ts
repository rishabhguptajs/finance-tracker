import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, type Category } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "month query param required (YYYY-MM-01)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("category_budgets")
    .select("*")
    .eq("month", month);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categoryBudgets: data ?? [] });
}

/**
 * Replaces the whole set of category limits for a month in one call — that is
 * how the settings sheet edits them. A category sent with a non-positive limit
 * (or left out entirely) ends up uncapped.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { month, budgets } = body;

  if (!month || !Array.isArray(budgets)) {
    return NextResponse.json(
      { error: "month and budgets[] are required" },
      { status: 400 }
    );
  }

  const toUpsert: { month: string; category: Category; limit_amount: number }[] = [];
  const toClear: Category[] = [];

  for (const entry of budgets) {
    const category = entry?.category;
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 });
    }
    const amount = Number(entry.limit_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toClear.push(category);
    } else {
      toUpsert.push({ month, category, limit_amount: amount });
    }
  }

  if (toClear.length > 0) {
    const { error } = await supabase
      .from("category_budgets")
      .delete()
      .eq("month", month)
      .in("category", toClear);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("category_budgets")
      .upsert(toUpsert, { onConflict: "month,category" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("category_budgets")
    .select("*")
    .eq("month", month);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categoryBudgets: data ?? [] });
}
