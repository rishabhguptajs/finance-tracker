import {
  ChartIcon,
  ChatIcon,
  PencilIcon,
  ReceiptIcon,
  TrendIcon,
  type IconProps,
} from "./icons";

export interface NavLink {
  href: string;
  label: string;
  Icon: (props: IconProps) => React.ReactElement;
}

/** Shared so the top bar and the phone tab bar can never drift apart. */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Log", Icon: PencilIcon },
  { href: "/dashboard", label: "Dashboard", Icon: ChartIcon },
  { href: "/ask", label: "Ask", Icon: ChatIcon },
  { href: "/trends", label: "Trends", Icon: TrendIcon },
  { href: "/transactions", label: "Activity", Icon: ReceiptIcon },
];
