import { T } from "@/components/T";
import {
  MECE_CLASSES,
  corpusPosteriors,
  expectedCounts,
  roundedShares,
  entidadesNoHumanas,
  heterogeneidad,
} from "@/lib/meceModel";
import type { Posterior } from "@/lib/types";

const pct = (x: number) => (x * 100).toFixed(0);

/**
 * Partición comparable del corpus: las 6 narrativas reparten el 100%.
 * + vistas derivadas (entidades-no-humanas, heterogeneidad).
 */
export function MecePartition({ compact = false }: { compact?: boolean }) {
  const scored = corpusPosteriors();
  const N = scored.length;
  const counts = expectedCounts(scored);
  const shares = roundedShares(scored);
  const ranked = [...MECE_CLASSES].sort((a, b) => counts[b.id] - counts[a.id]);

  const enh = scored.reduce((s, c) => s + entidadesNoHumanas(c.posterior), 0);
  const het = scored.reduce((s, c) => s + heterogeneidad(c.posterior), 0);

  return (
    <div>
      <div className="space-y-2.5">
        {ranked.map((c) => (
          <div key={c.id}>
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span className="uppercase tracking-wider text-text">
                <T es={c.label} en={c.labelEn} />
              </span>
              <span className="text-muted">
                {shares[c.id]}%
                {!compact && (
                  <>
                    {" "}
                    · {counts[c.id].toFixed(1)} <T es="casos" en="cases" />
                  </>
                )}
              </span>
            </div>
            <div className="mt-1 h-2 w-full bg-border/40">
              <div className="h-2" style={{ width: `${(counts[c.id] / N) * 100}%`, backgroundColor: c.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        <T es={`Suman 100% · ${N} casos · partición exhaustiva`} en={`Sum to 100% · ${N} cases · exhaustive partition`} />
      </p>
      {!compact && (
        <div className="mt-4 space-y-1 border-t border-border pt-3 font-mono text-[11px]">
          <div className="flex items-baseline justify-between">
            <span className="uppercase tracking-wider text-text">
              <T es="Entidades no humanas (derivada = no-humano encubierto + abierto)" en="Non-human entities (derived = covert + open non-human)" />
            </span>
            <span className="text-muted">{pct(enh / N)}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="uppercase tracking-wider text-text">
              <T es="Heterogeneidad (derivada = 1 − mundano/natural)" en="Heterogeneity (derived = 1 − mundane/natural)" />
            </span>
            <span className="text-muted">{pct(het / N)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Posterior de un caso: barra apilada al 100% + clase modal. */
export function CasePosterior({ posterior }: { posterior: Posterior }) {
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
        <T es="Explicación modal" en="Modal explanation" />:{" "}
        <span style={{ color: m.c.color }} className="font-semibold">
          <T es={m.c.label} en={m.c.labelEn} />
        </span>{" "}
        {pct(m.v)}% · <T es="suma 100%" en="sums to 100%" />
      </p>
    </div>
  );
}
