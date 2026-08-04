"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatINR } from "@/lib/format";

interface DayPoint {
  day: string;
  total: number;
}

export default function DailySpendChart({ data }: { data: DayPoint[] }) {
  if (data.every((d) => d.total === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
        No daily data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap={2}>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#a3a3a3" }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <Tooltip
          formatter={(value) => [formatINR(Number(value)), "Spent"]}
          labelFormatter={(label) => `Day ${label}`}
          contentStyle={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        />
        <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
