"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { T } from "@/components/T";

/**
 * Client-side search component.
 *
 * - Desktop: a search ICON in the header that opens an overlay panel
 *   (input + results) anchored to it. The overlay is absolutely positioned
 *   so it never competes for header width — that keeps the top bar from
 *   overflowing/overlapping the wordmark.
 * - Mobile: an always-visible input inside the nav drawer.
 * - Lazy-loads /search-index.json on first open (no impact on First Load JS).
 * - Fuse.js fuzzy match; indexes cases, researchers, posts, patterns,
 *   frameworks and static pages; each entry's `type` decides route + badge.
 * - Keyboard: `/` or Cmd/Ctrl+K to open, ↑↓ to navigate, Enter to open,
 *   Esc to close. (Mobile variant skips the hotkey listener.)
 */

interface IndexEntry {
  type: "case" | "researcher" | "post" | "pattern" | "framework" | "page";
  id: string;
  num: number;
  name: string;
  name_en?: string;
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
  dark?: boolean;
}

function hrefFor(e: IndexEntry): string {
  switch (e.type) {
    case "researcher":
      return `/researchers/${e.id}`;
    case "post":
      return `/blog/${e.id}`;
    case "pattern":
      return `/patterns/${e.id}`;
    case "framework":
      return `/frameworks/#${e.id}`;
    case "page":
      return `/${e.id}`;
    default:
      return `/cases/${e.id}`;
  }
}

function badgeLabelFor(type: IndexEntry["type"]): { es: string; en: string } {
  switch (type) {
    case "researcher":
      return { es: "PERSONA", en: "PERSON" };
    case "post":
      return { es: "BLOG", en: "BLOG" };
    case "pattern":
      return { es: "PATRÓN", en: "PATTERN" };
    case "framework":
      return { es: "MARCO", en: "FRAMEWORK" };
    case "page":
      return { es: "PÁGINA", en: "PAGE" };
    default:
      return { es: "CASO", en: "CASE" };
  }
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function SiteSearch({ variant = "default", onSelect, dark = false }: Props = {}) {
  const router = useRouter();
  const isMobile = variant === "mobile";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false); // results panel visible (query >= 2)
  const [expanded, setExpanded] = useState(false); // desktop overlay open
  const [selected, setSelected] = useState(0);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [fuse, setFuse] = useState<Fuse<IndexEntry> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Locale activo para atributos que no pueden usar <T> (placeholder, label).
  const [locale, setLocale] = useState<"es" | "en">("es");

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setLocale((el.dataset.locale as "es" | "en") || "es");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-locale"] });
    return () => obs.disconnect();
  }, []);

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

  function openSearch() {
    loadIndex();
    setExpanded(true);
    setOpen(true);
    setSelected(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setExpanded(false);
    setOpen(false);
  }

  // Hotkeys (desktop only): `/` or Cmd/Ctrl+K open the search overlay.
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
        openSearch();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const results =
    fuse && query.length >= 2
      ? fuse.search(query, { limit: isMobile ? 8 : 6 }).map((r) => r.item)
      : [];

  function selectAt(i: number) {
    const r = results[i];
    if (!r) return;
    closeSearch();
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
      closeSearch();
    }
  }

  // ── Styling per variant ─────────────────────────────────────────────
  const inputClass = isMobile
    ? "h-12 w-full border-2 border-bg/30 bg-text px-4 font-mono text-sm text-bg placeholder:text-bg/50 focus:border-accent focus:outline-none"
    : "h-11 w-full border-b border-border bg-bg px-4 font-mono text-sm text-text placeholder:text-muted focus:outline-none";
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

  const placeholder =
    locale === "es"
      ? "Buscar caso, persona, país, año…"
      : "Search case, person, country, year…";
  const srLabel =
    locale === "es"
      ? "Buscar caso, persona, país, año"
      : "Search case, person, country, year";

  // Shared results list (used by both variants).
  const resultsList =
    open && query.length >= 2 ? (
      results.length === 0 ? (
        <p className={emptyClass}>
          {fuse ? (
            <T es="sin resultados" en="no results" />
          ) : (
            <T es="cargando…" en="loading…" />
          )}
        </p>
      ) : (
        <ul role="listbox" className={isMobile ? "" : "max-h-[60vh] overflow-y-auto"}>
          {results.map((r, i) => (
            <li key={`${r.type}-${r.id}`} role="option" aria-selected={i === selected}>
              <Link
                href={hrefFor(r)}
                onClick={() => {
                  closeSearch();
                  setQuery("");
                  onSelect?.();
                }}
                className={`${itemBaseClass} ${i === selected ? itemActiveOn : itemIdle}`}
              >
                <p className="flex items-center gap-2 font-display font-medium leading-tight">
                  <span className="truncate">
                    {locale === "en" && r.name_en ? r.name_en : r.name}
                  </span>
                  <span
                    className={`ml-auto shrink-0 font-mono text-[9px] uppercase tracking-widest ${
                      i === selected ? metaActive : metaIdle
                    }`}
                  >
                    <T es={badgeLabelFor(r.type).es} en={badgeLabelFor(r.type).en} />
                  </span>
                </p>
                <p
                  className={`mt-1 line-clamp-1 font-mono text-[11px] ${
                    i === selected ? metaActive : metaIdle
                  }`}
                >
                  {r.subtitle}
                  {r.meta ? ` · ${r.meta}` : ""} ·{" "}
                  {locale === "en" && r.summary_en ? r.summary_en : r.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )
    ) : null;

  // ── Mobile: always-visible input in the drawer ──────────────────────
  if (isMobile) {
    return (
      <div>
        <label className="sr-only" htmlFor="site-search-mobile">
          {srLabel}
        </label>
        <input
          ref={inputRef}
          id="site-search-mobile"
          type="search"
          autoComplete="off"
          placeholder={placeholder}
          className={inputClass}
          value={query}
          onFocus={() => {
            loadIndex();
            setOpen(true);
            setSelected(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={handleKeyDown}
        />
        {open && query.length >= 2 && (
          <div className="mt-3 border-2 border-bg/30 bg-text">{resultsList}</div>
        )}
      </div>
    );
  }

  // ── Desktop: icon trigger + absolutely-positioned overlay ───────────
  return (
    <div className="relative flex items-center">
      <button
        type="button"
        aria-label={locale === "es" ? "Buscar  ( / )" : "Search  ( / )"}
        aria-expanded={expanded}
        onClick={() => (expanded ? closeSearch() : openSearch())}
        className={`inline-flex h-9 w-9 items-center justify-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          dark
            ? "border-bg/30 bg-transparent text-bg hover:bg-bg hover:text-text"
            : "border-border bg-bg text-text hover:bg-text hover:text-bg"
        }`}
      >
        <SearchIcon />
      </button>
      {expanded && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 border-2 border-text bg-bg shadow-xl md:w-96">
          <label className="sr-only" htmlFor="site-search">
            {srLabel}
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            autoComplete="off"
            placeholder={placeholder}
            className={inputClass}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onBlur={(e) => {
              // Cerrar solo si el foco no va a un resultado del listbox.
              // `relatedTarget` es el elemento que recibe el foco tras el blur;
              // si es un descendiente del overlay (un link), el click ya cerró.
              if (e.relatedTarget && e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                return; // foco dentro del overlay → no cerrar
              }
              closeSearch();
            }}
            onKeyDown={handleKeyDown}
          />
          {resultsList}
          <p className={footerClass}>
            <T
              es="↑↓ navegar · Enter abrir · Esc cerrar"
              en="↑↓ navigate · Enter open · Esc close"
            />
          </p>
        </div>
      )}
    </div>
  );
}
