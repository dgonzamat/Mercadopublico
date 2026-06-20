import { corpusPosteriors, documentPosteriors, expandedHypotheses } from "@/lib/meceModel";
import { T } from "@/components/T";

/**
 * Snapshot de las hipótesis para la Home (fondo oscuro bg-text).
 * Clasificación forzada sobre el corpus (incidentes por objeto + documentos por
 * lean), con mundano/natural abierto en sus 3 sub-tipos y no-humano consolidado.
 * Barras crema sobre oscuro; server component, cero JS.
 */
export function HypothesesSnapshot() {
  const scored = [...corpusPosteriors(), ...documentPosteriors()];
  const N = scored.length;
  const visibleRows = expandedHypotheses(scored, { consolidateNonHuman: true });

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es={`Cómo se clasifican los ${N} casos del corpus entre las hipótesis — suman 100%`}
          en={`How the corpus's ${N} cases classify among the hypotheses — they sum to 100%`}
        />
      </p>
      {visibleRows.map((c, i) => (
        <div
          key={c.key}
          className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 border-b border-bg/10 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,18rem)_5rem]"
        >
          <span className="font-mono text-xs tabular-nums text-bg/40">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="text-base font-medium leading-snug text-bg">
            <T es={c.label} en={c.labelEn} />
          </p>
          <div className="col-start-2 h-1.5 bg-bg/10 md:col-start-3">
            <div className="h-full bg-bg/80" style={{ width: `${(c.count / N) * 100}%` }} />
          </div>
          <p className="col-start-2 font-mono text-[11px] uppercase tracking-wider text-accent-bright md:col-start-4 md:text-right">
            {((c.count / N) * 100).toFixed(1)}%
          </p>
        </div>
      ))}
      <p className="pt-4 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="Clasificación forzada y comparable — las hipótesis reparten el 100% del corpus (mundano abierto en misid/natural/fraude; no-humano consolidado)"
          en="Forced, comparable classification — the hypotheses split 100% of the corpus (mundane opened into misid/natural/hoax; non-human consolidated)"
        />
      </p>
    </div>
  );
}
