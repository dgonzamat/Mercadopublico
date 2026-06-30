"use client";

import { useEffect, useMemo, useState } from "react";
import { T } from "@/components/T";
import { supabase } from "@/lib/supabase/client";
import { fmtDateTime } from "@/lib/visitorsFormat";
import { VisitorsTable, type VisitorRow } from "@/components/VisitorsTable";
import {
  VisitorsStats,
  type VisitorsStatsData,
} from "@/components/VisitorsStats";
import { VisitorsPages, type PageRow } from "@/components/VisitorsPages";
import {
  VisitorsSubscribers,
  type VisitorsSubscribersData,
} from "@/components/VisitorsSubscribers";
import { continentOf, type Continent } from "@/lib/continents";

interface CountryRow {
  country: string;
  count: number;
}
interface DayRow {
  day: string; // YYYY-MM-DD
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

/** Fecha de corte (UTC) para cada periodo; null = todo el histórico. */
function cutoffFor(period: Period): string | null {
  switch (period) {
    case "today":
      return utcDayMinus(0);
    case "7d":
      return utcDayMinus(6);
    case "30d":
      return utcDayMinus(29);
    default:
      return null;
  }
}

export function VisitorsPanel() {
  // Agregados YA calculados por el servidor para el periodo activo (RPCs
  // *_agg). No traemos filas crudas: PostgREST corta en 1000 filas y la
  // agregación en cliente se truncaba en silencio al crecer las tablas.
  const [countryRows, setCountryRows] = useState<CountryRow[]>([]);
  const [dayRows, setDayRows] = useState<DayRow[]>([]);
  const [pageRowsRaw, setPageRowsRaw] = useState<PageRow[]>([]);
  const [subDayRows, setSubDayRows] = useState<DayRow[]>([]);
  const [subTotal, setSubTotal] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [state, setState] = useState<State>(
    supabase ? "loading" : "unconfigured",
  );

  // El total de suscriptores casi no cambia: una sola vez, no por periodo.
  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    let alive = true;
    void sb.rpc("subscriber_total").then(({ data, error }) => {
      if (!alive || error) return;
      setSubTotal(Number(data));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Carga de agregados por periodo (re-fetch al cambiar de periodo). No
  // reseteamos a "loading" en cada cambio para no parpadear el skeleton: se
  // mantienen los datos previos hasta que llegan los nuevos.
  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    let alive = true;
    let lastLoad = 0;
    const since = cutoffFor(period);

    const num = (v: unknown) => Number(v);

    const load = () => {
      lastLoad = Date.now();
      void sb
        .rpc("visits_country_agg", { p_since: since })
        .then(({ data, error }) => {
          if (!alive) return;
          if (error || !data) {
            setState("error");
            return;
          }
          const rows = (data as Array<{ country: string; count: unknown }>).map(
            (r) => ({ country: r.country, count: num(r.count) }),
          );
          setCountryRows(rows);
          setState(rows.length ? "ok" : "empty");
        });

      void sb.rpc("visits_day_agg", { p_since: since }).then(({ data }) => {
        if (!alive || !data) return;
        setDayRows(
          (data as Array<{ day: string; count: unknown }>).map((r) => ({
            day: r.day,
            count: num(r.count),
          })),
        );
      });

      void sb
        .rpc("visits_pages_agg", { p_since: since, p_limit: 50 })
        .then(({ data }) => {
          if (!alive || !data) return;
          setPageRowsRaw(
            (data as Array<{ path: string; count: unknown }>).map((r) => ({
              path: r.path,
              count: num(r.count),
            })),
          );
        });

      void sb.rpc("subscriber_day_agg", { p_since: since }).then(({ data }) => {
        if (!alive || !data) return;
        setSubDayRows(
          (data as Array<{ day: string; count: unknown }>).map((r) => ({
            day: r.day,
            count: num(r.count),
          })),
        );
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
    // Recarga unas veces tras el beacon para ver la propia visita: la geo-IP
    // encadena proveedores y puede tardar unos segundos.
    const timers = [3500, 7000, 12000].map((ms) => setTimeout(load, ms));
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastLoad > 20000
      ) {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [period]);

  const { rows, total, stats, pageRows, subscribers } = useMemo(() => {
    const today = utcDayMinus(0);

    const list: VisitorRow[] = countryRows; // ya viene ordenado desc del server
    const totalVisits = list.reduce((s, r) => s + r.count, 0);

    const dailyTotals = dayRows; // ya viene ascendente por día
    const peak = dailyTotals.reduce<{ day: string; count: number } | null>(
      (best, d) => (!best || d.count > best.count ? d : best),
      null,
    );

    const byRegion: Record<string, number> = {};
    for (const r of countryRows) {
      const region: Continent | "XX" = continentOf(r.country) ?? "XX";
      byRegion[region] = (byRegion[region] ?? 0) + r.count;
    }
    const byContinent = Object.entries(byRegion)
      .map(([key, count]) => ({ key: key as Continent | "XX", count }))
      .sort((a, b) => b.count - a.count);

    const statsData: VisitorsStatsData = {
      total: totalVisits,
      countries: list.length,
      avgPerDay: dailyTotals.length ? totalVisits / dailyTotals.length : 0,
      peak,
      dailyTotals,
      byContinent,
    };

    const subsData: VisitorsSubscribersData = {
      total: subTotal,
      activeToday: subDayRows.find((r) => r.day === today)?.count ?? 0,
      daily: subDayRows,
    };

    return {
      rows: list,
      total: totalVisits,
      stats: statsData,
      pageRows: pageRowsRaw,
      subscribers: subsData,
    };
  }, [countryRows, dayRows, pageRowsRaw, subDayRows, subTotal]);

  if (state === "unconfigured" || state === "error") {
    return (
      <p className="border-2 border-text bg-panel px-4 py-6 text-sm text-muted">
        <T
          es="No se pudieron cargar las estadísticas en este momento."
          en="Could not load the statistics right now."
        />
      </p>
    );
  }

  if (state === "loading") {
    // Skeleton que imita el layout (filtros + tarjetas + listas) para evitar
    // el salto de contenido cuando llegan los datos. animate-pulse en bloques.
    return (
      <section
        className="space-y-5"
        aria-busy="true"
        aria-label="Cargando estadísticas"
      >
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <div
              key={p.key}
              className="h-11 w-20 animate-pulse border-2 border-text/30 bg-panel"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse border-2 border-text/30 bg-panel"
            />
          ))}
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse border-b border-text/15 bg-panel/60"
            />
          ))}
        </div>
        <span className="sr-only">
          <T es="Cargando…" en="Loading…" />
        </span>
      </section>
    );
  }

  // Nota: con state === "empty" (cero visitas) NO cortamos: mostramos el panel
  // completo igual, así se ven los filtros y el bloque de suscriptores. Cada
  // sección tiene su propio estado vacío.

  return (
    <section className="space-y-5">
      {/* Filtro de periodo */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Periodo">
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
                  : "border-text/30 bg-panel text-muted hover:text-text"
              }`}
            >
              <T es={p.es} en={p.en} />
            </button>
          );
        })}
      </div>

      {/* Estadísticas derivadas */}
      <VisitorsStats data={stats} />

      {/* Suscriptores (usuarios autenticados) */}
      <VisitorsSubscribers data={subscribers} />

      {/* Tabla por país */}
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Por país" en="By country" />
      </p>
      <VisitorsTable rows={rows} total={total} />

      {/* Páginas más visitadas */}
      <VisitorsPages rows={pageRows} />

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

      <div className="border-t-2 border-text pt-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          <T
            es="Agregado por país · sin cookies ni IPs"
            en="Aggregated by country · no cookies or IPs"
          />
        </p>
      </div>
    </section>
  );
}
