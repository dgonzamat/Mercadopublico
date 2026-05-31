import { HYPOTHESES } from "@/lib/hypotheses";
import { cases } from "@/lib/data";
import { evidenceCountFor } from "@/lib/hypothesisMapping";
import { Eyebrow, H2, Caption } from "@/lib/typography";

/**
 * Probability chart — editorial format.
 *
 * Each hypothesis renders as a large, breathable row: oversized rank number
 * + label + ICD-203 band + a 12-column scale that places the band visually.
 * Removed all chrome (outer card, per-row borders). The data is the chrome.
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
    <section aria-labelledby="probability-chart-title" className="space-y-12">
      <div className="space-y-4">
        <Eyebrow>Juicio analítico · ICD-203</Eyebrow>
        <H2 id="probability-chart-title" className="max-w-3xl">
          ¿Qué son los UAP?
          <br />
          <span className="text-muted">Probabilidad por hipótesis.</span>
        </H2>
        <Caption className="max-w-2xl pt-2">
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

      <div className="divide-y-2 divide-text/10 border-y-2 border-text/15">
        {rows.map((h, idx) => (
          <article
            key={h.id}
            id={h.id}
            className="grid grid-cols-[3rem_1fr] items-baseline gap-6 py-8 md:grid-cols-[4rem_1fr_auto] md:py-10"
          >
            <span className="font-display text-3xl leading-none tabular-nums text-muted md:text-4xl">
              {String(idx + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0 space-y-4">
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-medium leading-tight text-text md:text-3xl">
                  {h.label}
                </h3>
                <p
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: h.color }}
                >
                  {h.icd.labelEs}{" "}
                  <span className="text-muted">({h.icd.label})</span>
                </p>
              </div>

              {/* 0–100% scale with tick markers, rendered full-width */}
              <div
                className="relative h-2 bg-text/10"
                role="progressbar"
                aria-valuemin={h.icd.min}
                aria-valuemax={h.icd.max}
                aria-valuenow={Math.round((h.icd.min + h.icd.max) / 2)}
                aria-valuetext={`${h.label}: ${h.icd.labelEs}. Evidencia: ${h.evidence.caseCount} casos, ${h.evidence.patternCount} patrones.`}
              >
                <div
                  className="absolute h-full"
                  style={{
                    left: `${h.icd.min}%`,
                    width: `${h.icd.max - h.icd.min}%`,
                    backgroundColor: h.color,
                  }}
                />
                {[25, 50, 75].map((tick) => (
                  <span
                    key={tick}
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-text/20"
                    style={{ left: `${tick}%` }}
                  />
                ))}
              </div>

              <p className="text-sm text-muted">{h.note}</p>
            </div>

            <div className="col-span-2 flex items-baseline gap-6 font-mono text-xs uppercase tracking-wider text-muted md:col-span-1 md:flex-col md:items-end md:gap-1 md:text-right">
              <div>
                <span className="font-display text-3xl text-text md:text-4xl">
                  {h.evidence.caseCount}
                </span>{" "}
                casos
              </div>
              <div>
                <span className="font-display text-xl text-text md:text-2xl">
                  {h.evidence.patternCount}
                </span>{" "}
                patrones
              </div>
            </div>
          </article>
        ))}
      </div>

      <Caption className="max-w-2xl pt-4">
        Etiquetas son juicios analíticos calibrados, no posteriori de un modelo
        Bayesiano formal. El conteo de evidencia muestra cuántos casos del
        corpus exhiben patrones asociados — diferencia analítica dentro de una
        misma banda ICD-203. Razonamiento completo en{" "}
        <a className="text-accent hover:underline" href="/probabilidades">
          /probabilidades
        </a>
        .
      </Caption>
    </section>
  );
}
