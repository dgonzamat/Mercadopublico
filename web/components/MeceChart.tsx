import { T } from "@/components/T";
import {
  MECE_CLASSES,
  corpusPosteriors,
  expectedCounts,
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
  // Clasificación forzada: ningún caso queda en indeterminable (la masa indet
  // se redistribuye sobre las narrativas sustantivas que el caso apoya).
  const scored = (items ?? corpusPosteriors()).map((s) => ({ ...s, posterior: classifiedPosterior(s.posterior) }));
  const N = scored.length;
  const counts = expectedCounts(scored);

  type Row = { key: string; label: string; labelEn: string; color: string; count: number };
  let rows: Row[];
  if (consolidateNonHuman) {
    rows = [];
    for (const c of MECE_CLASSES) {
      if (c.id === "nohumano_encubierto") continue; // se fusiona en la barra "No-humano"
      if (c.id === "nohumano_abierto") {
        rows.push({
          key: "nohumano",
          label: "No-humano",
          labelEn: "Non-human",
          color: c.color,
          count: counts.nohumano_encubierto + counts.nohumano_abierto,
        });
      } else {
        rows.push({ key: c.id, label: c.label, labelEn: c.labelEn, color: c.color, count: counts[c.id] });
      }
    }
  } else {
    rows = MECE_CLASSES.map((c) => ({ key: c.id, label: c.label, labelEn: c.labelEn, color: c.color, count: counts[c.id] }));
  }
  rows = rows.filter((r) => r.count > 0.001).sort((a, b) => b.count - a.count);

  const enh = scored.reduce((s, c) => s + entidadesNoHumanas(c.posterior), 0);
  const het = scored.reduce((s, c) => s + heterogeneidad(c.posterior), 0);

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

/** Posterior de un caso: barra apilada al 100% + clase modal. */
export function CasePosterior({ posterior: raw }: { posterior: Posterior }) {
  // Clasificación forzada: se redistribuye la masa indet sobre las narrativas
  // sustantivas (se conserva la distinción no-humano encubierto/abierto).
  const posterior = classifiedPosterior(raw);
  const entries = MECE_CLASSES.map((c) => ({ c, v: posterior[c.id] || 0 })).filter((e) => e.v > 0);
  const top = [...entries].sort((a, b) => b.v - a.v);
  const m = top[0];
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-sm">
        {entries.map(({ c, v }) => (
          <div key={c.id} title={`${c.label}: ${pct(v)}%`} style={{ width: `${v * 100}%`, backgroundColor: c.color }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {top.map(({ c, v }) => (
          <div key={c.id} className="flex items-baseline justify-between font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-text">
              <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: c.color }} />
              <T es={c.label} en={c.labelEn} />
            </span>
            <span className="text-muted">{pct(v)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        {m.c.id === "indet" ? (
          <>
            <span style={{ color: m.c.color }} className="font-semibold">
              <T es="Indeterminable" en="Indeterminable" />
            </span>{" "}
            {pct(m.v)}% ·{" "}
            {top[1] ? (
              <T
                es={`ninguna narrativa domina (2ª: ${top[1].c.label}, ${pct(top[1].v)}%)`}
                en={`no dominant narrative (2nd: ${top[1].c.labelEn}, ${pct(top[1].v)}%)`}
              />
            ) : (
              <T es="sin señal hacia ninguna narrativa" en="no signal toward any narrative" />
            )}
          </>
        ) : (
          <>
            <T es="Explicación modal" en="Modal explanation" />:{" "}
            <span style={{ color: m.c.color }} className="font-semibold">
              <T es={m.c.label} en={m.c.labelEn} />
            </span>{" "}
            {pct(m.v)}% · <T es="suma 100%" en="sums to 100%" />
          </>
        )}
      </p>
    </div>
  );
}
