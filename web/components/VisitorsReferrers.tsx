import { T } from "@/components/T";
import { fmtNum } from "@/lib/visitorsFormat";

export interface ReferrerRow {
  domain: string;
  count: number;
}

/** Etiquetas de los dos valores que pone el servidor (migración 0011). */
const LABEL: Record<string, { es: string; en: string }> = {
  directo: { es: "Directo o desconocido", en: "Direct or unknown" },
  otro: { es: "Otro (no es un sitio web)", en: "Other (not a website)" },
};

/**
 * De qué sitio llegan los visitantes en el periodo: solo el dominio de la
 * página de entrada, una vez por visita (mismo gate que el conteo de países).
 * «Directo» junta a quien escribió la dirección, abrió un marcador o llegó
 * desde una app o un sitio que no envía referrer. Se registra desde el 20 nov
 * 2026; las visitas anteriores no tienen origen.
 */
export function VisitorsReferrers({ rows, limit = 12 }: { rows: ReferrerRow[]; limit?: number }) {
  const heading = (
    <p className="font-mono text-xs uppercase tracking-widest text-muted">
      <T es="De dónde llegan" en="Where visitors come from" />
    </p>
  );
  if (rows.length === 0) {
    return (
      <div className="space-y-1.5">
        {heading}
        <p className="border-2 border-text bg-panel px-4 py-4 text-sm text-muted">
          <T
            es="Aún sin datos de origen en este periodo (se registra desde el 20 nov 2026)."
            en="No referrer data in this period yet (recorded since Nov 20, 2026)."
          />
        </p>
      </div>
    );
  }

  const top = rows.slice(0, limit);
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = top[0].count || 1;

  return (
    <div className="space-y-1.5">
      {heading}
      <p className="font-mono text-[11px] text-muted">
        <T
          es={`Dominio de la página de entrada · % sobre ${total} visitas con origen registrado (desde el 20 nov 2026)`}
          en={`Domain of the entry page · % of ${total} visits with a recorded origin (since Nov 20, 2026)`}
        />
      </p>
      <ul className="space-y-1.5">
        {top.map((r) => {
          const pct = total ? (r.count / total) * 100 : 0;
          const label = LABEL[r.domain];
          return (
            <li
              key={r.domain}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-text/15 py-1.5"
            >
              <div className="min-w-0">
                <span className="block truncate text-sm text-text">
                  {label ? <T es={label.es} en={label.en} /> : r.domain}
                </span>
                <span
                  className="mt-1 block h-1.5 bg-accent"
                  style={{ width: `${Math.max((r.count / max) * 100, 2)}%` }}
                  aria-hidden
                />
              </div>
              <span className="whitespace-nowrap text-right font-mono text-xs text-muted">
                <span className="text-text">
                  <T es={fmtNum(r.count, "es")} en={fmtNum(r.count, "en")} />
                </span>{" "}
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
