"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { mirrorHref } from "@/components/LocaleLink";

type Locale = "es" | "en";

/** ¿Estamos en una ruta del árbol español (/es o /es/…)? */
function isEsRoute(pathname: string | null): boolean {
  return pathname === "/es" || (pathname?.startsWith("/es/") ?? false);
}

/**
 * EN/ES toggle. Sets `[data-locale]` on the html element, persists in
 * localStorage. CSS in globals.css drives the per-span visibility.
 *
 * On first render, the server outputs EN (idioma primario). On mount we pick
 * the locale: an explicit prior choice (localStorage) wins; otherwise we
 * auto-detect from the browser's preferred languages. Detection is NOT
 * persisted — only an explicit toggle is — so it re-runs each visit until
 * the user actually picks one.
 */
// Walk the browser's ordered language preferences and return whichever of
// es/en the user prefers first. Defaults to EN (the site's primary language)
// for any other language.
function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const l of langs) {
    const code = l.toLowerCase().slice(0, 2);
    if (code === "es") return "es";
    if (code === "en") return "en";
  }
  return "en";
}

// Per-variant chrome. The header sits on the light paper bg; the drawer
// sits on the dark (bg-text) mobile menu, so it needs inverted colors.
const VARIANT = {
  header:
    "self-stretch border-l border-text/15 px-3 text-text hover:bg-text hover:text-bg",
  drawer: "border-2 border-bg px-3 py-2 text-bg hover:bg-bg hover:text-text",
} as const;

export function LocaleToggle({
  variant = "header",
  dark = false,
}: {
  variant?: keyof typeof VARIANT;
  dark?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");
  // Dark header (Home hero overlay): cream chrome + accent-bright active span.
  const chrome =
    dark && variant === "header"
      ? "self-stretch border-l border-bg/15 px-3 text-bg hover:bg-bg hover:text-text"
      : VARIANT[variant];
  const activeColor = dark ? "text-accent-bright" : "text-accent";
  const sepColor = dark ? "text-bg/40" : "text-muted";

  useEffect(() => {
    // En el árbol /es/ el idioma lo fija la URL (español), y así el chrome
    // (header/footer del root layout, fuera del wrapper data-locale de
    // app/es/layout) también se muestra en español. Fuera de /es/, gana la
    // elección explícita (localStorage) y si no, la autodetección (default EN).
    const stored = localStorage.getItem("locale") as Locale | null;
    // El chrome debe coincidir con el idioma que el CUERPO renderiza en esta URL:
    //  · /es/…            → es
    //  · raíz con espejo  → en (esas páginas ya sirven solo inglés)
    //  · sin espejo       → bilingüe: gana la elección explícita, luego autodetect
    const initial: Locale = isEsRoute(pathname)
      ? "es"
      : mirrorHref(pathname) !== null
        ? "en"
        : (stored ?? detectLocale());
    // Locale derivado en mount / al navegar (no disponible en SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(initial);
    document.documentElement.dataset.locale = initial;
    document.documentElement.lang = initial;
  }, [pathname]);

  function toggle() {
    const next: Locale = locale === "es" ? "en" : "es";
    // Rutas espejo (un idioma por URL): NAVEGAR a la gemela. El otro idioma no
    // vive en este HTML, así que un flip-CSS no lo revelaría — hay que ir a la
    // otra URL. El useEffect [pathname] del destino fija data-locale/lang.
    const target = mirrorHref(pathname);
    if (target) {
      localStorage.setItem("locale", next);
      router.push(target);
      return;
    }
    // Rutas sin espejo (atlas, contact, …): siguen siendo bilingües en una sola
    // URL → flip-CSS legacy.
    setLocale(next);
    document.documentElement.dataset.locale = next;
    document.documentElement.lang = next;
    localStorage.setItem("locale", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        locale === "es" ? "Switch to English" : "Cambiar a español"
      }
      className={`inline-flex min-h-[44px] items-center gap-1 font-mono text-xs uppercase tracking-widest ${chrome}`}
    >
      <span aria-hidden className={locale === "es" ? activeColor : ""}>
        ES
      </span>
      <span aria-hidden className={sepColor}>
        /
      </span>
      <span aria-hidden className={locale === "en" ? activeColor : ""}>
        EN
      </span>
    </button>
  );
}
