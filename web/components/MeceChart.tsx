import { T } from "@/components/T";
import { MeceDonut } from "@/components/MeceDonut";
import {
  corpusPosteriors,
  expandedHypotheses,
  entidadesNoHumanas,
  heterogeneidad,
  classifiedPosterior,
  type ScoredCase,
} from "@/lib/meceModel";
import type { Posterior } from "@/lib/types";

const pct = (x: number) => (x * 100).toFixed(0);

/**
 * Partición comparable del corpus: las 6 narrativas reparten el 100%.
 * + vistas derivadas (entidades-no-humanas, heterogeneidad).
 */
export function MecePartition({
  compact = false,
  items,
  totalLabelEs,
  totalLabelEn,
  showDerived = true,
  consolidateNonHuman = false,
  hrefFor,
}: {
  compact?: boolean;
  /** Dataset a graficar; por defecto los incidentes (corpusPosteriors). */
  items?: ScoredCase[];
  /** Pie de gráfico ES/EN; por defecto "Suman 100% · N casos de incidente…". */
  totalLabelEs?: string;
  totalLabelEn?: string;
  /** Vistas derivadas (solo aplican a la partición de incidentes). */
  showDerived?: boolean;
  /** Fusiona las dos narrativas no-humanas en una sola barra "No-humano".
   *  Solo afecta la VISTA agregada; los datos por caso conservan la distinción. */
  consolidateNonHuman?: boolean;
  /** Si se provee, cada categoría (segmento de la cinta + fila de la leyenda)
   *  se vuelve un enlace a hrefFor(key) — p.ej. el ancla de su detalle. */
  hrefFor?: (key: string) => string | undefined;
}) {
  const scored = items ?? corpusPosteriors();
  const N = scored.length;
  // Clasificación forzada + mundano/natural abierto en sus 3 sub-tipos (hipótesis
  // de primer nivel). Ningún caso queda en indeterminable.
  const rows = expandedHypotheses(scored, { consolidateNonHuman });

  const enh = scored.reduce((s, c) => s + entidadesNoHumanas(classifiedPosterior(c.posterior)), 0);
  const het = scored.reduce((s, c) => s + heterogeneidad(classifiedPosterior(c.posterior)), 0);
  const anomalo = het;            // 1 − prosaico, sumado
  const prosaico = N - het;       // misid + natural + fraude
  const colorOf = Object.fromEntries(rows.map((r) => [r.key, r.color])) as Record<string, string>;
  const prosaicoColor = colorOf.misid ?? rows[0].color;
  const anomaloColor = colorOf.nohumano ?? colorOf.nohumano_encubierto ?? rows[rows.length - 1].color;

  return (
    <div>
      <MeceDonut
        rows={rows.map((c) => ({
          key: c.key,
          color: c.color,
          count: c.count,
          label: c.label,
          labelEn: c.labelEn,
          href: hrefFor?.(c.key),
        }))}
        N={N}
      />

      <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted">
        <T
          es={totalLabelEs ?? `Suman 100% · ${N} casos de incidente · partición exhaustiva`}
          en={totalLabelEn ?? `Sum to 100% · ${N} incident cases · exhaustive partition`}
        />
      </p>

      {!compact && showDerived && (
        <div className="mt-5 border-t border-border pt-4">
          {/* Eje macro: prosaico vs anómalo/secreto */}
          <div className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-panel">
            <div style={{ width: `${(prosaico / N) * 100}%`, backgroundColor: prosaicoColor }} />
            <div style={{ width: `${(anomalo / N) * 100}%`, backgroundColor: anomaloColor }} />
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-wider">
            <span className="text-text">
              <T es="Prosaico" en="Prosaic" /> <span className="tabular-nums text-muted">{pct(prosaico / N)}%</span>
            </span>
            <span className="text-text">
              <span className="tabular-nums text-muted">{pct(anomalo / N)}%</span> <T es="Anómalo / secreto" en="Anomalous / secret" />
            </span>
          </div>
          {!consolidateNonHuman && (
            <p className="mt-3 font-mono text-[11px] text-muted">
              <T es="Entidades no humanas (encubierto + abierto)" en="Non-human entities (covert + open)" />: {pct(enh / N)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Posterior de un caso: barra apilada al 100% + hipótesis modal (clasificación
 *  forzada; mundano/natural abierto en su sub-tipo). */
export function CasePosterior({ posterior, mundanoType }: { posterior: Posterior; mundanoType?: ScoredCase["mundanoType"] }) {
  const rows = expandedHypotheses([{ posterior, mundanoType }]);
  const m = rows[0];
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-sm">
        {rows.map((r) => (
          <div key={r.key} title={`${r.label}: ${pct(r.count)}%`} style={{ width: `${r.count * 100}%`, backgroundColor: r.color }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-text">
              <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: r.color }} />
              <T es={r.label} en={r.labelEn} />
            </span>
            <span className="text-muted">{pct(r.count)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        <T es="Hipótesis modal" en="Modal hypothesis" />:{" "}
        <span style={{ color: m.color }} className="font-semibold">
          <T es={m.label} en={m.labelEn} />
        </span>{" "}
        {pct(m.count)}% · <T es="suma 100%" en="sums to 100%" />
      </p>
    </div>
  );
}
