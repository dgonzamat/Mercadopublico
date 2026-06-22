"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/T";
import { REGION_ORDER, REGION_LABELS, type Region } from "@/lib/regions";

/**
 * Filtro de /cases — patrón CSS-puro (data-*-filter en el contenedor; el CSS de
 * globals.css oculta los ítems [data-region]/[data-hyp] que no matchean y los
 * grupos vacíos). Cero data duplicada al cliente.
 *
 * UI: un único <select> con dos <optgroup> (Región · Explicación más probable),
 * en vez de dos murallas de chips. En móvil esto colapsa ~7 filas a un control
 * de una línea — mismo patrón de dropdown que ya usa el atlas (WorldMap). Al ser
 * un solo select la selección es naturalmente ÚNICA entre las dos facetas (a lo
 * sumo un data-*-filter queda distinto de "all"), lo que mantiene el CSS simple.
 *
 * Deep-link por hash (#nohumano, #misid…) al montar y en cada hashchange — así
 * /probabilidades enlaza a `/cases#<hyp>`.
 */

export type HypKey =
  | "misid"
  | "natural"
  | "fraude"
  | "humana_clasificada"
  | "adversaria"
  | "nohumano";

const HYP_ORDER: ReadonlyArray<{ key: HypKey; es: string; en: string }> = [
  { key: "misid", es: "Misidentificación", en: "Misidentification" },
  { key: "natural", es: "Fenómeno natural", en: "Natural phenomenon" },
  { key: "fraude", es: "Posible fraude", en: "Possible hoax" },
  { key: "humana_clasificada", es: "Tecnología humana", en: "Human tech" },
  { key: "adversaria", es: "Tecnología adversaria", en: "Adversary tech" },
  { key: "nohumano", es: "No-humano", en: "Non-human" },
];

const HYP_KEYS = new Set<string>(HYP_ORDER.map((h) => h.key));

export function CasesFilter({
  regionCounts,
  hypCounts,
  total,
  children,
}: {
  regionCounts: Partial<Record<Region, number>>;
  hypCounts: Partial<Record<HypKey, number>>;
  total: number;
  children: React.ReactNode;
}) {
  const [region, setRegion] = useState<Region | "all">("all");
  const [hyp, setHyp] = useState<HypKey | "all">("all");

  // Locale activo para las etiquetas del <select> (texto plano, no admite <T>).
  // Mismo patrón que MobileNav / SiteSearch: lee data-locale del <html>.
  const [locale, setLocale] = useState<"es" | "en">("es");
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setLocale((el.dataset.locale as "es" | "en") || "es");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-locale"] });
    return () => obs.disconnect();
  }, []);

  // Deep-link por hash (#nohumano, #misid…). La suscripción a hashchange es el
  // motivo legítimo del efecto (sincronizar con la URL). SSR queda en "all".
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (HYP_KEYS.has(h)) {
        setHyp(h as HypKey);
        setRegion("all");
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const availRegions = REGION_ORDER.filter((r) => (regionCounts[r] ?? 0) > 0);
  const availHyps = HYP_ORDER.filter((h) => (hypCounts[h.key] ?? 0) > 0);

  // value combinado del select: "all" | "region:<r>" | "hyp:<h>".
  const value =
    region !== "all" ? `region:${region}` : hyp !== "all" ? `hyp:${hyp}` : "all";

  const onChange = (v: string) => {
    if (v === "all") {
      setRegion("all");
      setHyp("all");
    } else if (v.startsWith("region:")) {
      setRegion(v.slice(7) as Region);
      setHyp("all");
    } else if (v.startsWith("hyp:")) {
      setHyp(v.slice(4) as HypKey);
      setRegion("all");
    }
  };

  const labelRegion = locale === "es" ? "Región" : "Region";
  const labelHyp =
    locale === "es" ? "Explicación más probable" : "Most likely explanation";
  const labelAll = locale === "es" ? "Todas" : "All";

  return (
    <div data-region-filter={region} data-hyp-filter={hyp} className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label
          htmlFor="cases-filter"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          <T es="Filtrar casos" en="Filter cases" />
        </label>
        <div className="relative">
          <select
            id="cases-filter"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block min-h-[44px] w-full appearance-none border border-border bg-panel py-2 pl-3 pr-9 font-mono text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto sm:min-w-[18rem]"
          >
            <option value="all">{`${labelAll} · ${total}`}</option>
            <optgroup label={labelRegion}>
              {availRegions.map((r) => (
                <option key={r} value={`region:${r}`}>
                  {`${REGION_LABELS[r][locale]} · ${regionCounts[r] ?? 0}`}
                </option>
              ))}
            </optgroup>
            <optgroup label={labelHyp}>
              {availHyps.map((h) => (
                <option key={h.key} value={`hyp:${h.key}`}>
                  {`${h[locale]} · ${hypCounts[h.key] ?? 0}`}
                </option>
              ))}
            </optgroup>
          </select>
          {/* chevron */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-muted"
          >
            ▾
          </span>
        </div>
        {value !== "all" && (
          <button
            type="button"
            onClick={() => onChange("all")}
            className="min-h-[44px] font-mono text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T es="Limpiar" en="Clear" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
