"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/T";
import { VISITORS_WORKER_URL, type VisitorStats } from "@/lib/visitors";

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

type State = "loading" | "ok" | "empty" | "error" | "unconfigured";

export function VisitorsTable() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [state, setState] = useState<State>(
    VISITORS_WORKER_URL ? "loading" : "unconfigured",
  );

  useEffect(() => {
    if (!VISITORS_WORKER_URL) return;
    let alive = true;
    fetch(`${VISITORS_WORKER_URL}/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((data: VisitorStats) => {
        if (!alive) return;
        setStats(data);
        setState(data.total > 0 ? "ok" : "empty");
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state === "unconfigured") {
    return (
      <p className="rounded border border-border bg-panel px-4 py-6 text-sm text-muted">
        <T
          es="Contador no configurado todavía. Despliega el Worker de Cloudflare (web/workers/visitors) y define NEXT_PUBLIC_VISITORS_WORKER_URL."
          en="Counter not configured yet. Deploy the Cloudflare Worker (web/workers/visitors) and set NEXT_PUBLIC_VISITORS_WORKER_URL."
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

  if (state === "error") {
    return (
      <p className="rounded border border-border bg-panel px-4 py-6 text-sm text-muted">
        <T
          es="No se pudieron cargar las estadísticas en este momento."
          en="Could not load the statistics right now."
        />
      </p>
    );
  }

  if (state === "empty" || !stats) {
    return (
      <p className="rounded border border-border bg-panel px-4 py-6 text-sm text-muted">
        <T
          es="Aún no hay visitas registradas."
          en="No visits recorded yet."
        />
      </p>
    );
  }

  const rows = Object.entries(stats.countries)
    .sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;

  return (
    <section className="space-y-5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Total de visitas" en="Total visits" />{" "}
        <span className="text-text">{stats.total.toLocaleString()}</span>
        {" · "}
        <T es="países" en="countries" />{" "}
        <span className="text-text">{rows.length}</span>
      </p>

      <ul className="space-y-1.5">
        {rows.map(([cc, n]) => {
          const pct = stats.total ? (n / stats.total) * 100 : 0;
          const barPct = max ? (n / max) * 100 : 0;
          return (
            <li
              key={cc}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-border/60 py-1.5"
            >
              <span className="text-xl leading-none" aria-hidden>
                {flagEmoji(cc)}
              </span>
              <div className="min-w-0">
                <span className="block truncate text-sm text-text">
                  <T
                    es={nameOf(cc, NAME_ES, "Desconocido")}
                    en={nameOf(cc, NAME_EN, "Unknown")}
                  />
                </span>
                <span
                  className="mt-1 block h-1 rounded bg-accent"
                  style={{ width: `${Math.max(barPct, 2)}%` }}
                  aria-hidden
                />
              </div>
              <span className="whitespace-nowrap text-right font-mono text-xs text-muted">
                <span className="text-text">{n.toLocaleString()}</span>{" "}
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>

      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        <T es="Vía Cloudflare · sin cookies" en="Via Cloudflare · cookieless" />
      </p>
    </section>
  );
}
