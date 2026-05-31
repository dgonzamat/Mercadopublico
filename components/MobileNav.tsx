"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/cases", label: "Casos" },
  { href: "/probabilidades", label: "Probabilidades" },
  { href: "/atlas", label: "Atlas" },
  { href: "/about", label: "Metodología" },
  { href: "/resumen", label: "Resumen" },
];

const SECONDARY_LINKS = [
  { href: "/patterns", label: "Patrones" },
  { href: "/researchers", label: "Ecosistema" },
  { href: "/frameworks", label: "Frameworks" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Close on Escape + lock body scroll + focus first link when drawer opens.
  // This is the shadcn Sheet pattern reproduced manually (zero deps).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-text hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden className="text-xl leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open && (
        <div
          id="mobile-nav-drawer"
          className="sm:hidden fixed inset-0 top-[57px] z-40 overflow-y-auto bg-bg/95 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            className="min-h-full border-t border-border bg-bg px-4 py-4"
            onClick={(e) => e.stopPropagation()}
            aria-label="Navegación principal"
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((l, i) => (
                <li key={l.href}>
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-base text-text hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-6 px-3 font-mono text-[11px] uppercase tracking-widest text-muted">
              Más
            </p>
            <ul className="mt-2 space-y-1">
              {SECONDARY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-sm text-muted hover:bg-panel hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
