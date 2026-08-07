"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "@/lib/chart-theme";
import { formatINR } from "@/lib/format";

export interface FlowPoint {
  label: string;
  earned: number;
  spent: number;
}

function compactINR(value: number): string {
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${value}`;
}

export default function MonthlyFlowChart({ data }: { data: FlowPoint[] }) {
  const chart = useChartTheme();

  if (data.every((d) => d.earned === 0 && d.spent === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-faint">
        Nothing logged in this range yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chart.grid} />
        <XAxis
          dataKey="label"
          tick={chart.axisTick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={chart.axisTick}
          axisLine={false}
          tickLine={false}
          tickFormatter={compactINR}
          width={56}
        />
        <Tooltip
          cursor={{ fill: chart.cursorFill }}
          formatter={(value, name) => [formatINR(Number(value)), String(name)]}
          contentStyle={chart.tooltip}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs font-medium text-muted">{value}</span>
          )}
        />
        <Bar dataKey="earned" name="Money in" fill={chart.income} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="spent" name="Money out" fill={chart.spend} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
