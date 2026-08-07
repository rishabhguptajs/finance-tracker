"use client";

import { useTheme } from "@/components/ThemeProvider";

/**
 * Recharts sets colours as SVG presentation attributes, which do not resolve
 * `var(--token)`. So the chart chrome reads concrete values off the resolved
 * theme instead. Series colours come from CATEGORY_STYLES and need no variant —
 * that palette is validated against both surfaces.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return {
    dark,
    grid: dark ? "#2a2622" : "#f0efec",
    surface: dark ? "#1c1a17" : "#ffffff",
    axisTick: { fontSize: 11, fill: dark ? "#7c766e" : "#a09a92" },
    cursorFill: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    tooltip: {
      borderRadius: 12,
      border: "none",
      backgroundColor: dark ? "#262320" : "#ffffff",
      color: dark ? "#f4f1ec" : "#1f1b16",
      boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.55)" : "0 4px 20px rgba(0,0,0,0.1)",
      fontSize: 12,
    } as const,
    /** Spend is orange everywhere; income is green everywhere. */
    spend: "#ea580c",
    income: "#16a34a",
  };
}
