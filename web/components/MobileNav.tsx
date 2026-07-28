"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizeHref, chromeLocale } from "@/components/LocaleLink";
import { T } from "@/components/T";
import { SiteSearch } from "@/components/SiteSearch";
import { LocaleToggle } from "@/components/LocaleToggle";
import { InstagramLink } from "@/components/InstagramLink";
import { PinterestLink } from "@/components/PinterestLink";
import { AccountControl } from "@/components/auth/AccountControl";
import { useAuth } from "@/components/auth/AuthProvider";
import { STATS } from "@/lib/siteStats";

const PRIMARY_CTA = {
  href: "/probabilidades",
  es: { label: "Ver probabilidades", sub: "El reparto de explicaciones del corpus y dónde está la frontera" },
  en: { label: "See probabilities", sub: "How the corpus splits among explanations, and where the frontier is" },
};

const NAV_LINKS = [
  {
    href: "/cases",
    es: { label: "Casos", sub: `${STATS.cases} institucionales · 1947–2026` },
    en: { label: "Cases", sub: `${STATS.cases} institutional · 1947–2026` },
  },
  {
    href: "/atlas",
    es: { label: "Atlas", sub: "Mapa global de casos" },
    en: { label: "Atlas", sub: "Global case map" },
  },
  {
    href: "/researchers",
    es: { label: "Actores", sub: "El ecosistema de la divulgación" },
    en: { label: "Actors", sub: "The disclosure ecosystem" },
  },
  {
    href: "/blog",
    es: { label: "Blog", sub: "Notas de método y avances" },
    en: { label: "Blog", sub: "Method notes and progress" },
  },
  {
    href: "/about",
    es: { label: "Metodología", sub: "Cómo se construyó" },
    en: { label: "Method", sub: "How it was built" },
  },
  {
    href: "/resumen",
    es: { label: "Resumen", sub: "Lectura 10 min" },
    en: { label: "Summary", sub: "10-min read" },
  },
];

const SECONDARY_LINKS = [
  { href: "/patterns", es: "Patrones", en: "Patterns" },
  { href: "/frameworks", es: "Marcos teóricos", en: "Frameworks" },
  { href: "/cobertura", es: "Cobertura", en: "Coverage" },
  { href: "/releases", es: "Releases PURSUE", en: "PURSUE releases" },
  { href: "/fuentes", es: "Fuentes", en: "Sources" },
  { href: "/contact", es: "Contacto", en: "Contact" },
  { href: "/visitantes", es: "Visitantes", en: "Visitors" },
];

