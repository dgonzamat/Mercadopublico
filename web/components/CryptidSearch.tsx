"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Buscador propio de /cryptids (26 nov 2026, decisión del dueño: UAP y
 * críptidos se buscan por separado). Filtra en el sitio las filas que ya
 * renderiza el servidor: cada fila lleva `data-cryptid-row` con su texto en
 * `data-search`, y cada criatura y categoría se ocultan si se quedan sin filas.
 * Sin JS la lista se ve entera, como antes.
 */
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function CryptidSearch({ locale }: { locale: "es" | "en" }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    const q = norm(query);
    let shown = 0;
    root.querySelectorAll<HTMLElement>("[data-cryptid-row]").forEach((row) => {
      const hit = !q || norm(row.dataset.search ?? "").includes(q);
      row.hidden = !hit;
      if (hit) shown++;
    });
    for (const sel of ["[data-cryptid-kind]", "[data-cryptid-group]"]) {
      root.querySelectorAll<HTMLElement>(sel).forEach((box) => {
        box.hidden = !box.querySelector("[data-cryptid-row]:not([hidden])");
      });
    }
    setVisible(q ? shown : null);
  }, [query]);

  const label = locale === "es" ? "Buscar críptido, país, año" : "Search cryptid, country, year";
  return (
    <div ref={ref} className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`${label}…`}
        aria-label={label}
        className="h-12 w-full border-2 border-border bg-panel px-4 font-mono text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <p role="status" className="text-sm text-muted">
        {visible === 0
          ? locale === "es"
            ? "Ningún críptido coincide con la búsqueda."
            : "No cryptid matches the search."
          : visible !== null
            ? locale === "es"
              ? `${visible} ${visible === 1 ? "resultado" : "resultados"}`
              : `${visible} ${visible === 1 ? "result" : "results"}`
            : ""}
      </p>
    </div>
  );
}
