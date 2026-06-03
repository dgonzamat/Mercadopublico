"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { T } from "@/components/T";
import { STATS } from "@/lib/siteStats";

const PRIMARY_CTA = {
  href: "/probabilidades",
  es: { label: "Ver probabilidades", sub: "Las 8 hipótesis y dónde está la frontera real" },
  en: { label: "See probabilities", sub: "The 8 hypotheses and where the real frontier is" },
};

const NAV_LINKS = [
  {
    href: "/cases",
    es: { label: "Casos", sub: "52 institucionales · 1947–2026" },
    en: { label: "Cases", sub: "52 institutional · 1947–2026" },
  },
  {
    href: "/atlas",
    es: { label: "Atlas", sub: "Mapa global de casos" },
    en: { label: "Atlas", sub: "Global case map" },
  },
  {
    href: "/resumen",
    es: { label: "Resumen", sub: "Lectura 10 min" },
    en: { label: "Summary", sub: "10-min read" },
  },
  {
    href: "/about",
    es: { label: "Metodología", sub: "Cómo se construyó" },
    en: { label: "Method", sub: "How it was built" },
  },
];

const SECONDARY_LINKS = [
  { href: "/patterns", es: "Patrones", en: "Patterns" },
  { href: "/researchers", es: "Ecosistema", en: "Ecosystem" },
  { href: "/frameworks", es: "Frameworks", en: "Frameworks" },
  { href: "/fuentes", es: "Fuentes", en: "Sources" },
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
        <span>
          {open ? (
            <T es="Cerrar" en="Close" />
          ) : (
            <T es="Menú" en="Menu" />
          )}
        </span>
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
                <T es="Menú · UAP Codex" en="Menu · UAP Codex" />
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
                <span>
                  <T es="Cerrar" en="Close" />
                </span>
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
                  <T es="Empezar aquí" en="Start here" />
                </p>
                <p className="mt-2 font-display text-3xl font-medium leading-tight text-text">
                  <T es={PRIMARY_CTA.es.label} en={PRIMARY_CTA.en.label} />{" "}
                  <span aria-hidden>→</span>
                </p>
                <p className="mt-2 text-sm text-text/80 group-hover:text-muted">
                  <T es={PRIMARY_CTA.es.sub} en={PRIMARY_CTA.en.sub} />
                </p>
              </Link>

              {/* NAV PRINCIPAL */}
              <p className="mt-10 font-mono text-xs uppercase tracking-widest text-bg/60">
                <T es={`Explorar los ${STATS.cases} casos`} en={`Explore the ${STATS.cases} cases`} />
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
                          <T es={l.es.label} en={l.en.label} />
                        </p>
                        <p className="text-xs text-bg/60 group-hover:text-muted">
                          <T es={l.es.sub} en={l.en.sub} />
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
                <T es="Material complementario" en="Supplementary material" />
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4">
                {SECONDARY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block min-h-[48px] py-3 text-sm font-medium text-bg underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <T es={l.es} en={l.en} />
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-12 border-t border-bg/15 pt-5 font-mono text-[11px] uppercase tracking-widest text-bg/60">
                <T
                  es="UAP Codex · análisis institucional · 1947–2026"
                  en="UAP Codex · institutional analysis · 1947–2026"
                />
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
