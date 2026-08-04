import { CATEGORY_STYLES } from "@/lib/categories";
import type { Category } from "@/lib/types";

export default function CategoryBadge({ category }: { category: Category }) {
  const style = CATEGORY_STYLES[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {category}
    </span>
  );
}
