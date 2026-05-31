"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const PRIMARY_CTA = {
  href: "/probabilidades",
  label: "Ver probabilidades",
  sub: "Las 6 hipótesis sobre UAP",
};

const NAV_LINKS = [
  { href: "/cases", label: "Casos", sub: "52 institucionales · 1947–2026" },
  { href: "/atlas", label: "Atlas", sub: "Mapa global de casos" },
  { href: "/resumen", label: "Resumen", sub: "Lectura 10 min" },
  { href: "/about", label: "Metodología", sub: "Cómo se construyó" },
];

const SECONDARY_LINKS = [
  { href: "/patterns", label: "Patrones" },
  { href: "/researchers", label: "Ecosistema" },
  { href: "/frameworks", label: "Frameworks" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

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
        className="sm:hidden inline-flex items-center gap-3 self-stretch border-l-4 border-text bg-accent px-5 font-display text-base font-medium text-bg hover:bg-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden className="text-lg leading-none">
          {open ? "✕" : "☰"}
        </span>
        <span>{open ? "Cerrar" : "Menú"}</span>
      </button>

      {open && (
        <div
          id="mobile-nav-drawer"
          className="sm:hidden fixed inset-0 z-40 overflow-y-auto bg-text text-bg"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            className="min-h-full bg-text"
            onClick={(e) => e.stopPropagation()}
            aria-label="Navegación principal"
          >
            {/* TOP BAR — matches header height + close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bg/15 bg-text px-4 py-5">
              <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
                Menú · UAP Atlas
              </p>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center gap-2 border-2 border-bg bg-text px-3 font-mono text-xs uppercase tracking-widest text-bg hover:bg-bg hover:text-text"
              >
                <span aria-hidden className="text-base leading-none">
                  ✕
                </span>
                <span>Cerrar</span>
              </button>
            </div>

            <div className="px-4 py-8">
              {/* PRIMARY CTA */}
              <Link
                ref={firstLinkRef}
                href={PRIMARY_CTA.href}
                onClick={() => setOpen(false)}
                className="group block bg-accent p-6 hover:bg-bg hover:text-text"
              >
                <p className="font-mono text-xs uppercase tracking-widest text-text/70 group-hover:text-muted">
                  Empezar aquí
                </p>
                <p className="mt-2 font-display text-3xl font-medium leading-tight text-text">
                  {PRIMARY_CTA.label} <span aria-hidden>→</span>
                </p>
                <p className="mt-2 text-sm text-text/80 group-hover:text-muted">
                  {PRIMARY_CTA.sub}
                </p>
              </Link>

              {/* NAV PRINCIPAL */}
              <p className="mt-10 font-mono text-xs uppercase tracking-widest text-bg/60">
                Navegar el corpus
              </p>
              <ul className="mt-4 divide-y divide-bg/15 border-y border-bg/15">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="group flex min-h-[68px] items-center justify-between gap-4 py-5 hover:bg-bg hover:px-4 hover:-mx-4 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-display text-2xl font-medium leading-tight text-bg group-hover:text-text">
                          {l.label}
                        </p>
                        <p className="text-xs text-bg/60 group-hover:text-muted">
                          {l.sub}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className="shrink-0 font-mono text-lg text-bg/60 group-hover:text-accent"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* NAV SECUNDARIO */}
              <p className="mt-10 font-mono text-xs uppercase tracking-widest text-bg/60">
                Más
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4">
                {SECONDARY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block min-h-[48px] py-3 text-sm font-medium text-bg underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-12 border-t border-bg/15 pt-5 font-mono text-[11px] uppercase tracking-widest text-bg/60">
                UAP Atlas · análisis institucional · 1947–2026
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
