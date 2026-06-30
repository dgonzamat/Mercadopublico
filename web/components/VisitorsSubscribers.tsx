"use client";

import { T } from "@/components/T";
import { fmtDay } from "@/lib/visitorsFormat";

export interface SubDayTotal {
  day: string; // YYYY-MM-DD
  count: number;
}

export interface VisitorsSubscribersData {
  total: number | null; // registrados (null si no se pudo leer)
  activeToday: number; // suscriptores únicos activos hoy
  daily: SubDayTotal[]; // ascendente por día, ya filtrado al periodo
}

/**
 * Bloque de suscriptores (usuarios autenticados) que entran al sitio. Solo
 * conteos agregados — nunca identidades ni emails. "Activos" = suscriptores
 * únicos que entraron ese día.
 */
export function VisitorsSubscribers({ data }: { data: VisitorsSubscribersData }) {
  const { total, activeToday, daily } = data;
  const hasData = total !== null || activeToday > 0 || daily.length > 0;
  if (!hasData) return null;

  const maxDay = daily.reduce((m, d) => Math.max(m, d.count), 0) || 1;

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Suscriptores" en="Subscribers" />
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="border-2 border-text bg-panel px-3 py-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Registrados" en="Registered" />
          </p>
          <p className="mt-1 text-xl font-semibold text-text">
            {total === null ? "—" : total.toLocaleString()}
          </p>
        </div>
        <div className="border-2 border-text bg-panel px-3 py-3">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Activos hoy" en="Active today" />
          </p>
          <p className="mt-1 text-xl font-semibold text-text">
            {activeToday.toLocaleString()}
          </p>
        </div>
      </div>

      {daily.length >= 2 && (
        <div className="border-2 border-text bg-panel px-3 py-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Suscriptores activos / día" en="Active subscribers / day" />
          </p>
          <div
            className="flex h-16 items-end gap-[2px]"
            role="img"
            aria-label={`Suscriptores activos por día · ${daily.length} días · pico ${maxDay}`}
          >
            {daily.map((d) => (
              <div
                key={d.day}
                className="flex-1 bg-accent/70"
                style={{ height: `${Math.max((d.count / maxDay) * 100, 3)}%` }}
                title={`${fmtDay(d.day, "es")} · ${d.count}`}
                aria-hidden
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
