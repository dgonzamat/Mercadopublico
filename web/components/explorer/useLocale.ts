"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/explorer/fields";

/**
 * Locale activo en runtime. Refleja `data-locale` del <html> (que setea
 * LocaleToggle) — necesario en los gráficos/tabla donde las etiquetas son
 * strings pasados a Recharts y no pueden usar el componente <T> (que es CSS).
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("es");
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setLocale((el.dataset.locale as Locale) || "es");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-locale"] });
    return () => obs.disconnect();
  }, []);
  return locale;
}
