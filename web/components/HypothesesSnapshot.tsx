import { PRIMITIVE_HYPOTHESES } from "@/lib/hypotheses";
import { cases } from "@/lib/data";
import { effectiveCalibration } from "@/lib/hypothesisMapping";
import { pctToIcdLabel } from "@/lib/icd203";
import { T } from "@/components/T";

/**
 * PB-1 · Snapshot de las 8 hipótesis para la Home.
 *
 * El foco del sitio son las probabilidades — la respuesta (los números)
 * debe vivir en la banda de tesis, no solo detrás de un CTA. Versión
 * compacta y sobria del IcdProbabilityChart, diseñada para fondo oscuro
 * (bg-text): barras crema, banda verbal ICD-203 + % en accent-bright.
 * Los colores identitarios por hipótesis quedan para /probabilidades
 * (no rinden contraste sobre #1a1a1a). Server component, cero JS.
 */
export function HypothesesSnapshot() {
  const rows = PRIMITIVE_HYPOTHESES.map((h) => {
    const calib = effectiveCalibration(h, cases);
    return { ...h, pct: calib.pct, icd: pctToIcdLabel(calib.pct) };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <div>
      {rows.map((h, i) => {
        const cleanLabel = h.label
          .replace(/^≥1 caso (es|involucra)\s+/i, "")
          .replace(/^Existe\s+/i, "");
        const cleanLabelEn = h.labelEn
          .replace(/^≥1 case (is|involves)\s+/i, "")
          .replace(/^A\s+/i, "");
        return (
          <div
            key={h.id}
            className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 border-b border-bg/10 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,18rem)_11rem]"
          >
            <span className="font-mono text-xs tabular-nums text-bg/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-base font-medium leading-snug text-bg">
              <T es={cleanLabel} en={cleanLabelEn} />
            </p>
            <div className="col-start-2 h-1.5 bg-bg/10 md:col-start-3">
              <div
                className="h-full bg-bg/80"
                style={{ width: `${Math.round(h.pct)}%` }}
              />
            </div>
            <p className="col-start-2 font-mono text-[11px] uppercase tracking-wider text-accent-bright md:col-start-4 md:text-right">
              <T es={h.icd.labelEs} en={h.icd.label} /> ·{" "}
              {Math.round(h.pct)}%
            </p>
          </div>
        );
      })}
      <p className="pt-4 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="Un caso puede caer en varias hipótesis — los % no compiten ni suman 100 · ICD-203"
          en="A case can fall into several hypotheses — the %s don't compete or sum to 100 · ICD-203"
        />
      </p>
    </div>
  );
}
