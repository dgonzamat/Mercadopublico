"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/components/T";
import { REGION_ORDER, REGION_LABELS, type Region } from "@/lib/regions";
import { searchKey } from "@/lib/searchKey";

/**
 * Filtros facetados de /cases — cuatro ejes COMBINABLES (AND): Era · Región ·
 * Explicación más probable · Nivel de evidencia, más una BÚSQUEDA de texto
 * libre sobre nombre/país/año. Cada caso se renderiza server-side con
 * [data-region] [data-hyp] [data-era] [data-tier] [data-search] en el mismo
 * wrapper.
 *
 * Visibilidad de ÍTEMS: CSS-puro (globals.css) para las facetas. Cada faceta
 * activa pone su `data-*-filter` en el contenedor y añade una regla de
 * ocultación; como todas caen sobre el mismo elemento, componen en
 * intersección sin combinatoria. La BÚSQUEDA no puede resolverse así —el CSS
 * no hace substring—, así que el JS marca `data-nomatch` en los ítems que no
 * calzan y una sola regla los oculta; compone en AND con las facetas porque
 * aplica sobre ese mismo wrapper. Es el mismo mecanismo de /researchers.
 *
 * Lo que el CSS no puede (ocultar encabezados de era que quedan sin resultados
 * bajo una combinación arbitraria, el conteo vivo y el estado vacío) lo hace
 * este componente leyendo los data-attrs ya presentes en el DOM — cero data
 * duplicada al cliente.
 */

export type HypKey =
  | "astronomico"
  | "aeronave"
  | "espacial"
  | "luces_tierra"
  | "terrestre_otros"
  | "natural"
  | "fraude"
  | "instrumento"
  | "psicosocial"
  | "humana_clasificada"
  | "adversaria"
  | "nohumano"
  | "indet";

const HYP_ORDER: ReadonlyArray<{ key: HypKey; es: string; en: string }> = [
  // Lo prosaico se nombra por el objeto (misidSubtype), no por el error del
  // testigo. Etiquetas = PROSAIC_CLASSES de lib/meceClasses (no se importa aquí
  // para mantener este componente cliente libre de lib de modelo).
  { key: "astronomico", es: "Objeto astronómico", en: "Astronomical object" },
  { key: "aeronave", es: "Aeronave", en: "Aircraft" },
  { key: "espacial", es: "Objeto espacial", en: "Space object" },
  { key: "luces_tierra", es: "En tierra", en: "Ground-level" },
  { key: "terrestre_otros", es: "Objeto convencional no precisado", en: "Conventional object, not pinned down" },
  { key: "natural", es: "Fenómeno natural", en: "Natural phenomenon" },
  { key: "fraude", es: "Posible fraude", en: "Possible hoax" },
  { key: "instrumento", es: "Fallo de instrumento", en: "Instrument artifact" },
  { key: "psicosocial", es: "Causa psicológica o social", en: "Psychological or social cause" },
  { key: "humana_clasificada", es: "Tecnología humana", en: "Human tech" },
  { key: "adversaria", es: "Tecnología adversaria", en: "Adversary tech" },
  { key: "nohumano", es: "No-humano", en: "Non-human" },
  { key: "indet", es: "Indeterminado", en: "Indeterminate" },
];

const HYP_KEYS = new Set<string>(HYP_ORDER.map((h) => h.key));

/** Alias LEGADO de deep-link: `#misid` era la hipótesis «Misidentificación»,
 *  hoy abierta en las clases de objeto. Un enlace viejo filtra la UNIÓN de
 *  todas ellas (regla `[data-hyp-filter="misid"]` en globals.css), así sigue
 *  mostrando los mismos casos. No aparece como opción del select salvo cuando
 *  llega por un enlace viejo, para que el control refleje el filtro activo. */
const LEGACY_MISID = "misid";
const LEGACY_MISID_LABEL = { es: "Objeto convencional · todas las clases", en: "Conventional object · all classes" };
type HypFilter = HypKey | typeof LEGACY_MISID;
const MISID_OBJECT_KEYS: ReadonlyArray<HypKey> = ["astronomico", "aeronave", "espacial", "luces_tierra", "terrestre_otros"];

export type FacetOption = { key: string; es: string; en: string; count: number };

