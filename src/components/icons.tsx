/**
 * One stroke-drawn icon set, replacing the emoji the UI used to lean on.
 *
 * Emoji can't take a state: they're multicolored, so an active tab had to be
 * faked with opacity, and every platform draws them differently. These inherit
 * `currentColor` and thicken when active, which is how a native tab bar reads.
 *
 * All icons share a 24x24 box and round caps so they sit on the same optical
 * grid — mixing stroke widths or corner styles is what makes an icon set look
 * assembled from stock parts.
 */

export interface IconProps {
  className?: string;
  /** Thickens the stroke, for the selected tab in a tab bar. */
  active?: boolean;
}

function Svg({
  className = "h-6 w-6",
  active = false,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="M14.5 6.5 17.5 9.5" />
    </Svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19h16" />
      <path d="M7 19v-6" />
      <path d="M12 19V6" />
      <path d="M17 19v-9" />
    </Svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12a7.5 7.5 0 0 1-7.5 7.5c-1.2 0-2.4-.3-3.4-.8L4 20l1.4-4.4A7.5 7.5 0 1 1 20 12Z" />
    </Svg>
  );
}

export function TrendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 16.5 9.5 11l3.5 3.5L20 7.5" />
      <path d="M15 7.5h5v5" />
    </Svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.5v-17Z" />
      <path d="M9.5 9h5" />
      <path d="M9.5 13h5" />
    </Svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Teeth are drawn crossing an outer ring rather than as free-floating
          rays — detached spokes around a dot read as a sun, which is exactly
          what the first attempt looked like next to the theme toggle. */}
      <circle cx="12" cy="12" r="7.2" />
      <circle cx="12" cy="12" r="2.9" />
      <path d="M18.6 12H21M16.67 7.33 18.36 5.64M12 5.4V3M7.33 7.33 5.64 5.64M5.4 12H3M7.33 16.67 5.64 18.36M12 18.6V21M16.67 16.67l1.69 1.69" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4M19.1 19.1l-1.4-1.4M6.3 6.3 4.9 4.9" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </Svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20.5h6M12 16.5v4" />
    </Svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6 7l.9 12.1A2 2 0 0 0 8.9 21h6.2a2 2 0 0 0 2-1.9L18 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.3" r=".9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5" />
      <path d="M5 19h14" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m14.5 5-7 7 7 7" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9.5 5 7 7-7 7" />
    </Svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </Svg>
  );
}

/**
 * The app icon's piggy face, reduced to a stroke mark for the header — the same
 * geometry as `PiggyMark` in lib/icon-art, scaled from its 512 box down to 24.
 * Two different pigs, one on the home screen and one in the header, would read
 * as two different apps.
 *
 * The ears are filled and drawn first so the head outline crosses them, which
 * is what makes them sit behind the head rather than sprout from it.
 */
export function PiggyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M9.66 7.13C8.25 4.69 6.66 4.13 6 5.25c-.66 1.13-.19 2.81.66 3.47Z"
        fill="currentColor"
      />
      <path
        d="M14.34 7.13c1.41-2.44 3-3 3.66-1.88.66 1.13.19 2.81-.66 3.47Z"
        fill="currentColor"
      />
      <rect x="4.73" y="5.91" width="14.54" height="11.63" rx="5.53" />
      <circle cx="9.28" cy="10.9" r=".85" fill="currentColor" stroke="none" />
      <circle cx="14.72" cy="10.9" r=".85" fill="currentColor" stroke="none" />
      {/* The coin slot doubles as the smile, same as the app icon. */}
      <path d="M9.19 14.6q2.81 1.6 5.62 0" />
    </Svg>
  );
}
