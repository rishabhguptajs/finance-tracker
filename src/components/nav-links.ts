export interface NavLink {
  href: string;
  label: string;
  icon: string;
}

/** Shared so the top bar and the phone tab bar can never drift apart. */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Log", icon: "✏️" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/ask", label: "Ask", icon: "💬" },
  { href: "/trends", label: "Trends", icon: "📈" },
  { href: "/transactions", label: "Activity", icon: "🧾" },
];
