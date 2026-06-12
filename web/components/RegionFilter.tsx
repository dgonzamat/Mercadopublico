"use client";

import { useState, type ReactNode } from "react";
import { T } from "@/components/T";
import { REGION_ORDER, REGION_LABELS, type Region } from "@/lib/regions";

/**
 * Filtro por región — patrón CSS-puro (como el toggle de idioma).
 *
 * El listado se renderiza server-side con `data-region` en cada ítem y
 * `data-group` en cada sección; este componente solo cambia el atributo
 * `data-region-filter` del contenedor, y el CSS (globals.css) oculta lo que no
 * matchea y las secciones que quedan vacías. No se duplica data al cliente.
 */
export function RegionFilter({
  counts,
  total,
  children,
}: {
  counts: Partial<Record<Region, number>>;
  total: number;
  children: ReactNode;
}) {
  const [region, setRegion] = useState<Region | "all">("all");
  const available = REGION_ORDER.filter((r) => (counts[r] ?? 0) > 0);

  return (
    <div data-region-filter={region} className="space-y-6">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtro por región"
      >
        <Chip active={region === "all"} onClick={() => setRegion("all")} count={total}>
          <T es="Todas" en="All" />
        </Chip>
        {available.map((r) => (
          <Chip
            key={r}
            active={region === r}
            onClick={() => setRegion(r)}
            count={counts[r] ?? 0}
          >
            <T es={REGION_LABELS[r].es} en={REGION_LABELS[r].en} />
          </Chip>
        ))}
      </div>
      {children}
    </div>
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
      className={`inline-flex min-h-[36px] items-center gap-1.5 border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
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
