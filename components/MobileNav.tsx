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
        className="sm:hidden inline-flex h-11 items-center gap-2 rounded-none border-2 border-text bg-bg px-3 font-mono text-xs uppercase tracking-widest text-text hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden className="text-base leading-none">
          {open ? "✕" : "☰"}
        </span>
        <span>{open ? "Cerrar" : "Menú"}</span>
      </button>

      {open && (
        <div
          id="mobile-nav-drawer"
          className="sm:hidden fixed left-0 right-0 top-16 bottom-0 z-40 overflow-y-auto bg-bg"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <nav
            className="min-h-full bg-bg px-4 py-6"
            onClick={(e) => e.stopPropagation()}
            aria-label="Navegación principal"
          >
            {/* CTA PRIMARIO */}
            <Link
              ref={firstLinkRef}
              href={PRIMARY_CTA.href}
              onClick={() => setOpen(false)}
              className="group block bg-accent p-6 hover:bg-text"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-bg/70">
                Empezar aquí
              </p>
              <p className="mt-2 font-display text-3xl font-medium leading-tight text-bg">
                {PRIMARY_CTA.label} <span aria-hidden>→</span>
              </p>
              <p className="mt-2 text-sm text-bg/80">{PRIMARY_CTA.sub}</p>
            </Link>

            {/* NAV PRINCIPAL */}
            <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted">
              Navegar el corpus
            </p>
            <ul className="mt-3 divide-y divide-text/10 border-y border-text/15">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="group flex min-h-[60px] items-center justify-between gap-4 py-4 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-display text-2xl font-medium leading-tight text-text group-hover:text-accent">
                        {l.label}
                      </p>
                      <p className="text-xs text-muted">{l.sub}</p>
                    </div>
                    <span
                      aria-hidden
                      className="shrink-0 font-mono text-lg text-muted group-hover:text-accent"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* NAV SECUNDARIO */}
            <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted">
              Más
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4">
              {SECONDARY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block min-h-[48px] py-3 text-sm font-medium text-text underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* FOOTER LINE */}
            <p className="mt-10 border-t border-text/15 pt-4 font-mono text-[11px] uppercase tracking-widest text-muted">
              UAP Atlas · análisis institucional · 1947–2026
            </p>
          </nav>
        </div>
      )}
    </>
  );
}
