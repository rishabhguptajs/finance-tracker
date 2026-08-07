import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.amount !== undefined) updates.amount = Number(body.amount);
  if (body.merchant !== undefined) updates.merchant = body.merchant;
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = body.category;
  }
  if (body.spent_on !== undefined) updates.spent_on = body.spent_on;
  if (body.payment_method !== undefined) {
    if (body.payment_method && !PAYMENT_METHODS.includes(body.payment_method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    updates.payment_method = body.payment_method || null;
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
