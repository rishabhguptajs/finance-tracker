"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import SettingsModal from "./SettingsModal";
import ThemeToggle from "./ThemeToggle";
import { GearIcon, PiggyIcon } from "./icons";
import { NAV_LINKS } from "./nav-links";

export default function NavBar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <Link
            href="/"
            className="press flex shrink-0 items-center gap-2 text-section text-ink"
          >
            <PiggyIcon className="h-[26px] w-[26px]" />
            <span>PaisaTrack</span>
          </Link>
          <div className="flex items-center gap-1">
            {/* Destinations live in the bottom tab bar on phones. */}
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className={clsx(
                    "press shrink-0 rounded-full px-3.5 py-2 text-subhead font-medium",
                    pathname === href
                      ? "bg-accent text-accent-ink"
                      : "text-muted hover:bg-subtle"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
            <button
              onClick={() => setSettingsOpen(true)}
              className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-subtle"
              aria-label="Settings"
            >
              <GearIcon className="h-[21px] w-[21px]" />
            </button>
          </div>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
