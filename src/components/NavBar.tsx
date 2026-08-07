"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import SettingsModal from "./SettingsModal";
import ThemeToggle from "./ThemeToggle";
import { NAV_LINKS } from "./nav-links";

export default function NavBar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold">
            <span className="text-2xl">🐷</span>
            <span>PaisaTrack</span>
          </Link>
          <div className="flex items-center gap-1">
            {/* Destinations live in the bottom tab bar on phones. */}
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-accent text-accent-ink"
                      : "text-muted hover:bg-subtle"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
            <button
              onClick={() => setSettingsOpen(true)}
              className="shrink-0 rounded-full p-2 text-muted transition-colors hover:bg-subtle"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
