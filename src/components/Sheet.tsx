"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { CloseIcon } from "./icons";

/**
 * The app's one modal surface: a bottom sheet on phones, a centered dialog on
 * desktop.
 *
 * Rising from the bottom edge isn't decoration — it puts the controls under the
 * thumb instead of at the top of a 6-inch screen, and it's the gesture language
 * the OS already uses for "this is a temporary layer over what you were doing".
 * A centered card on a phone wastes the reachable half of the display.
 */
export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Pinned below the scroll area, so the primary action never scrolls away. */
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    // Without this the page behind keeps scrolling under the sheet, which on
    // iOS also drags the sheet around with it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "animate-sheet-up flex max-h-[92vh] w-full flex-col bg-surface outline-none",
          // Only the top corners round on a phone: the sheet is attached to the
          // bottom edge, and rounding all four makes it float unanchored.
          "rounded-t-[1.75rem] shadow-[var(--shadow-sheet)]",
          "sm:animate-sheet-zoom sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl"
        )}
      >
        {/* The grabber reads as "this can be dismissed" before you touch it. */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-1 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 className="text-title text-ink">{title}</h2>
            {description && <p className="mt-1 text-subhead text-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="press -mr-1.5 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-subtle"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 sm:px-6 sm:py-4">
          {children}
        </div>

        {footer && (
          <div className="border-t border-line px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
