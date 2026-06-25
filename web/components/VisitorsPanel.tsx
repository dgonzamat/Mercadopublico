"use client";

import { useEffect, useMemo, useState } from "react";
import { T } from "@/components/T";
import { supabase } from "@/lib/supabase/client";
import { fmtDateTime } from "@/lib/visitorsFormat";
import { VisitorsTable, type VisitorRow } from "@/components/VisitorsTable";
import { VisitorsMapLazy } from "@/components/VisitorsMapLazy";

interface DailyRow {
  day: string; // YYYY-MM-DD
  country: string;
  count: number;
}

type Period = "today" | "7d" | "30d" | "all";
type State = "loading" | "ok" | "empty" | "error" | "unconfigured";

const PERIODS: { key: Period; es: string; en: string }[] = [
  { key: "today", es: "Hoy", en: "Today" },
  { key: "7d", es: "7 días", en: "7 days" },
  { key: "30d", es: "30 días", en: "30 days" },
  { key: "all", es: "Todo", en: "All" },
];

/** Fecha (UTC, YYYY-MM-DD) de hace `days` días. */
function utcDayMinus(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function VisitorsPanel() {
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [state, setState] = useState<State>(
    supabase ? "loading" : "unconfigured",
  );

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    let alive = true;

    const load = () => {
      void sb
        .from("visits_daily")
        .select("day,country,count")
        .then(({ data, error }) => {
          if (!alive) return;
          if (error || !data) {
            setState("error");
            return;
          }
          const rows = (data as Array<{
            day: string;
            country: string;
            count: number | string;
          }>).map((r) => ({
            day: r.day,
            country: r.country,
            count: Number(r.count),
          }));
          setDaily(rows);
          setState(rows.length ? "ok" : "empty");
        });

      void sb
        .from("visits_by_country")
        .select("updated_at")
        .then(({ data }) => {
          if (!alive || !data) return;
          const last = (data as Array<{ updated_at: string }>).reduce(
            (m, r) => (r.updated_at > m ? r.updated_at : m),
            "",
          );
          setUpdatedAt(last || null);
        });
    };

    load();
    // Recarga una vez tras el conteo del beacon, para ver la propia visita.
    const refetch = setTimeout(load, 3500);
    return () => {
      alive = false;
      clearTimeout(refetch);
    };
  }, []);

  const { rows, total } = useMemo(() => {
    const today = utcDayMinus(0);
    const cutoff =
      period === "today"
        ? today
        : period === "7d"
          ? utcDayMinus(6)
          : period === "30d"
            ? utcDayMinus(29)
            : "0000-01-01";

    const byCountry: Record<string, number> = {};
    for (const r of daily) {
      const inRange = period === "all" ? true : r.day >= cutoff;
      if (inRange) byCountry[r.country] = (byCountry[r.country] ?? 0) + r.count;
    }
    const list: VisitorRow[] = Object.entries(byCountry)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
    return { rows: list, total: list.reduce((s, r) => s + r.count, 0) };
  }, [daily, period]);

  if (state === "unconfigured" || state === "error") {
    return (
      <p className="rounded border border-border bg-panel px-4 py-6 text-sm text-muted">
        <T
          es="No se pudieron cargar las estadísticas en este momento."
          en="Could not load the statistics right now."
        />
      </p>
    );
  }

  if (state === "loading") {
    return (
      <p className="px-1 py-6 font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Cargando…" en="Loading…" />
      </p>
    );
  }

  if (state === "empty") {
    return (
      <p className="rounded border border-border bg-panel px-4 py-6 text-sm text-muted">
        <T
          es="Aún no hay visitas registradas. Vuelve en un rato."
          en="No visits recorded yet. Check back later."
        />
      </p>
    );
  }

  const max = rows.length ? rows[0].count : 1;

  return (
    <section className="space-y-5">
      {/* Filtro de periodo */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Periodo"
      >
        {PERIODS.map((p) => {
          const active = p.key === period;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              aria-pressed={active}
              className={`inline-flex min-h-[44px] items-center border px-4 font-mono text-xs uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "border-accent bg-accent text-bg"
                  : "border-border bg-panel text-muted hover:text-text"
              }`}
            >
              <T es={p.es} en={p.en} />
            </button>
          );
        })}
      </div>

      {/* Mapa */}
      <VisitorsMapLazy points={rows} max={max} />

      {/* Total */}
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Total" en="Total" />{" "}
        <span className="text-text">{total.toLocaleString()}</span>
        {" · "}
        <T es="países" en="countries" />{" "}
        <span className="text-text">{rows.length}</span>
      </p>

      {/* Tabla */}
      <VisitorsTable rows={rows} total={total} />

      {updatedAt && (
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          <T es="Actualizado" en="Updated" />{": "}
          <span className="text-text">
            <T
              es={fmtDateTime(updatedAt, "es")}
              en={fmtDateTime(updatedAt, "en")}
            />
          </span>
        </p>
      )}

      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        <T
          es="Agregado por país · sin cookies ni IPs"
          en="Aggregated by country · no cookies or IPs"
        />
      </p>
    </section>
  );
}
