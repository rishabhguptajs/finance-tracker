"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Category } from "@/lib/types";
import { CATEGORY_STYLES } from "@/lib/categories";
import { useChartTheme } from "@/lib/chart-theme";
import { formatINR } from "@/lib/format";

interface Slice {
  category: Category;
  total: number;
}

export default function CategoryDonutChart({
  data,
  selected,
  onSelect,
}: {
  data: Slice[];
  selected: Category | null;
  onSelect: (c: Category | null) => void;
}) {
  const chart = useChartTheme();
  const total = data.reduce((s, d) => s + d.total, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-faint">
        No spending yet this month.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            cornerRadius={6}
            onClick={(entry) => {
              const cat = (entry as unknown as Slice).category;
              onSelect(selected === cat ? null : cat);
            }}
          >
            {data.map((slice) => (
              <Cell
                key={slice.category}
                fill={CATEGORY_STYLES[slice.category].hex}
                opacity={selected && selected !== slice.category ? 0.3 : 1}
                cursor="pointer"
                stroke={chart.surface}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatINR(Number(value)), String(name)]}
            contentStyle={chart.tooltip}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map((slice) => (
          <button
            key={slice.category}
            onClick={() => onSelect(selected === slice.category ? null : slice.category)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted transition-opacity"
            style={{ opacity: selected && selected !== slice.category ? 0.4 : 1 }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CATEGORY_STYLES[slice.category].hex }}
            />
            {slice.category}
            <span className="text-faint">
              {total > 0 ? Math.round((slice.total / total) * 100) : 0}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
