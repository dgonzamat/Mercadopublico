"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { UAPCase } from "@/lib/types";
import { T } from "@/components/T";
import { CATEGORY_LABEL, pickLabel, type Locale } from "@/lib/explorer/fields";
import { toCsv, type CsvColumn } from "@/lib/explorer/aggregate";

interface Column {
  key: string;
  header: { es: string; en: string };
  get: (c: UAPCase) => string | number;
  numeric?: boolean;
  align?: "left" | "right";
}

const COLUMNS: Column[] = [
  { key: "num", header: { es: "Nº", en: "No." }, get: (c) => c.num, numeric: true, align: "right" },
  { key: "name", header: { es: "Caso", en: "Case" }, get: (c) => c.name },
  { key: "year_start", header: { es: "Año", en: "Year" }, get: (c) => c.year_start, numeric: true, align: "right" },
  { key: "country_name", header: { es: "País", en: "Country" }, get: (c) => c.country_name },
  { key: "tier", header: { es: "Tier", en: "Tier" }, get: (c) => c.tier },
  { key: "category", header: { es: "Categoría", en: "Category" }, get: (c) => c.category },
  { key: "probability", header: { es: "%", en: "%" }, get: (c) => c.probability, numeric: true, align: "right" },
  { key: "patterns", header: { es: "Patrones", en: "Patterns" }, get: (c) => c.patterns?.length ?? 0, numeric: true, align: "right" },
];

const DEFAULT_VISIBLE = ["num", "name", "year_start", "country_name", "tier", "category", "probability"];

export function DataTable({ rows, locale }: { rows: UAPCase[]; locale: Locale }) {
  const [sortKey, setSortKey] = useState<string>("num");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const cols = COLUMNS.filter((c) => visible.includes(c.key));

  const display = useMemo(() => {
    const q = query.toLowerCase();
    let r = q
      ? rows.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.country_name.toLowerCase().includes(q),
        )
      : rows;
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (col) {
      r = [...r].sort((a, b) => {
        const va = col.get(a);
        const vb = col.get(b);
        const cmp =
          typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va).localeCompare(String(vb), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, query, sortKey, sortDir]);

  // Paginación: volver a la página 1 cuando cambia el conjunto o el orden.
  // Ajuste de estado durante el render (patrón soportado por React) en lugar de
  // un efecto con setState síncrono.
  const [prevDeps, setPrevDeps] = useState({ rows, query, sortKey, sortDir, pageSize });
  if (
    prevDeps.rows !== rows ||
    prevDeps.query !== query ||
    prevDeps.sortKey !== sortKey ||
    prevDeps.sortDir !== sortDir ||
    prevDeps.pageSize !== pageSize
  ) {
    setPrevDeps({ rows, query, sortKey, sortDir, pageSize });
    setPage(0);
  }

  const totalPages = Math.max(1, Math.ceil(display.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const paged = display.slice(start, start + pageSize);

  const onSort = (key: string) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCsv = () => {
    const csvCols: CsvColumn[] = cols.map((c) => ({
      key: c.key,
      header: pickLabel(c.header, locale),
      get: c.get,
    }));
    const csv = toCsv(display, csvCols);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uap-explorador.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === "en" ? "Search cases…" : "Buscar casos…"}
          className="min-w-48 flex-1 border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <details className="relative">
          <summary className="cursor-pointer list-none border border-border bg-bg px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:border-accent hover:text-accent">
            <T es="Columnas" en="Columns" />
          </summary>
          <div className="absolute right-0 z-20 mt-1 w-56 space-y-1 border border-border bg-panel p-3 shadow-lg">
            {COLUMNS.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={visible.includes(c.key)}
                  onChange={() =>
                    setVisible((v) =>
                      v.includes(c.key) ? v.filter((k) => k !== c.key) : [...v, c.key],
                    )
                  }
                  className="accent-accent"
                />
                {pickLabel(c.header, locale)}
              </label>
            ))}
          </div>
        </details>
        <button
          type="button"
          onClick={exportCsv}
          className="border border-border bg-bg px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:border-accent hover:text-accent"
        >
          <T es="Exportar CSV" en="Export CSV" />
        </button>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-text bg-panel">
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => onSort(c.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted hover:text-accent ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {pickLabel(c.header, locale)}
                  {sortKey === c.key && (
                    <span aria-hidden className="text-accent">
                      {sortDir === "asc" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => (
              <tr key={c.id} className="border-b border-border/60 hover:bg-bg">
                {cols.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-1.5 ${
                      col.align === "right" ? "text-right tabular-nums" : "text-left"
                    } ${col.key === "name" ? "max-w-xs truncate" : ""}`}
                  >
                    {col.key === "name" ? (
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-text underline-offset-2 hover:text-accent hover:underline"
                      >
                        {c.flag} {c.name}
                      </Link>
                    ) : col.key === "category" ? (
                      pickLabel(CATEGORY_LABEL[c.category], locale)
                    ) : (
                      col.get(c)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {display.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="px-3 py-8 text-center text-muted">
                  <T es="Sin casos para los filtros actuales" en="No cases for current filters" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* PAGINACIÓN */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {display.length === 0
            ? "0"
            : `${start + 1}–${Math.min(start + pageSize, display.length)}`}{" "}
          <T es="de" en="of" /> {display.length}{" "}
          <T es="filas" en="rows" />
        </p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="Por página" en="Per page" />
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-border bg-bg px-2 py-1 text-xs text-text outline-none focus:border-accent"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label={locale === "en" ? "Previous page" : "Página anterior"}
              className="border border-border bg-bg px-2.5 py-1 text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
            >
              ‹
            </button>
            <span className="min-w-16 text-center font-mono text-[11px] tabular-nums text-muted">
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              aria-label={locale === "en" ? "Next page" : "Página siguiente"}
              className="border border-border bg-bg px-2.5 py-1 text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
