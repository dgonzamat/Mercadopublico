"use client";

import { useState } from "react";
import type { UAPCase } from "@/lib/types";
import { T } from "@/components/T";
import { CATEGORY_LABEL, pickLabel, type Locale } from "@/lib/explorer/fields";
import {
  type Filters,
  EMPTY_FILTERS,
  hasActiveFilters,
} from "@/lib/explorer/aggregate";

export interface FacetOptions {
  tiers: string[];
  categories: UAPCase["category"][];
  countries: string[];
  yearMin: number;
  yearMax: number;
}

export function FilterPanel({
  filters,
  onChange,
  options,
  locale,
  filteredCount,
  totalCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  options: FacetOptions;
  locale: Locale;
  filteredCount: number;
  totalCount: number;
}) {
  const [countryQuery, setCountryQuery] = useState("");

  const toggle = <K extends "tiers" | "categories" | "countries">(
    key: K,
    value: string,
  ) => {
    const arr = filters[key] as string[];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onChange({ ...filters, [key]: next });
  };

  const countries = options.countries.filter((c) =>
    c.toLowerCase().includes(countryQuery.toLowerCase()),
  );

  return (
    <aside className="space-y-6 border border-border bg-panel p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <T es="Filtros" en="Filters" />
        </p>
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
          >
            <T es="Limpiar" en="Clear" />
          </button>
        )}
      </div>

      <p className="border-y border-border/70 py-2 text-sm text-text">
        <span className="font-display text-2xl tabular-nums text-accent">
          {filteredCount}
        </span>{" "}
        <span className="text-muted">
          / {totalCount} <T es="casos" en="cases" />
        </span>
      </p>

      {/* TIER */}
      <FilterGroup label={{ es: "Nivel (Tier)", en: "Level (Tier)" }} locale={locale}>
        <div className="flex flex-wrap gap-2">
          {options.tiers.map((t) => (
            <Chip
              key={t}
              active={filters.tiers.includes(t)}
              onClick={() => toggle("tiers", t)}
            >
              Tier {t}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      {/* CATEGORY */}
      <FilterGroup label={{ es: "Categoría", en: "Category" }} locale={locale}>
        <div className="flex flex-wrap gap-2">
          {options.categories.map((c) => (
            <Chip
              key={c}
              active={filters.categories.includes(c)}
              onClick={() => toggle("categories", c)}
            >
              {pickLabel(CATEGORY_LABEL[c], locale)}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      {/* YEAR RANGE */}
      <FilterGroup label={{ es: "Rango de años", en: "Year range" }} locale={locale}>
        <div className="flex items-center gap-2">
          <NumberInput
            placeholder={String(options.yearMin)}
            value={filters.yearMin}
            onChange={(v) => onChange({ ...filters, yearMin: v })}
          />
          <span className="text-muted">–</span>
          <NumberInput
            placeholder={String(options.yearMax)}
            value={filters.yearMax}
            onChange={(v) => onChange({ ...filters, yearMax: v })}
          />
        </div>
      </FilterGroup>

      {/* PROBABILITY RANGE */}
      <FilterGroup label={{ es: "Probabilidad (%)", en: "Probability (%)" }} locale={locale}>
        <div className="flex items-center gap-2">
          <NumberInput
            placeholder="0"
            value={filters.probMin}
            onChange={(v) => onChange({ ...filters, probMin: v })}
          />
          <span className="text-muted">–</span>
          <NumberInput
            placeholder="100"
            value={filters.probMax}
            onChange={(v) => onChange({ ...filters, probMax: v })}
          />
        </div>
      </FilterGroup>

      {/* COUNTRY */}
      <FilterGroup
        label={
          filters.countries.length
            ? {
                es: `País · ${filters.countries.length}`,
                en: `Country · ${filters.countries.length}`,
              }
            : { es: "País", en: "Country" }
        }
        locale={locale}
      >
        {/* Seleccionados como chips removibles */}
        {filters.countries.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {filters.countries.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle("countries", c)}
                className="inline-flex items-center gap-1 border border-accent bg-accent px-2 py-0.5 text-xs text-bg hover:opacity-90"
              >
                <span className="max-w-[120px] truncate">{c}</span>
                <span aria-hidden>✕</span>
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={countryQuery}
          onChange={(e) => setCountryQuery(e.target.value)}
          placeholder={locale === "en" ? "Search…" : "Buscar…"}
          className="mb-2 w-full border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
        />
        <div className="max-h-44 divide-y divide-border/50 overflow-y-auto border border-border/60 bg-bg">
          {countries.map((c) => {
            const active = filters.countries.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle("countries", c)}
                aria-pressed={active}
                className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm transition ${
                  active
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-text hover:bg-panel"
                }`}
              >
                <span className="truncate">{c}</span>
                {active && <span aria-hidden className="shrink-0 text-accent">✓</span>}
              </button>
            );
          })}
          {countries.length === 0 && (
            <p className="px-2.5 py-3 text-xs text-muted">
              <T es="Sin coincidencias" en="No matches" />
            </p>
          )}
        </div>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  label,
  locale,
  children,
}: {
  label: { es: string; en: string };
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {pickLabel(label, locale)}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-accent bg-accent text-bg"
          : "border-border bg-bg text-text hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className="w-full border border-border bg-bg px-2 py-1.5 text-sm tabular-nums text-text outline-none focus:border-accent"
    />
  );
}
