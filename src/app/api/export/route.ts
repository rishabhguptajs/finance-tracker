import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { orIlikeFilter } from "@/lib/query";
import type { Expense, Income } from "@/lib/types";

type Row = {
  date: string;
  type: "Expense" | "Income";
  amount: number;
  category: string;
  paymentMethod: string;
  merchant: string;
  rawInput: string;
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(rows: Row[]): string {
  const header = ["Date", "Type", "Amount", "Category", "Payment Method", "Merchant/Source", "Raw Input"];
  const lines = rows.map((r) =>
    [
      r.date,
      r.type,
      r.amount.toString(),
      r.category,
      r.paymentMethod,
      r.merchant,
      r.rawInput,
    ]
      .map((v) => csvEscape(v))
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const paymentMethod = searchParams.get("paymentMethod");
  const search = searchParams.get("search");
  const entryType = searchParams.get("entryType") ?? "all";

  const rows: Row[] = [];

  if (entryType !== "income") {
    let query = supabase.from("expenses").select("*");
    if (from) query = query.gte("spent_on", from);
    if (to) query = query.lte("spent_on", to);
    if (category) query = query.eq("category", category);
    if (paymentMethod) query = query.eq("payment_method", paymentMethod);
    if (search) query = query.or(orIlikeFilter(["merchant", "raw_input"], search));
    query = query.order("spent_on", { ascending: false });

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const e of data as Expense[]) {
      rows.push({
        date: e.spent_on,
        type: "Expense",
        amount: Number(e.amount),
        category: e.category ?? "",
        paymentMethod: e.payment_method ?? "",
        merchant: e.merchant ?? "",
        rawInput: e.raw_input ?? "",
      });
    }
  }

  if (entryType !== "expense" && !category && !paymentMethod) {
    let query = supabase.from("income").select("*");
    if (from) query = query.gte("received_on", from);
    if (to) query = query.lte("received_on", to);
    if (search) query = query.or(orIlikeFilter(["source", "raw_input"], search));
    query = query.order("received_on", { ascending: false });

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    for (const i of data as Income[]) {
      rows.push({
        date: i.received_on,
        type: "Income",
        amount: Number(i.amount),
        category: "",
        paymentMethod: "",
        merchant: i.source ?? "",
        rawInput: i.raw_input ?? "",
      });
    }
  }

  rows.sort((a, b) => b.date.localeCompare(a.date));

  const csv = toCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finances-${stamp}.csv"`,
    },
  });
}