export function MobileNav({ dark = false }: { dark?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const tLocale = chromeLocale(pathname);
  const { user } = useAuth();
  // href efectivo según locale (en /en/ → /en/…); "activo" contra el localizado.
  const hrefFor = (href: string) => localizeHref(href, pathname);
  const isActive = (href: string) => {
    const h = hrefFor(href);
    return pathname === h || pathname.startsWith(`${h}/`);
  };

  // Locale activo para los aria-label (atributos, no pueden usar <T>).
  const [locale, setLocale] = useState<"es" | "en">("es");
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setLocale((el.dataset.locale as "es" | "en") || "es");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-locale"] });
    return () => obs.disconnect();
  }, []);
  const closeLabel = locale === "es" ? "Cerrar menú" : "Close menu";
  const openLabel = locale === "es" ? "Abrir menú" : "Open menu";
  const navLabel = locale === "es" ? "Navegación principal" : "Main navigation";

  useEffect(() => {
    if (!open) return;

    // Guardar elemento que tenía foco ANTES de moverlo (el botón trigger).
    // CRÍTICO: capturar document.activeElement ANTES de firstLinkRef.focus(),
    // no después — si no, captura el link ya movido y el cleanup restaura al
    // elemento equivocado (que ya no existe al cerrar → foco perdido).
    const previouslyFocused = document.activeElement;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      // Focus trap: captura Tab/Shift+Tab para circular el foco dentro del drawer.
      if (e.key !== "Tab") return;

      const drawer = document.getElementById("mobile-nav-drawer");
      if (!drawer) return;

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first?.focus();
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Mover foco al primer link DESPUÉS de capturar previouslyFocused.
    // Esto asegura que el cleanup pueda restaurar al elemento correcto.
    firstLinkRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restaura foco al cerrar (cualquier método: Escape/overlay/botón).
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((v) => !v)}
        className={`${user ? "2xl:hidden" : "xl:hidden"} inline-flex shrink-0 items-center gap-2 self-stretch border-l-4 px-4 font-display text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-3 sm:px-5 ${
          dark
            ? "border-bg/30 bg-transparent text-bg hover:bg-bg hover:text-text"
            : "border-text bg-bg text-text hover:bg-text hover:text-bg"
        }`}
      >
        <span aria-hidden className="text-lg leading-none">
          {open ? "✕" : "☰"}
        </span>
        {/* Text label hidden on the narrowest screens so the header row always
            fits (the button stays icon-only; aria-label carries the name).
            Returns at sm+. */}
        <span className="hidden sm:inline">
          {open ? (
            <T es="Cerrar" en="Close" locale={tLocale} />
          ) : (
            <T es="Menú" en="Menu" locale={tLocale} />
          )}
        </span>
      </button>

      {open && (
        <div
          id="mobile-nav-drawer"
          className={`${user ? "2xl:hidden" : "xl:hidden"} fixed inset-0 z-40 overflow-y-auto bg-text text-bg`}
          onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
          role="presentation"
        >
          <nav
            className="min-h-full bg-text"
            onClick={(e) => e.stopPropagation()}
            aria-label={navLabel}
          >
            {/* TOP BAR — matches header height + close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bg/15 bg-text px-4 py-5">
              <p className="font-mono text-xs uppercase tracking-widest text-bg/60">
                <T es="Menú · UAP Codex" en="Menu · UAP Codex" />
              </p>
              <div className="flex items-center gap-2">
                {/* Acceso/cuenta · esquina superior (convención), discreto */}
                <span onClick={() => { if (!user) setOpen(false); }}>
                  <AccountControl variant="drawer" />
                </span>
                <LocaleToggle variant="drawer" />
                <button
                  type="button"
                  aria-label={closeLabel}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center gap-2 border-2 border-bg bg-text px-3 font-mono text-xs uppercase tracking-widest text-bg hover:bg-bg hover:text-text"
                >
                  <span aria-hidden className="text-base leading-none">
                    ✕
                  </span>
                  <span>
                    <T es="Cerrar" en="Close" />
                  </span>
                </button>
              </div>
            </div>

            <div className="px-4 py-8">
              {/* SITE SEARCH — mobile variant */}
              <SiteSearch variant="mobile" onSelect={() => setOpen(false)} />

              {/* PRIMARY CTA */}
              <Link
                ref={firstLinkRef}
                href={hrefFor(PRIMARY_CTA.href)}
                onClick={() => setOpen(false)}
                className="group mt-8 block bg-accent p-6 hover:bg-bg hover:text-text"
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
                {user && (
                  <li>
                    <Link
                      href="/laboratorio"
                      onClick={() => setOpen(false)}
                      aria-current={isActive("/laboratorio") ? "page" : undefined}
                      className="group flex min-h-[68px] items-center justify-between gap-4 py-5 hover:bg-bg hover:px-4 hover:-mx-4 hover:text-text"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-display text-2xl font-medium leading-tight text-accent group-hover:text-text">
                          ◆ <T es="Laboratorio" en="Data Lab" />
                        </p>
                        <p className="text-xs text-bg/60 group-hover:text-muted">
                          <T es="Tu tablero: gráficos, KPIs y reportes" en="Your dashboard: charts, KPIs and reports" />
                        </p>
                      </div>
                      <span aria-hidden className="shrink-0 font-mono text-lg text-accent">→</span>
                    </Link>
                  </li>
                )}
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={hrefFor(l.href)}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className="group flex min-h-[68px] items-center justify-between gap-4 py-5 hover:bg-bg hover:px-4 hover:-mx-4 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <div className="min-w-0 space-y-1">
                        <p
                          className={`font-display text-2xl font-medium leading-tight group-hover:text-text ${
                            isActive(l.href) ? "text-accent" : "text-bg"
                          }`}
                        >
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
                      href={hrefFor(l.href)}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={`block min-h-[48px] py-3 text-sm font-medium underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive(l.href) ? "text-accent underline" : "text-bg"
                      }`}
                    >
                      <T es={l.es} en={l.en} />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* SOCIAL — Instagram visible en mobile (el del hero queda bajo
                  el pliegue). Drawer oscuro → tono "dark". */}
              <div className="mt-12 flex items-center gap-3 border-t border-bg/15 pt-5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-bg/60">
                  <T es="Síguenos" en="Follow" />
                </span>
                <InstagramLink tone="dark" />
                <PinterestLink tone="dark" />
              </div>

              <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-bg/60">
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
