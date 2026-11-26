"use client";

import { useEffect, useRef, useState } from "react";
import { TIER_META } from "@/lib/ui";

/**
 * Buscador propio de /cryptids (26 nov 2026, decisión del dueño: UAP y
 * críptidos se buscan por separado). Filtra en el sitio las filas que ya
 * renderiza el servidor: cada fila lleva `data-cryptid-row` con su texto en
 * `data-search`, su categoría en `data-group` y su tier en `data-tier`, y cada
 * criatura y categoría se ocultan si se quedan sin filas. Categoría y tier son
 * menús desplegables con selección múltiple, con el aspecto de los de /cases
 * (26 nov 2026, decisión del dueño): dentro de un menú las opciones se suman
 * (O), y entre menús y texto se combinan (Y). Sin JS la lista se ve entera.
 */
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Group = { id: string; es: string; en: string; count: number };
const TIERS = ["S", "A", "B"] as const;

export function CryptidSearch({
  locale,
  groups,
  tierCounts,
}: {
  locale: "es" | "en";
  groups: Group[];
  tierCounts: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [tiers, setTiers] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const es = locale === "es";

  useEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    const q = norm(query);
    let shown = 0;
    root.querySelectorAll<HTMLElement>("[data-cryptid-row]").forEach((row) => {
      const hit =
        (!q || norm(row.dataset.search ?? "").includes(q)) &&
        (!sel.size || sel.has(row.dataset.group ?? "")) &&
        (!tiers.size || tiers.has(row.dataset.tier ?? ""));
      row.hidden = !hit;
      if (hit) shown++;
    });
    for (const s of ["[data-cryptid-kind]", "[data-cryptid-group]"]) {
      root.querySelectorAll<HTMLElement>(s).forEach((box) => {
        box.hidden = !box.querySelector("[data-cryptid-row]:not([hidden])");
      });
    }
    setVisible(q || sel.size || tiers.size ? shown : null);
  }, [query, sel, tiers]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    setter(n);
  };
  const clearAll = () => {
    setQuery("");
    setSel(new Set());
    setTiers(new Set());
  };

  const label = es ? "Buscar críptido, país, año" : "Search cryptid, country, year";
  const active = [
    ...groups.filter((g) => sel.has(g.id)).map((g) => ({ key: `g-${g.id}`, label: es ? g.es : g.en, clear: () => toggle(sel, setSel, g.id) })),
    ...TIERS.filter((t) => tiers.has(t)).map((t) => ({ key: `t-${t}`, label: `Tier ${t}`, clear: () => toggle(tiers, setTiers, t) })),
  ];
  const removeLabel = es ? "Quitar filtro" : "Remove filter";

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
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center" role="group" aria-label={es ? "Filtrar críptidos" : "Filter cryptids"}>
        <span className="mr-1 hidden font-mono text-xs text-muted sm:inline">{es ? "Filtrar" : "Filter"}</span>
        <MultiSelect
          title={es ? "Categoría" : "Category"}
          allLabel={es ? "todas" : "all"}
          selected={sel}
          onToggle={(v) => toggle(sel, setSel, v)}
          onClear={() => setSel(new Set())}
          clearLabel={es ? "Todas las categorías" : "All categories"}
          options={groups.map((g) => ({ value: g.id, label: `${es ? g.es : g.en} · ${g.count}` }))}
        />
        <MultiSelect
          title={es ? "Evidencia" : "Evidence"}
          allLabel={es ? "toda" : "all"}
          selected={tiers}
          onToggle={(v) => toggle(tiers, setTiers, v)}
          onClear={() => setTiers(new Set())}
          clearLabel={es ? "Todos los niveles" : "All levels"}
          options={TIERS.map((t) => ({ value: t, label: `${TIER_META[t].label} · ${es ? TIER_META[t].plain : TIER_META[t].plain_en} · ${tierCounts[t] ?? 0}` }))}
        />
      </div>
      {(active.length > 0 || query) && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={a.clear}
              aria-label={`${removeLabel}: ${a.label}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>{a.label}</span>
              <span aria-hidden>✕</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-[44px] items-center font-mono text-xs text-muted underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {es ? "Limpiar todo" : "Clear all"}
          </button>
        </div>
      )}
      <p role="status" className="font-mono text-xs tabular-nums text-muted">
        {visible === 0
          ? es
            ? "Ningún críptido coincide con la búsqueda."
            : "No cryptid matches the search."
          : visible !== null
            ? es
              ? `${visible} ${visible === 1 ? "críptido" : "críptidos"}`
              : `${visible} ${visible === 1 ? "cryptid" : "cryptids"}`
            : ""}
      </p>
    </div>
  );
}

/** Menú desplegable con casillas: mismo aspecto que FacetSelect de /cases,
 *  pero admite varias opciones a la vez. Se cierra con Escape o al tocar fuera. */
function MultiSelect({
  title,
  allLabel,
  selected,
  onToggle,
  onClear,
  clearLabel,
  options,
}: {
  title: string;
  allLabel: string;
  selected: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
  clearLabel: string;
  options: Array<{ value: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const n = selected.size;
  return (
    <div ref={box} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        className={`relative block min-h-[44px] w-full truncate border py-2 pl-2.5 pr-7 text-left font-mono text-xs sm:w-auto sm:pl-3 sm:pr-8 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          n ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-panel text-text"
        }`}
      >
        {title} · {n ? n : allLabel}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted">
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-max min-w-full max-w-[85vw] border-2 border-text bg-bg p-1 shadow-lg">
          <button
            type="button"
            onClick={onClear}
            className="block min-h-[44px] w-full px-3 text-left font-mono text-xs text-muted hover:bg-panel hover:text-accent"
          >
            {clearLabel}
          </button>
          {options.map((o) => (
            <label key={o.value} className="flex min-h-[44px] cursor-pointer items-center gap-2 px-3 text-sm text-text hover:bg-panel">
              <input
                type="checkbox"
                checked={selected.has(o.value)}
                onChange={() => onToggle(o.value)}
                className="h-4 w-4 accent-accent"
              />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
