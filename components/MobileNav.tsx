"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/cases", label: "Casos" },
  { href: "/atlas", label: "Atlas" },
  { href: "/patterns", label: "Patrones" },
  { href: "/researchers", label: "Researchers" },
  { href: "/frameworks", label: "Frameworks" },
  { href: "/about", label: "Metodología" },
  { href: "/resumen", label: "Resumen" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-text hover:bg-panel"
      >
        <span aria-hidden className="text-xl leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open && (
        <div
          className="sm:hidden fixed inset-0 top-[57px] z-40 bg-bg/95 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            className="border-t border-border bg-bg px-4 py-4"
            onClick={(e) => e.stopPropagation()}
            aria-label="Navegación principal"
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-base text-text hover:bg-panel"
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
