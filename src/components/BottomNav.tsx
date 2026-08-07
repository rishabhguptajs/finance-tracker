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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="flex items-stretch justify-around">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-ink" : "text-faint"
              )}
            >
              <span className={clsx("text-lg leading-none", !active && "opacity-60")}>
                {link.icon}
              </span>
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
