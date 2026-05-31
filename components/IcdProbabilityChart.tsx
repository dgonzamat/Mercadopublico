import { HYPOTHESES } from "@/lib/hypotheses";
import { cases } from "@/lib/data";
import { evidenceCountFor } from "@/lib/hypothesisMapping";
import { Eyebrow, H2, Caption } from "@/lib/typography";

/**
 * Probability chart — Tufte-style data layering.
 *
 * Each row is the unit. Removed: outer card border + bg, per-row borders,
 * decorative gridline ticks. Kept: the data (range bar, label, evidence
 * count, note). Data-ink ratio significantly higher than before.
 *
 * ICD-203 labels + ranges (no decimals). Second axis: evidence count
 * differentiates hypotheses sharing the same ICD band.
 */
export function IcdProbabilityChart() {
  const rows = HYPOTHESES.map((h) => ({
    ...h,
    evidence: evidenceCountFor(h.id, cases),
  })).sort((a, b) => {
    const bandDiff = b.icd.max - a.icd.max;
    if (bandDiff !== 0) return bandDiff;
    return b.evidence.caseCount - a.evidence.caseCount;
  });

  return (
    <section aria-labelledby="probability-chart-title" className="space-y-6">
      <div className="space-y-2">
        <Eyebrow>Juicio analítico · ICD-203</Eyebrow>
        <H2 id="probability-chart-title">
          ¿Qué son los UAP?
        </H2>
        <Caption className="max-w-2xl">
          Las 6 hipótesis principales con probabilidad expresada como{" "}
          <a
            href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            etiqueta ICD-203
          </a>{" "}
          — el estándar USIC para juicio analítico sin modelo formal.
        </Caption>
      </div>

      <div className="space-y-6">
        {rows.map((h) => (
          <div key={h.id} id={h.id} className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-base font-medium text-text">{h.label}</p>
              <span
                className="shrink-0 font-mono text-xs uppercase tracking-wider"
                style={{ color: h.color }}
              >
                {h.icd.labelEs}{" "}
                <span className="text-muted">({h.icd.label})</span>
              </span>
            </div>

            <div
              className="relative h-1.5 overflow-hidden rounded-full bg-panel"
              role="progressbar"
              aria-valuemin={h.icd.min}
              aria-valuemax={h.icd.max}
              aria-valuenow={Math.round((h.icd.min + h.icd.max) / 2)}
              aria-valuetext={`${h.label}: ${h.icd.labelEs} (${h.icd.label}). Evidencia: ${h.evidence.caseCount} casos, ${h.evidence.patternCount} patrones. Juicio analítico ICD-203, no inferencia formal.`}
            >
              <div
                className="absolute h-full rounded-full"
                style={{
                  left: `${h.icd.min}%`,
                  width: `${h.icd.max - h.icd.min}%`,
                  backgroundColor: h.color,
                }}
              />
            </div>

            <div className="flex items-baseline justify-between gap-4 text-xs">
              <span className="font-mono text-muted">
                <span className="text-text">{h.evidence.caseCount}</span> casos
                ·{" "}
                <span className="text-text">{h.evidence.patternCount}</span>{" "}
                patrones
              </span>
              <span className="text-right text-muted">{h.note}</span>
            </div>
          </div>
        ))}
      </div>

      <Caption className="border-t border-border pt-4">
        Etiquetas (Roughly Even, Very Unlikely, etc.) son juicios analíticos
        calibrados, no posteriori de un modelo Bayesiano formal. El conteo de
        evidencia muestra cuántos casos del corpus exhiben patrones asociados —
        diferencia analítica dentro de una misma banda ICD-203. Razonamiento
        completo en{" "}
        <a className="text-accent hover:underline" href="/probabilidades">
          /probabilidades
        </a>
        .
      </Caption>
    </section>
  );
}
