import { type Category } from "./types";

/**
 * One hue per category, validated to stay legible on both the light and the dark
 * chart surface (OKLCH lightness band, chroma floor, colour-vision-deficiency
 * separation, contrast). Because every step sits in the overlap of the two bands,
 * the same hex works in both themes — no second palette to keep in sync.
 *
 * "Other" is deliberately a low-chroma neutral: it is the catch-all bucket and
 * should recede rather than compete with a real category.
 */
export const CATEGORY_STYLES: Record<Category, { hex: string }> = {
  Food: { hex: "#ea580c" },
  Transport: { hex: "#2563eb" },
  Shopping: { hex: "#db2777" },
  Bills: { hex: "#dc2626" },
  Subscriptions: { hex: "#9333ea" },
  Entertainment: { hex: "#b8860b" },
  Health: { hex: "#16a34a" },
  Groceries: { hex: "#0891b2" },
  Other: { hex: "#64748b" },
};

/**
 * Order to lay categories out in when they end up touching each other — stacked
 * bars, donut slices. Chosen so no two adjacent hues collide under colour-vision
 * deficiency; the declaration order in CATEGORIES is for menus, not for paint.
 */
export const CATEGORY_STACK_ORDER: Category[] = [
  "Food",
  "Groceries",
  "Shopping",
  "Health",
  "Subscriptions",
  "Entertainment",
  "Transport",
  "Bills",
  "Other",
];

/** Translucent wash of a category hue, for badges that must work in both themes. */
export function categoryTint(category: Category, alpha = 0.14): string {
  const { hex } = CATEGORY_STYLES[category];
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
