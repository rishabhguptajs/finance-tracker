"use client";

import { CATEGORY_STYLES, categoryTint } from "@/lib/categories";
import type { Category } from "@/lib/types";

export default function CategoryBadge({ category }: { category: Category }) {
  const { hex } = CATEGORY_STYLES[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0 rounded-full px-2 py-0.5 text-caption font-medium"
      style={{ backgroundColor: categoryTint(category), color: hex }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {category}
    </span>
  );
}
