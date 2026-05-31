import { HYPOTHESES } from "@/lib/hypotheses";
import { cases } from "@/lib/data";
import { evidenceCountFor } from "@/lib/hypothesisMapping";

/**
 * Probability chart using ICD-203 labels + ranges instead of single
 * decimal percentages. Hypotheses sharing the same ICD band are
 * differentiated by a second axis: count of corpus cases + patterns
 * that support them. That keeps the ICD-203 honesty while exposing
 * the analytical asymmetry between bands.
 */
export function IcdProbabilityChart() {
  const rows = HYPOTHESES.map((h) => ({
    ...h,
    evidence: evidenceCountFor(h.id, cases),
  })).sort((a, b) => {
    // Primary: by ICD-203 band (highest probability first).
    const bandDiff = b.icd.max - a.icd.max;
    if (bandDiff !== 0) return bandDiff;
    // Within band: by evidence count descending.
    return b.evidence.caseCount - a.evidence.caseCount;
  });

  return (
    <section aria-labelledby="probability-chart-title">
      <h2 id="probability-chart-title" className="text-sm font-mono uppercase tracking-widest text-muted">
        ¿Qué son los UAP? — probabilidad por hipótesis
      </h2>
      <p className="mt-3 max-w-2xl text-text">
        Las 6 hipótesis principales con probabilidad expresada como{" "}
        <a
          href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          etiqueta ICD-203
        </a>{" "}
        — el estándar USIC para juicio analítico cuando no hay modelo formal.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-panel">
        {rows.map((h, idx) => (
          <div
            key={h.id}
            id={h.id}
            className={`px-5 py-4 ${idx > 0 ? "border-t border-border" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-text">{h.label}</p>
              <span
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: h.color }}
              >
                {h.icd.labelEs} <span className="opacity-60">({h.icd.label})</span>
              </span>
            </div>

            {/* Range bar: shows the full ICD-203 range as a band. The bar
                is the canonical numeric form — no redundant "5–20%" text. */}
            <div
              className="relative mt-2 h-2 overflow-hidden rounded-full bg-bg"
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
              {/* Scale tick markers at 25/50/75 for reference */}
              <div className="absolute inset-y-0 left-1/4 w-px bg-border/40" aria-hidden />
              <div className="absolute inset-y-0 left-1/2 w-px bg-border/40" aria-hidden />
              <div className="absolute inset-y-0 left-3/4 w-px bg-border/40" aria-hidden />
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-3 text-xs">
              <span className="font-mono text-muted">
                <span className="text-text">{h.evidence.caseCount}</span> casos ·{" "}
                <span className="text-text">{h.evidence.patternCount}</span> patrones
              </span>
              <span className="text-right text-muted">{h.note}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Las etiquetas (Roughly Even, Very Unlikely, etc.) son juicios analíticos calibrados,
        no posteriori derivados de un modelo Bayesiano formal. El conteo de evidencia muestra
        cuántos casos del corpus exhiben patrones asociados a cada hipótesis — diferencia
        analítica dentro de una misma banda ICD-203. El razonamiento detrás de cada{" "}
        <a className="text-accent hover:underline" href="/probabilidades">se documenta en /probabilidades</a>.
      </p>
    </section>
  );
}
