"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/components/T";
import { REGION_ORDER, REGION_LABELS, type Region } from "@/lib/regions";

/**
 * Filtros facetados de /cases — tres ejes COMBINABLES (AND): Era · Región ·
 * Explicación más probable. Cada caso se renderiza server-side con
 * [data-region] [data-hyp] [data-era] en el mismo wrapper.
 *
 * Visibilidad de ÍTEMS: CSS-puro (globals.css). Cada faceta activa pone su
 * `data-*-filter` en el contenedor y añade una regla de ocultación; como todas
 * caen sobre el mismo elemento, componen en intersección sin combinatoria.
 *
 * Lo que el CSS no puede (ocultar encabezados de era que quedan sin resultados
 * bajo una combinación arbitraria, el conteo vivo y el estado vacío) lo hace
 * este componente leyendo los data-attrs ya presentes en el DOM — cero data
 * duplicada al cliente.
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

export type EraOption = { key: string; es: string; en: string; count: number };

export function CasesFilter({
  regionCounts,
  hypCounts,
  eras,
  total,
  children,
}: {
  regionCounts: Partial<Record<Region, number>>;
  hypCounts: Partial<Record<HypKey, number>>;
  eras: EraOption[];
  total: number;
  children: React.ReactNode;
}) {
  const [region, setRegion] = useState<Region | "all">("all");
  const [hyp, setHyp] = useState<HypKey | "all">("all");
  const [era, setEra] = useState<string | "all">("all");
  const [matchCount, setMatchCount] = useState(total);
  const [locale, setLocale] = useState<"es" | "en">("es");
  const rootRef = useRef<HTMLDivElement>(null);

  // Locale activo para etiquetas de texto plano (selects/pills no admiten <T>).
  // Mismo patrón que MobileNav / SiteSearch: lee data-locale del <html>.
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setLocale((el.dataset.locale as "es" | "en") || "es");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-locale"] });
    return () => obs.disconnect();
  }, []);

  // Deep-link por hash (#nohumano, #misid…) — al montar y en cada hashchange.
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (HYP_KEYS.has(h)) setHyp(h as HypKey);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Tras cada cambio de faceta: recalcula conteo y oculta encabezados de era
  // sin resultados. Lee los data-attrs del DOM (no duplica datos). El trabajo
  // vive en una función (sincroniza React con el DOM, sistema externo).
  useEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      const sel =
        (region !== "all" ? `[data-region="${region}"]` : "") +
        (hyp !== "all" ? `[data-hyp="${hyp}"]` : "") +
        (era !== "all" ? `[data-era="${era}"]` : "");
      const itemSel = `[data-region]${sel}`; // todo wrapper de caso lleva data-region
      setMatchCount(root.querySelectorAll(itemSel).length);
      root.querySelectorAll<HTMLElement>("[data-group]").forEach((g) => {
        if (g.querySelector(itemSel)) g.removeAttribute("data-empty");
        else g.setAttribute("data-empty", "");
      });
    };
    measure();
  }, [region, hyp, era]);

  const availRegions = REGION_ORDER.filter((r) => (regionCounts[r] ?? 0) > 0);
  const availHyps = HYP_ORDER.filter((h) => (hypCounts[h.key] ?? 0) > 0);

  const regionLabel = (r: Region) => REGION_LABELS[r][locale];
  const hypLabel = (k: HypKey) => HYP_ORDER.find((h) => h.key === k)![locale];
  const eraLabel = (k: string) => {
    const e = eras.find((x) => x.key === k);
    return e ? e[locale] : k;
  };

  const active: Array<{ key: string; label: string; clear: () => void }> = [];
  if (era !== "all")
    active.push({ key: `era:${era}`, label: eraLabel(era), clear: () => setEra("all") });
  if (region !== "all")
    active.push({ key: `region:${region}`, label: regionLabel(region), clear: () => setRegion("all") });
  if (hyp !== "all")
    active.push({ key: `hyp:${hyp}`, label: hypLabel(hyp), clear: () => setHyp("all") });

  const clearAll = () => {
    setEra("all");
    setRegion("all");
    setHyp("all");
  };

  const anyActive = active.length > 0;
  const removeLabel = locale === "es" ? "Quitar filtro" : "Remove filter";

  return (
    <div
      ref={rootRef}
      data-region-filter={region}
      data-hyp-filter={hyp}
      data-era-filter={era}
      className="space-y-4"
    >
      {/* Fila de selects facetados — combinables (AND). */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={locale === "es" ? "Filtrar casos" : "Filter cases"}
      >
        <span className="mr-1 font-mono text-xs uppercase tracking-widest text-muted">
          <T es="Filtrar" en="Filter" />
        </span>
        <FacetSelect
          value={era}
          onChange={setEra}
          ariaLabel={locale === "es" ? "Filtrar por era" : "Filter by era"}
          allLabel={locale === "es" ? "Era · todas" : "Era · all"}
          options={eras.map((e) => ({ value: e.key, label: `${e[locale]} · ${e.count}` }))}
        />
        <FacetSelect
          value={region}
          onChange={(v) => setRegion(v as Region | "all")}
          ariaLabel={locale === "es" ? "Filtrar por región" : "Filter by region"}
          allLabel={locale === "es" ? "Región · todas" : "Region · all"}
          options={availRegions.map((r) => ({ value: r, label: `${regionLabel(r)} · ${regionCounts[r] ?? 0}` }))}
        />
        <FacetSelect
          value={hyp}
          onChange={(v) => setHyp(v as HypKey | "all")}
          ariaLabel={locale === "es" ? "Filtrar por explicación" : "Filter by explanation"}
          allLabel={locale === "es" ? "Explicación · todas" : "Explanation · all"}
          options={availHyps.map((h) => ({ value: h.key, label: `${hypLabel(h.key)} · ${hypCounts[h.key] ?? 0}` }))}
        />
      </div>

      {/* Filtros activos (pills removibles) + conteo vivo + limpiar todo. */}
      {anyActive && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={a.clear}
              aria-label={`${removeLabel}: ${a.label}`}
              className="inline-flex min-h-[36px] items-center gap-1.5 border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>{a.label}</span>
              <span aria-hidden>✕</span>
            </button>
          ))}
          <span className="font-mono text-xs tabular-nums text-muted" aria-live="polite">
            {matchCount === 1 ? (
              <T es={`${matchCount} caso`} en={`${matchCount} case`} />
            ) : (
              <T es={`${matchCount} casos`} en={`${matchCount} cases`} />
            )}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="min-h-[36px] font-mono text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T es="Limpiar todo" en="Clear all" />
          </button>
        </div>
      )}

      {/* Lista (se oculta entera si ninguna combinación coincide). */}
      <div hidden={matchCount === 0}>{children}</div>

      {matchCount === 0 && (
        <div className="border border-dashed border-border bg-panel/50 px-5 py-10 text-center">
          <p className="font-display text-lg text-text">
            <T
              es="Ninguna combinación de filtros coincide."
              en="No cases match this combination of filters."
            />
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 border-2 border-text px-5 font-mono text-xs uppercase tracking-widest text-text hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T es="Limpiar los filtros" en="Clear the filters" />
          </button>
        </div>
      )}
    </div>
  );
}

function FacetSelect({
  value,
  onChange,
  ariaLabel,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  allLabel: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block min-h-[44px] appearance-none border py-2 pl-3 pr-8 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          value !== "all"
            ? "border-accent/50 bg-accent/10 text-accent"
            : "border-border bg-panel text-text"
        }`}
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center font-mono text-xs text-muted"
      >
        ▾
      </span>
    </div>
  );
}