export function CasesFilter({
  locale,
  regionCounts,
  hypCounts,
  eras,
  tiers,
  total,
  children,
}: {
  locale: "es" | "en";
  regionCounts: Partial<Record<Region, number>>;
  hypCounts: Partial<Record<HypKey, number>>;
  eras: FacetOption[];
  tiers: FacetOption[];
  total: number;
  children: React.ReactNode;
}) {
  const [region, setRegion] = useState<Region | "all">("all");
  const [hyp, setHyp] = useState<HypFilter | "all">("all");
  const [era, setEra] = useState<string | "all">("all");
  const [tier, setTier] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(total);
  const rootRef = useRef<HTMLDivElement>(null);

  // Deep-link por hash (#nohumano, #aeronave…) — al montar y en cada hashchange.
  // `#misid` (legado) filtra la unión de las clases de objeto.
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (HYP_KEYS.has(h) || h === LEGACY_MISID) setHyp(h as HypFilter);
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
      // La consulta se normaliza con la MISMA función con que el servidor
      // escribió `data-search`, para que la comparación sea substring pelado.
      const q = searchKey(query.trim());
      root.querySelectorAll<HTMLElement>("[data-search]").forEach((el) => {
        if (!q || (el.dataset.search ?? "").includes(q)) el.removeAttribute("data-nomatch");
        else el.setAttribute("data-nomatch", "");
      });

      const sel =
        (region !== "all" ? `[data-region="${region}"]` : "") +
        (hyp === LEGACY_MISID
          ? `:is(${MISID_OBJECT_KEYS.map((k) => `[data-hyp="${k}"]`).join(",")})`
          : hyp !== "all"
            ? `[data-hyp="${hyp}"]`
            : "") +
        (era !== "all" ? `[data-era="${era}"]` : "") +
        (tier !== "all" ? `[data-tier="${tier}"]` : "");
      // todo wrapper de caso lleva data-region; :not([data-nomatch]) mete la
      // búsqueda en el mismo selector, así el conteo y los encabezados de era
      // vacíos ya la tienen en cuenta sin una segunda pasada.
      const itemSel = `[data-region]${sel}:not([data-nomatch])`;
      setMatchCount(root.querySelectorAll(itemSel).length);
      root.querySelectorAll<HTMLElement>("[data-group]").forEach((g) => {
        if (g.querySelector(itemSel)) g.removeAttribute("data-empty");
        else g.setAttribute("data-empty", "");
      });
    };
    measure();
  }, [region, hyp, era, tier, query]);

  const availRegions = REGION_ORDER.filter((r) => (regionCounts[r] ?? 0) > 0);
  const availHyps = HYP_ORDER.filter((h) => (hypCounts[h.key] ?? 0) > 0);

  const regionLabel = (r: Region) => REGION_LABELS[r][locale];
  const hypLabel = (k: HypFilter) =>
    k === LEGACY_MISID ? LEGACY_MISID_LABEL[locale] : HYP_ORDER.find((h) => h.key === k)![locale];
  const optLabel = (opts: FacetOption[], k: string) => {
    const o = opts.find((x) => x.key === k);
    return o ? o[locale] : k;
  };

  const active: Array<{ key: string; label: string; clear: () => void }> = [];
  if (era !== "all")
    active.push({ key: `era:${era}`, label: optLabel(eras, era), clear: () => setEra("all") });
  if (region !== "all")
    active.push({ key: `region:${region}`, label: regionLabel(region), clear: () => setRegion("all") });
  if (hyp !== "all")
    active.push({ key: `hyp:${hyp}`, label: hypLabel(hyp), clear: () => setHyp("all") });
  if (tier !== "all")
    active.push({ key: `tier:${tier}`, label: optLabel(tiers, tier), clear: () => setTier("all") });
  if (query.trim())
    active.push({ key: "q", label: `“${query.trim()}”`, clear: () => setQuery("") });

  const clearAll = () => {
    setEra("all");
    setRegion("all");
    setHyp("all");
    setTier("all");
    setQuery("");
  };

  const anyActive = active.length > 0;
  const removeLabel = locale === "es" ? "Quitar filtro" : "Remove filter";

  return (
    <div
      ref={rootRef}
      data-region-filter={region}
      data-hyp-filter={hyp}
      data-era-filter={era}
      data-tier-filter={tier}
      className="space-y-4"
    >
      {/* Fila de selects facetados — combinables (AND). */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={locale === "es" ? "Filtrar casos" : "Filter cases"}
      >
        <span className="mr-1 font-mono text-xs uppercase tracking-widest text-muted">
          <T es="Filtrar" en="Filter" locale={locale} />
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
          onChange={(v) => setHyp(v as HypFilter | "all")}
          ariaLabel={locale === "es" ? "Filtrar por explicación" : "Filter by explanation"}
          allLabel={locale === "es" ? "Explicación · todas" : "Explanation · all"}
          options={[
            ...(hyp === LEGACY_MISID
              ? [{ value: LEGACY_MISID, label: `${LEGACY_MISID_LABEL[locale]} · ${MISID_OBJECT_KEYS.reduce((a, k) => a + (hypCounts[k] ?? 0), 0)}` }]
              : []),
            ...availHyps.map((h) => ({ value: h.key, label: `${hypLabel(h.key)} · ${hypCounts[h.key] ?? 0}` })),
          ]}
        />
        <FacetSelect
          value={tier}
          onChange={setTier}
          ariaLabel={locale === "es" ? "Filtrar por nivel de evidencia" : "Filter by evidence level"}
          allLabel={locale === "es" ? "Evidencia · toda" : "Evidence · all"}
          options={tiers.map((t) => ({ value: t.key, label: `${t[locale]} · ${t.count}` }))}
        />
        {/* Los cuatro selects ya ocupan 964 de los 1120px del contenedor, así
            que la caja SIEMPRE cae a la línea siguiente: los ~150px que
            sobran no alcanzan para un campo de texto usable. Ancho fijo (no
            `flex-1`) para que al envolver no se estire a los 1120 y siga
            leyéndose como parte del grupo de filtros. */}
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              locale === "es" ? "Buscar caso, país, año…" : "Search case, country, year…"
            }
            aria-label={
              locale === "es"
                ? "Buscar caso por nombre, país o año"
                : "Search case by name, country or year"
            }
            className={`block min-h-[44px] w-full border py-2 pl-3 pr-10 font-mono text-sm placeholder:text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              query
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-panel text-text"
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={locale === "es" ? "Limpiar búsqueda" : "Clear search"}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span aria-hidden>×</span>
            </button>
          )}
        </div>
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
              <T es={`${matchCount} caso`} en={`${matchCount} case`} locale={locale} />
            ) : (
              <T es={`${matchCount} casos`} en={`${matchCount} cases`} locale={locale} />
            )}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="min-h-[36px] font-mono text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T es="Limpiar todo" en="Clear all" locale={locale} />
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
              locale={locale}
            />
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 border-2 border-text px-5 font-mono text-xs uppercase tracking-widest text-text hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T es="Limpiar los filtros" en="Clear the filters" locale={locale} />
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
