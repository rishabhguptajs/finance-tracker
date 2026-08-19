"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_LINKS } from "./nav-links";

/**
 * Phone-only tab bar. A top nav with five destinations is unreachable one-handed,
 * and a bottom bar is what makes an installed PWA feel like an app rather than a
 * site in a fullscreen window.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line sm:hidden",
        // Heavy blur over a translucent bar: content scrolling underneath stays
        // faintly visible, which is what separates a system tab bar from an
        // opaque strip pasted on top of the page.
        "bg-canvas/80 backdrop-blur-xl backdrop-saturate-150",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-stretch justify-around">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                // 44pt floor: the old py-2 row was roughly 34px, under the size
                // a thumb can reliably hit.
                "press flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 pt-1.5 pb-1",
                active ? "text-ink" : "text-faint"
              )}
            >
              <Icon className="h-[22px] w-[22px]" active={active} />
              <span
                className={clsx(
                  "truncate text-[11px] leading-none",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
