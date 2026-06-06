"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";

/**
 * Client-side search component.
 *
 * - Lazy-loads /search-index.json on first focus (no impact on First Load JS).
 * - Fuse.js fuzzy match with weighted keys (name > country > summary).
 * - Keyboard: `/` or Cmd/Ctrl+K to focus, ↑↓ to navigate, Enter to open,
 *   Esc to close.
 * - Results dropdown anchored under the input; mobile-friendly width.
 *
 * Why client-side: site is `output: "export"`, so no server runtime. The
 * 81-case index gzips to ~10 KB; Fuse.js is ~17 KB gzipped — trivial budget.
 */

interface IndexEntry {
  id: string;
  num: number;
  name: string;
  country: string;
  flag: string;
  year: string;
  year_start: number;
  tier: string;
  summary: string;
  summary_en?: string;
  patterns: string[];
}

export function SiteSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [fuse, setFuse] = useState<Fuse<IndexEntry> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy load the index on first focus.
  async function loadIndex() {
    if (index) return;
    try {
      const res = await fetch("/search-index.json");
      if (!res.ok) return;
      const data: IndexEntry[] = await res.json();
      setIndex(data);
      setFuse(
        new Fuse(data, {
          keys: [
            { name: "name", weight: 0.4 },
            { name: "country", weight: 0.2 },
            { name: "summary", weight: 0.15 },
            { name: "summary_en", weight: 0.1 },
            { name: "year", weight: 0.1 },
            { name: "patterns", weight: 0.05 },
          ],
          threshold: 0.35,
          ignoreLocation: true,
          includeScore: true,
          minMatchCharLength: 2,
        }),
      );
    } catch {
      /* network error — leave index null, input still degrades to empty */
    }
  }

  // Global hotkeys: `/` and Cmd/Ctrl+K open the search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (!isTyping && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = fuse && query.length >= 2
    ? fuse.search(query, { limit: 6 }).map((r) => r.item)
    : [];

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      e.preventDefault();
      window.location.href = `/cases/${results[selected].id}`;
    } else if (e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="site-search">
        Buscar caso, país, año
      </label>
      <input
        ref={inputRef}
        id="site-search"
        type="search"
        autoComplete="off"
        placeholder="Buscar…  ( / )"
        className="h-9 w-32 border border-border bg-bg px-3 font-mono text-xs text-text placeholder:text-muted focus:w-56 focus:border-accent focus:outline-none md:w-40 md:focus:w-64"
        value={query}
        onFocus={() => {
          loadIndex();
          setOpen(true);
          setSelected(0);
        }}
        onBlur={() => {
          // Delay to allow result click to register before close.
          setTimeout(() => setOpen(false), 150);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(0);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && query.length >= 2 && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 border-2 border-text bg-bg shadow-xl md:w-96">
          {results.length === 0 ? (
            <p className="p-4 font-mono text-xs uppercase tracking-widest text-muted">
              {fuse ? "sin resultados" : "cargando…"}
            </p>
          ) : (
            <ul role="listbox" className="max-h-[60vh] overflow-y-auto">
              {results.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === selected}>
                  <Link
                    href={`/cases/${r.id}`}
                    className={`block border-b border-border/40 px-4 py-3 text-sm last:border-b-0 ${
                      i === selected
                        ? "bg-text text-bg"
                        : "text-text hover:bg-panel"
                    }`}
                  >
                    <p className="flex items-center gap-2 font-display font-medium leading-tight">
                      <span aria-hidden>{r.flag}</span>
                      <span className="truncate">{r.name}</span>
                      <span
                        className={`ml-auto shrink-0 font-mono text-[10px] tabular-nums ${
                          i === selected ? "text-bg/70" : "text-muted"
                        }`}
                      >
                        {r.year} · Tier {r.tier}
                      </span>
                    </p>
                    <p
                      className={`mt-1 line-clamp-1 font-mono text-[11px] ${
                        i === selected ? "text-bg/70" : "text-muted"
                      }`}
                    >
                      {r.country} · {r.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-border bg-panel px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            ↑↓ navegar · Enter abrir · Esc cerrar
          </p>
        </div>
      )}
    </div>
  );
}
