"use client";

import { useEffect, useState } from "react";

type Locale = "es" | "en";

/**
 * EN/ES toggle. Sets `[data-locale]` on the html element, persists in
 * localStorage. CSS in globals.css drives the per-span visibility.
 *
 * On first render, the server outputs ES (default). On mount, we read
 * the stored locale and update the html dataset. If the user previously
 * chose EN, the visible content shifts to EN immediately after hydration.
 */
// Per-variant chrome. The header sits on the light paper bg; the drawer
// sits on the dark (bg-text) mobile menu, so it needs inverted colors.
const VARIANT = {
  header:
    "self-stretch border-l border-text/15 px-3 text-text hover:bg-text hover:text-bg",
  drawer: "border-2 border-bg px-3 py-2 text-bg hover:bg-bg hover:text-text",
} as const;

export function LocaleToggle({
  variant = "header",
}: {
  variant?: keyof typeof VARIANT;
}) {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      (localStorage.getItem("locale") as Locale | null)) || "es";
    setLocale(stored);
    document.documentElement.dataset.locale = stored;
    document.documentElement.lang = stored;
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
      className={`inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest ${VARIANT[variant]}`}
    >
      <span aria-hidden className={locale === "es" ? "text-accent" : ""}>
        ES
      </span>
      <span aria-hidden className="text-muted">
        /
      </span>
      <span aria-hidden className={locale === "en" ? "text-accent" : ""}>
        EN
      </span>
    </button>
  );
}
