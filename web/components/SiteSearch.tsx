"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";

/**
 * Client-side search component.
 *
 * - Lazy-loads /search-index.json on first focus (no impact on First Load JS).
 * - Fuse.js fuzzy match with weighted keys (name > subtitle > summary).
 * - Indexes cases AND researchers; each entry's `type` decides route +
 *   badge color so a search for "Grusch" lands on /researchers/grusch,
 *   not nothing.
 * - Keyboard: `/` or Cmd/Ctrl+K to focus, ↑↓ to navigate, Enter to open,
 *   Esc to close. (Mobile variant skips the hotkey listener.)
 */

interface IndexEntry {
  type: "case" | "researcher";
  id: string;
  num: number;
  name: string;
  subtitle: string;
  meta: string;
  flag: string;
  year: string;
  year_start: number;
  summary: string;
  summary_en?: string;
  keywords: string;
}

interface Props {
  variant?: "default" | "mobile";
  onSelect?: () => void;
}

function hrefFor(e: IndexEntry): string {
  return e.type === "researcher" ? `/researchers/${e.id}` : `/cases/${e.id}`;
}

function badgeLabelFor(type: IndexEntry["type"]): string {
  return type === "researcher" ? "PERSONA" : "CASO";
}

export function SiteSearch({ variant = "default", onSelect }: Props = {}) {
  const router = useRouter();
  const isMobile = variant === "mobile";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [fuse, setFuse] = useState<Fuse<IndexEntry> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
            { name: "name", weight: 0.45 },
            { name: "subtitle", weight: 0.15 },
            { name: "summary", weight: 0.15 },
            { name: "summary_en", weight: 0.1 },
            { name: "year", weight: 0.1 },
            { name: "keywords", weight: 0.05 },
          ],
          threshold: 0.35,
          ignoreLocation: true,
          includeScore: true,
          minMatchCharLength: 2,
        }),
      );
    } catch {
      /* network error — leave fuse null, dropdown shows "cargando…" */
    }
  }

  useEffect(() => {
    if (isMobile) return;
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
  }, [isMobile]);

  const results =
    fuse && query.length >= 2
      ? fuse.search(query, { limit: isMobile ? 8 : 6 }).map((r) => r.item)
      : [];

  function selectAt(i: number) {
    const r = results[i];
    if (!r) return;
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    onSelect?.();
    router.push(hrefFor(r));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      e.preventDefault();
      selectAt(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
      setOpen(false);
    }
  }

  // ── Styling per variant ─────────────────────────────────────────────
  const wrapClass = isMobile ? "" : "relative";
  const inputClass = isMobile
    ? "h-12 w-full border-2 border-bg/30 bg-text px-4 font-mono text-sm text-bg placeholder:text-bg/50 focus:border-accent focus:outline-none"
    : "h-9 w-32 border border-border bg-bg px-3 font-mono text-xs text-text placeholder:text-muted focus:w-56 focus:border-accent focus:outline-none md:w-40 md:focus:w-64";
  const panelClass = isMobile
    ? "mt-3 border-2 border-bg/30 bg-text"
    : "absolute right-0 top-full z-50 mt-2 w-80 border-2 border-text bg-bg shadow-xl md:w-96";
  const itemBaseClass = isMobile
    ? "block min-h-[68px] border-b border-bg/15 px-4 py-4 text-sm last:border-b-0"
    : "block border-b border-border/40 px-4 py-3 text-sm last:border-b-0";
  const itemActiveOn = isMobile ? "bg-bg text-text" : "bg-text text-bg";
  const itemIdle = isMobile
    ? "text-bg hover:bg-bg hover:text-text"
    : "text-text hover:bg-panel";
  const metaIdle = isMobile ? "text-bg/60" : "text-muted";
  const metaActive = isMobile ? "text-text/70" : "text-bg/70";
  const emptyClass = isMobile
    ? "p-4 font-mono text-xs uppercase tracking-widest text-bg/60"
    : "p-4 font-mono text-xs uppercase tracking-widest text-muted";
  const footerClass = isMobile
    ? "border-t border-bg/15 bg-text px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-bg/60"
    : "border-t border-border bg-panel px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted";

  return (
    <div className={wrapClass}>
      <label className="sr-only" htmlFor={isMobile ? "site-search-mobile" : "site-search"}>
        Buscar caso, persona, país, año
      </label>
      <input
        ref={inputRef}
        id={isMobile ? "site-search-mobile" : "site-search"}
        type="search"
        autoComplete="off"
        placeholder={isMobile ? "Buscar caso, persona, país, año…" : "Buscar…  ( / )"}
        className={inputClass}
        value={query}
        onFocus={() => {
          loadIndex();
          setOpen(true);
          setSelected(0);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), isMobile ? 200 : 150);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(0);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && query.length >= 2 && (
        <div className={panelClass}>
          {results.length === 0 ? (
            <p className={emptyClass}>{fuse ? "sin resultados" : "cargando…"}</p>
          ) : (
            <ul role="listbox" className={isMobile ? "" : "max-h-[60vh] overflow-y-auto"}>
              {results.map((r, i) => (
                <li key={`${r.type}-${r.id}`} role="option" aria-selected={i === selected}>
                  <Link
                    href={hrefFor(r)}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      onSelect?.();
                    }}
                    className={`${itemBaseClass} ${
                      i === selected ? itemActiveOn : itemIdle
                    }`}
                  >
                    <p className="flex items-center gap-2 font-display font-medium leading-tight">
                      {r.flag && <span aria-hidden>{r.flag}</span>}
                      <span className="truncate">{r.name}</span>
                      <span
                        className={`ml-auto shrink-0 font-mono text-[9px] uppercase tracking-widest ${
                          i === selected ? metaActive : metaIdle
                        }`}
                      >
                        {badgeLabelFor(r.type)}
                      </span>
                    </p>
                    <p
                      className={`mt-1 line-clamp-1 font-mono text-[11px] ${
                        i === selected ? metaActive : metaIdle
                      }`}
                    >
                      {r.subtitle}{r.meta ? ` · ${r.meta}` : ""} · {r.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!isMobile && (
            <p className={footerClass}>↑↓ navegar · Enter abrir · Esc cerrar</p>
          )}
        </div>
      )}
    </div>
  );
}
