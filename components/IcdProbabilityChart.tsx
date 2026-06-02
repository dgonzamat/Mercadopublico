import { HYPOTHESES } from "@/lib/hypotheses";
import { cases } from "@/lib/data";
import { evidenceCountFor } from "@/lib/hypothesisMapping";
import { T } from "@/components/T";
import { Eyebrow, H2, Caption } from "@/lib/typography";

/**
 * Editorial copy for hypotheses that legitimately have zero pattern
 * matches in the corpus. Avoids the misleading "0 casos · 0 patrones"
 * that looks like a bug. Each hypothesis explains WHY it has no
 * pattern-derived evidence rather than just showing zeros.
 */
function noEvidenceCopy(id: string): { es: string; en: string } {
  switch (id) {
    case "misidentificacion":
      return {
        es: "Aplica al universo pre-filtro de reportes (~95% Blue Book), no a los 52 casos institucionales del corpus",
        en: "Applies to the pre-filter universe of reports (~95% Blue Book), not to the 52 institutional cases of the corpus",
      };
    case "entidades-no-humanas":
      return {
        es: "Categoría paraguas — la evidencia específica aparece en sus subclases (interdimensional, psicoespiritual, tratado)",
        en: "Umbrella category — specific evidence appears in its subclasses (interdimensional, psychospiritual, treaty)",
      };
    case "psicoespiritual":
      return {
        es: "Sin patrones aislables en el corpus — su evidencia es testimonial, no estructural",
        en: "No isolable patterns in the corpus — its evidence is testimonial, not structural",
      };
    case "tratado-greys":
      return {
        es: "Sin evidencia primaria verificable en el corpus — es claim histórica específica (Cooper, Lazar)",
        en: "No verifiable primary evidence in the corpus — it is a specific historical claim (Cooper, Lazar)",
      };
    default:
      return {
        es: "Sin patrones específicos en el corpus actual",
        en: "No specific patterns in the current corpus",
      };
  }
}

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
        <Eyebrow>
          <T es="Juicio analítico · ICD-203" en="Analytical judgment · ICD-203" />
        </Eyebrow>
        <H2 id="probability-chart-title" className="max-w-3xl">
          <T es="¿Qué son los UAP?" en="What are UAPs?" />
          <br />
          <span className="text-muted">
            <T
              es="Probabilidad de cada proposición — independientes."
              en="Probability per proposition — independent."
            />
          </span>
        </H2>
        <Caption className="max-w-2xl pt-2">
          <T
            es={
              <>
                Las {rows.length} hipótesis son <strong>proposiciones independientes</strong>:
                cada P responde "¿es esto cierto de al menos algunos casos del corpus?". Las
                probabilidades <strong>NO suman 100%</strong> — los componentes pueden ser
                parcialmente verdaderos en simultáneo. Calibradas vía{" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  etiqueta ICD-203
                </a>{" "}
                — el estándar USIC para juicio analítico sin modelo formal.
              </>
            }
            en={
              <>
                The {rows.length} hypotheses are <strong>independent propositions</strong>:
                each P answers "is this true of at least some corpus cases?".
                Probabilities <strong>do NOT sum to 100%</strong> — components can be
                partially true simultaneously. Calibrated via{" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203 label
                </a>{" "}
                — the USIC standard for analytical judgment without a formal
                model.
              </>
            }
          />
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
                  <T es={h.label} en={h.labelEn} />
                </h3>
                <p
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: h.color }}
                >
                  <T es={h.icd.labelEs} en={h.icd.label} />{" "}
                  <span className="text-muted">
                    <T
                      es={`(${h.icd.label})`}
                      en={`(${Math.round(h.icd.min)}–${Math.round(h.icd.max)}%)`}
                    />
                  </span>
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

              <p className="text-sm text-muted">
                <T es={h.note} en={h.noteEn} />
              </p>

              <a
                href={`#${h.id}`}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent hover:underline"
              >
                <T
                  es="Ver razonamiento + casos asociados ↓"
                  en="See reasoning + associated cases ↓"
                />
              </a>
            </div>

            <div className="col-span-2 flex items-baseline gap-6 font-mono text-xs uppercase tracking-wider text-muted md:col-span-1 md:flex-col md:items-end md:gap-1 md:text-right">
              {h.evidence.caseCount > 0 ? (
                <>
                  <div>
                    <span className="font-display text-3xl text-text md:text-4xl">
                      {h.evidence.caseCount}
                    </span>{" "}
                    <T es="casos" en="cases" />
                  </div>
                  <div>
                    <span className="font-display text-xl text-text md:text-2xl">
                      {h.evidence.patternCount}
                    </span>{" "}
                    <T es="patrones" en="patterns" />
                  </div>
                </>
              ) : (
                <div className="max-w-[12rem] text-left text-[11px] normal-case tracking-normal text-muted md:text-right">
                  <T
                    es={noEvidenceCopy(h.id).es}
                    en={noEvidenceCopy(h.id).en}
                  />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <Caption className="max-w-2xl pt-4">
        <T
          es={
            <>
              Etiquetas son juicios analíticos calibrados, no posteriori de un
              modelo Bayesiano formal. El conteo de evidencia muestra cuántos
              casos exhiben patrones asociados — diferencia analítica dentro de
              una misma banda ICD-203. Razonamiento completo en{" "}
              <a className="text-accent hover:underline" href="/probabilidades">
                /probabilidades
              </a>
              .
            </>
          }
          en={
            <>
              Labels are calibrated analytical judgments, not posteriors of a
              formal Bayesian model. Evidence count shows how many cases exhibit
              associated patterns — analytical difference within the same
              ICD-203 band. Full reasoning at{" "}
              <a className="text-accent hover:underline" href="/probabilidades">
                /probabilidades
              </a>
              .
            </>
          }
        />
      </Caption>
    </section>
  );
}
