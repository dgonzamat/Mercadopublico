"use client";

import { useEffect, useState } from "react";

type Locale = "es" | "en";

/**
 * EN/ES toggle. Sets `[data-locale]` on the html element, persists in
 * localStorage. CSS in globals.css drives the per-span visibility.
 *
 * On first render, the server outputs ES (default). On mount we pick the
 * locale: an explicit prior choice (localStorage) wins; otherwise we
 * auto-detect from the browser's preferred languages. Detection is NOT
 * persisted — only an explicit toggle is — so it re-runs each visit until
 * the user actually picks one.
 */
// Walk the browser's ordered language preferences and return whichever of
// es/en the user prefers first. Defaults to ES (the site's base language)
// for any other language.
function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "es";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const l of langs) {
    const code = l.toLowerCase().slice(0, 2);
    if (code === "es") return "es";
    if (code === "en") return "en";
  }
  return "es";
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
  const [locale, setLocale] = useState<Locale>("es");
  // Dark header (Home hero overlay): cream chrome + accent-bright active span.
  const chrome =
    dark && variant === "header"
      ? "self-stretch border-l border-bg/15 px-3 text-bg hover:bg-bg hover:text-text"
      : VARIANT[variant];
  const activeColor = dark ? "text-accent-bright" : "text-accent";
  const sepColor = dark ? "text-bg/40" : "text-muted";

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    const initial: Locale = stored ?? detectLocale();
    setLocale(initial);
    document.documentElement.dataset.locale = initial;
    document.documentElement.lang = initial;
  }, []);

  function toggle() {
    const next: Locale = locale === "es" ? "en" : "es";
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
      className={`inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest ${chrome}`}
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
