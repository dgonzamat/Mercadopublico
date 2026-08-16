"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { T } from "@/components/T";
import { REGION_ORDER, REGION_LABELS, type Region } from "@/lib/regions";

/**
 * Filtros de /researchers: búsqueda por nombre/rol + región. Componen en AND.
 *
 * Dos mecanismos distintos, por una razón: la REGIÓN es un conjunto cerrado,
 * así que la resuelve el CSS (`data-region-filter` en el contenedor, reglas en
 * globals.css) sin tocar el DOM. La BÚSQUEDA es texto libre y el CSS no puede
 * hacer substring, así que el JS marca `data-nomatch` en los ítems que no
 * calzan y una sola regla los oculta. El conteo y el ocultamiento de secciones
 * vacías van en JS por lo mismo que en CasesFilter: un `:has()` por faceta no
 * cubre las combinaciones (una sección puede tener ítems de la región activa y
 * ninguno que además calce con el texto).
 *
 * Cero data duplicada al cliente más allá de `data-search`, que el server ya
 * emite normalizado (sin diacríticos) para que "antonio" encuentre "Antônio".
 */
export function RegionFilter({
  counts,
  total,
  children,
  locale,
}: {
  counts: Partial<Record<Region, number>>;
  total: number;
  children: ReactNode;
  locale: "es" | "en";
}) {
  const [region, setRegion] = useState<Region | "all">("all");
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(total);
  const rootRef = useRef<HTMLDivElement>(null);
  const available = REGION_ORDER.filter((r) => (counts[r] ?? 0) > 0);

  // Sincroniza el DOM con el texto buscado, recuenta y marca las secciones sin
  // resultados. Es un efecto porque escribe en un sistema externo (el DOM).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = query
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    root.querySelectorAll<HTMLElement>("[data-search]").forEach((el) => {
      const hit = !q || (el.dataset.search ?? "").includes(q);
      if (hit) el.removeAttribute("data-nomatch");
      else el.setAttribute("data-nomatch", "");
    });

    const itemSel =
      `[data-region]${region !== "all" ? `[data-region="${region}"]` : ""}` +
      `:not([data-nomatch])`;
    setMatchCount(root.querySelectorAll(itemSel).length);
    root.querySelectorAll<HTMLElement>("[data-group]").forEach((g) => {
      if (g.querySelector(itemSel)) g.removeAttribute("data-empty");
      else g.setAttribute("data-empty", "");
    });
  }, [query, region]);

  const filtered = region !== "all" || query.trim() !== "";

  return (
    <div ref={rootRef} data-region-filter={region} className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs sm:flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                locale === "es"
                  ? "Buscar por nombre o rol…"
                  : "Search by name or role…"
              }
              aria-label={
                locale === "es"
                  ? "Buscar actor por nombre o rol"
                  : "Search actor by name or role"
              }
              className="min-h-[44px] w-full border border-border bg-panel px-3 py-1.5 text-sm text-text placeholder:text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={locale === "es" ? "Limpiar búsqueda" : "Clear search"}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted hover:text-accent"
              >
                ×
              </button>
            )}
          </div>
          <p
            aria-live="polite"
            className="font-mono text-xs uppercase tracking-widest text-muted"
          >
            {filtered ? (
              <T
                es={`${matchCount} de ${total} actores`}
                en={`${matchCount} of ${total} actors`}
                locale={locale}
              />
            ) : (
              <T
                es={`${total} actores`}
                en={`${total} actors`}
                locale={locale}
              />
            )}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={locale === "es" ? "Filtro por región" : "Filter by region"}
        >
          <Chip active={region === "all"} onClick={() => setRegion("all")} count={total}>
            <T es="Todas" en="All" locale={locale} />
          </Chip>
          {available.map((r) => (
            <Chip
              key={r}
              active={region === r}
              onClick={() => setRegion(r)}
              count={counts[r] ?? 0}
            >
              <T es={REGION_LABELS[r].es} en={REGION_LABELS[r].en} locale={locale} />
            </Chip>
          ))}
        </div>
      </div>

      {children}

      {matchCount === 0 && (
        <p className="border border-border bg-panel p-6 text-sm text-muted">
          <T
            es="Ningún actor coincide con esos filtros."
            en="No actor matches those filters."
            locale={locale}
          />{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRegion("all");
            }}
            className="text-accent underline underline-offset-4 hover:no-underline"
          >
            <T es="Limpiar todo" en="Clear all" locale={locale} />
          </button>
        </p>
      )}
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
