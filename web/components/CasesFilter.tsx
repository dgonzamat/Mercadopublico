"use client";

import { useEffect, useState, type ReactNode } from "react";
import { T } from "@/components/T";
import { REGION_ORDER, REGION_LABELS, type Region } from "@/lib/regions";

/**
 * Filtro de /cases — patrón CSS-puro (hermano de RegionFilter / del toggle de
 * idioma). Dos facetas: REGIÓN y EXPLICACIÓN más probable (hipótesis modal).
 *
 * El listado se renderiza server-side con `data-region` y `data-hyp` en cada
 * ítem; este componente solo cambia `data-region-filter` / `data-hyp-filter`
 * del contenedor, y el CSS (globals.css) oculta lo que no matchea y las
 * secciones que quedan vacías (:has). Cero data duplicada al cliente.
 *
 * Selección ÚNICA entre las dos facetas: elegir una región limpia la hipótesis
 * y viceversa, de modo que a lo sumo un atributo queda distinto de "all". Esto
 * mantiene el CSS simple (no hay que cruzar región × hipótesis).
 *
 * Deep-link: al montar lee `window.location.hash` (ej. `#nohumano`) para
 * pre-aplicar una hipótesis — así /probabilidades enlaza a `/cases#<hyp>`.
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
  children: ReactNode;
}) {
  const [region, setRegion] = useState<Region | "all">("all");
  const [hyp, setHyp] = useState<HypKey | "all">("all");

  // Deep-link por hash (#nohumano, #misid, …) — al montar y en cada cambio de
  // hash. Patrón "sincronizar con un sistema externo (la URL)": la suscripción
  // a hashchange es el motivo legítimo del efecto (cf. MobileNav con su
  // MutationObserver). El estado inicial server-side queda en "all" (sin hash).
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

  const reset = () => {
    setRegion("all");
    setHyp("all");
  };
  const pickRegion = (r: Region) => {
    setRegion(r);
    setHyp("all");
  };
  const pickHyp = (h: HypKey) => {
    setHyp(h);
    setRegion("all");
  };

  const allActive = region === "all" && hyp === "all";

  return (
    <div data-region-filter={region} data-hyp-filter={hyp} className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <FacetLabel>
            <T es="Región" en="Region" />
          </FacetLabel>
          <Chip active={allActive} onClick={reset} count={total}>
            <T es="Todas" en="All" />
          </Chip>
          {availRegions.map((r) => (
            <Chip
              key={r}
              active={region === r}
              onClick={() => pickRegion(r)}
              count={regionCounts[r] ?? 0}
            >
              <T es={REGION_LABELS[r].es} en={REGION_LABELS[r].en} />
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FacetLabel>
            <T es="Explicación más probable" en="Most likely explanation" />
          </FacetLabel>
          {availHyps.map((h) => (
            <Chip
              key={h.key}
              active={hyp === h.key}
              onClick={() => pickHyp(h.key)}
              count={hypCounts[h.key] ?? 0}
            >
              <T es={h.es} en={h.en} />
            </Chip>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

function FacetLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-muted/70">
      {children}
    </span>
  );
}

function Chip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] items-center gap-1.5 border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-panel text-muted hover:border-accent/50 hover:text-text"
      }`}
    >
      {children}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}
