"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import SettingsModal from "./SettingsModal";

const LINKS = [
  { href: "/", label: "Log" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="text-2xl">💸</span>
            <span>PaisaTrack</span>
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setSettingsOpen(true)}
              className="ml-1 rounded-full p-2 text-neutral-600 hover:bg-neutral-100"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </nav>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
