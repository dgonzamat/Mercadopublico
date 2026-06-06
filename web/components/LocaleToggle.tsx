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
export function LocaleToggle() {
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
      className="inline-flex items-center gap-1 self-stretch border-l border-text/15 px-3 font-mono text-xs uppercase tracking-widest text-text hover:bg-text hover:text-bg"
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
