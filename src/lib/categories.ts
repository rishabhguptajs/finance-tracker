import type { Category } from "./types";

interface CategoryStyle {
  hex: string;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

export const CATEGORY_STYLES: Record<Category, CategoryStyle> = {
  Food: {
    hex: "#f97316",
    bg: "bg-orange-100",
    text: "text-orange-700",
    ring: "ring-orange-200",
    dot: "bg-orange-500",
  },
  Transport: {
    hex: "#3b82f6",
    bg: "bg-blue-100",
    text: "text-blue-700",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
  },
  Shopping: {
    hex: "#ec4899",
    bg: "bg-pink-100",
    text: "text-pink-700",
    ring: "ring-pink-200",
    dot: "bg-pink-500",
  },
  Bills: {
    hex: "#ef4444",
    bg: "bg-red-100",
    text: "text-red-700",
    ring: "ring-red-200",
    dot: "bg-red-500",
  },
  Subscriptions: {
    hex: "#a855f7",
    bg: "bg-purple-100",
    text: "text-purple-700",
    ring: "ring-purple-200",
    dot: "bg-purple-500",
  },
  Entertainment: {
    hex: "#eab308",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    ring: "ring-yellow-200",
    dot: "bg-yellow-500",
  },
  Health: {
    hex: "#22c55e",
    bg: "bg-green-100",
    text: "text-green-700",
    ring: "ring-green-200",
    dot: "bg-green-500",
  },
  Groceries: {
    hex: "#14b8a6",
    bg: "bg-teal-100",
    text: "text-teal-700",
    ring: "ring-teal-200",
    dot: "bg-teal-500",
  },
  Other: {
    hex: "#6b7280",
    bg: "bg-gray-100",
    text: "text-gray-700",
    ring: "ring-gray-200",
    dot: "bg-gray-500",
  },
};
