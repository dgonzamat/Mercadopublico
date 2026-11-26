"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Buscador propio de /cryptids (26 nov 2026, decisión del dueño: UAP y
 * críptidos se buscan por separado). Filtra en el sitio las filas que ya
 * renderiza el servidor: cada fila lleva `data-cryptid-row` con su texto en
 * `data-search`, su categoría en `data-group` y su tier en `data-tier`, y cada
 * criatura y categoría se ocultan si se quedan sin filas. Los filtros de
 * categoría y de tier (26 nov 2026, decisión del dueño) se suman al texto.
 * Sin JS la lista se ve entera, como antes.
 */
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Group = { id: string; es: string; en: string };
const TIERS = ["S", "A", "B"] as const;

const chip = (on: boolean) =>
  `min-h-[44px] border-2 px-3 text-sm transition-colors ${
    on ? "border-accent bg-accent text-bg" : "border-border bg-panel text-text hover:border-accent"
  }`;

export function CryptidSearch({ locale, groups }: { locale: "es" | "en"; groups: Group[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [visible, setVisible] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    const q = norm(query);
    let shown = 0;
    root.querySelectorAll<HTMLElement>("[data-cryptid-row]").forEach((row) => {
      const hit =
        (!q || norm(row.dataset.search ?? "").includes(q)) &&
        (!group || row.dataset.group === group) &&
        (!tier || row.dataset.tier === tier);
      row.hidden = !hit;
      if (hit) shown++;
    });
    for (const sel of ["[data-cryptid-kind]", "[data-cryptid-group]"]) {
      root.querySelectorAll<HTMLElement>(sel).forEach((box) => {
        box.hidden = !box.querySelector("[data-cryptid-row]:not([hidden])");
      });
    }
    setVisible(q || group || tier ? shown : null);
  }, [query, group, tier]);

  const es = locale === "es";
  const label = es ? "Buscar críptido, país, año" : "Search cryptid, country, year";
  return (
    <div ref={ref} className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`${label}…`}
        aria-label={label}
        className="h-12 w-full border-2 border-border bg-panel px-4 font-mono text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <div role="group" aria-label={es ? "Filtrar por categoría" : "Filter by category"} className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={!group} onClick={() => setGroup(null)} className={chip(!group)}>
          {es ? "Todas las categorías" : "All categories"}
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={group === g.id}
            onClick={() => setGroup(group === g.id ? null : g.id)}
            className={chip(group === g.id)}
          >
            {es ? g.es : g.en}
          </button>
        ))}
      </div>
      <div role="group" aria-label={es ? "Filtrar por tier" : "Filter by tier"} className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={!tier} onClick={() => setTier(null)} className={chip(!tier)}>
          {es ? "Todos los tiers" : "All tiers"}
        </button>
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tier === t}
            onClick={() => setTier(tier === t ? null : t)}
            className={chip(tier === t)}
          >
            Tier {t}
          </button>
        ))}
      </div>
      <p role="status" className="text-sm text-muted">
        {visible === 0
          ? es
            ? "Ningún críptido coincide con la búsqueda."
            : "No cryptid matches the search."
          : visible !== null
            ? es
              ? `${visible} ${visible === 1 ? "resultado" : "resultados"}`
              : `${visible} ${visible === 1 ? "result" : "results"}`
            : ""}
      </p>
    </div>
  );
}
