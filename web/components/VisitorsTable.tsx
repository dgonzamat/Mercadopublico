"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/T";
import { supabase } from "@/lib/supabase/client";

/** Código ISO-2 → emoji de bandera (indicadores regionales). */
function flagEmoji(cc: string): string {
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  const BASE = 0x1f1e6; // 🇦
  return String.fromCodePoint(
    BASE + cc.charCodeAt(0) - 65,
    BASE + cc.charCodeAt(1) - 65,
  );
}

const NAME_ES = new Intl.DisplayNames(["es"], { type: "region" });
const NAME_EN = new Intl.DisplayNames(["en"], { type: "region" });

function nameOf(cc: string, dn: Intl.DisplayNames, fallback: string): string {
  if (cc === "XX" || !/^[A-Z]{2}$/.test(cc)) return fallback;
  try {
    return dn.of(cc) || cc;
  } catch {
    return cc;
  }
}

interface Row {
  country: string;
  count: number;
}

type State = "loading" | "ok" | "empty" | "error" | "unconfigured";

export function VisitorsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<State>(
    supabase ? "loading" : "unconfigured",
  );

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    let alive = true;

    void sb
      .from("visits_by_country")
      .select("country,count")
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) {
          setState("error");
          return;
        }
        const sorted: Row[] = (data as Array<{ country: string; count: number | string }>)
          .map((r) => ({ country: r.country, count: Number(r.count) }))
          .sort((a, b) => b.count - a.count);
        const t = sorted.reduce((s, r) => s + r.count, 0);
        setRows(sorted);
        setTotal(t);
        setState(t > 0 ? "ok" : "empty");
      });

    return () => {
      alive = false;
    };
  }, []);

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
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Total de visitas" en="Total visits" />{" "}
        <span className="text-text">{total.toLocaleString()}</span>
        {" · "}
        <T es="países" en="countries" />{" "}
        <span className="text-text">{rows.length}</span>
      </p>

      <ul className="space-y-1.5">
        {rows.map((r) => {
          const pct = total ? (r.count / total) * 100 : 0;
          const barPct = max ? (r.count / max) * 100 : 0;
          return (
            <li
              key={r.country}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-border/60 py-1.5"
            >
              <span className="text-xl leading-none" aria-hidden>
                {flagEmoji(r.country)}
              </span>
              <div className="min-w-0">
                <span className="block truncate text-sm text-text">
                  <T
                    es={nameOf(r.country, NAME_ES, "Desconocido")}
                    en={nameOf(r.country, NAME_EN, "Unknown")}
                  />
                </span>
                <span
                  className="mt-1 block h-1 rounded bg-accent"
                  style={{ width: `${Math.max(barPct, 2)}%` }}
                  aria-hidden
                />
              </div>
              <span className="whitespace-nowrap text-right font-mono text-xs text-muted">
                <span className="text-text">{r.count.toLocaleString()}</span>{" "}
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>

      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        <T
          es="Agregado por país · sin cookies ni IPs"
          en="Aggregated by country · no cookies or IPs"
        />
      </p>
    </section>
  );
}
