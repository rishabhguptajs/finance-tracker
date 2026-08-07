"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useChartTheme } from "@/lib/chart-theme";
import { formatINR } from "@/lib/format";

interface DayPoint {
  day: string;
  total: number;
}

export default function DailySpendChart({ data }: { data: DayPoint[] }) {
  const chart = useChartTheme();

  if (data.every((d) => d.total === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-faint">
        No daily data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap={2}>
        <XAxis
          dataKey="day"
          tick={chart.axisTick}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <Tooltip
          cursor={{ fill: chart.cursorFill }}
          formatter={(value) => [formatINR(Number(value)), "Spent"]}
          labelFormatter={(label) => `Day ${label}`}
          contentStyle={chart.tooltip}
        />
        <Bar dataKey="total" fill={chart.spend} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
