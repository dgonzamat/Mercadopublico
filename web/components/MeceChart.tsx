import { T } from "@/components/T";
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
/** Share como % con 1 decimal: dos narrativas con el mismo nº de casos (p.ej.
 *  7.8) muestran el mismo % (5.5%), y los seis siguen sumando 100.0. */
const share = (x: number) => (x * 100).toFixed(1);

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
}) {
  const scored = items ?? corpusPosteriors();
  const N = scored.length;
  // Clasificación forzada + mundano/natural abierto en sus 3 sub-tipos (hipótesis
  // de primer nivel). Ningún caso queda en indeterminable.
  const rows = expandedHypotheses(scored, { consolidateNonHuman });

  const enh = scored.reduce((s, c) => s + entidadesNoHumanas(classifiedPosterior(c.posterior)), 0);
  const het = scored.reduce((s, c) => s + heterogeneidad(classifiedPosterior(c.posterior)), 0);

  return (
    <div>
      <div className="space-y-2.5">
        {rows.map((c) => (
          <div key={c.key}>
            <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
              <span className="min-w-0 uppercase tracking-wider text-text">
                <T es={c.label} en={c.labelEn} />
              </span>
              <span className="shrink-0 whitespace-nowrap text-right text-muted">
                {share(c.count / N)}%
                {!compact && (
                  <>
                    {" · "}
                    {c.count.toFixed(1)} <T es="casos" en="cases" />
                  </>
                )}
              </span>
            </div>
            <div className="mt-1 h-2 w-full bg-border/40">
              <div className="h-2" style={{ width: `${(c.count / N) * 100}%`, backgroundColor: c.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        <T
          es={totalLabelEs ?? `Suman 100% · ${N} casos de incidente · partición exhaustiva`}
          en={totalLabelEn ?? `Sum to 100% · ${N} incident cases · exhaustive partition`}
        />
      </p>
      {!compact && showDerived && (
        <div className="mt-4 space-y-3 border-t border-border pt-3 font-mono text-[11px]">
          {!consolidateNonHuman && (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="uppercase tracking-wider text-text">
                  <T es="Entidades no humanas" en="Non-human entities" />
                </div>
                <div className="text-muted">
                  <T es="derivada = encubierto + abierto" en="derived = covert + open" />
                </div>
              </div>
              <span className="shrink-0 text-muted">{pct(enh / N)}%</span>
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="uppercase tracking-wider text-text">
                <T es="Heterogeneidad" en="Heterogeneity" />
              </div>
              <div className="text-muted">
                <T es="derivada = 1 − mundano/natural" en="derived = 1 − mundane/natural" />
              </div>
            </div>
            <span className="shrink-0 text-muted">{pct(het / N)}%</span>
          </div>
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
