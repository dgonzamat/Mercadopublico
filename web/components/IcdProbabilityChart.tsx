import { PRIMITIVE_HYPOTHESES } from "@/lib/hypotheses";
import { cases } from "@/lib/data";
import { evidenceCountFor, driftFor } from "@/lib/hypothesisMapping";
import { T } from "@/components/T";
import { Eyebrow, H2, Caption } from "@/lib/typography";

/**
 * Editorial copy for hypotheses that legitimately have zero pattern
 * matches in the corpus. Used only for primitive hypotheses whose
 * evidence is testimonial / claim-specific rather than corpus-pattern.
 */
function noEvidenceCopy(id: string): { es: string; en: string } {
  switch (id) {
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
  const rows = PRIMITIVE_HYPOTHESES.map((h) => ({
    ...h,
    evidence: evidenceCountFor(h.id, cases),
    drift: driftFor(
      h.id,
      h.corpusPct,
      { min: h.icd.min, max: h.icd.max },
      cases,
    ),
  })).sort((a, b) => {
    const bandDiff = b.icd.max - a.icd.max;
    if (bandDiff !== 0) return bandDiff;
    return b.corpusPct - a.corpusPct;
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
              es="Seis explicaciones plausibles. Cada caso puede ser más de una."
              en="Six plausible explanations. Each case can be more than one."
            />
          </span>
        </H2>
        <Caption className="max-w-2xl pt-2">
          <T
            es={
              <>
                Cada explicación se mide por separado — pueden ser varias
                verdaderas a la vez. La etiqueta (<em>casi cierto</em>,{" "}
                <em>probable</em>, <em>improbable</em>) viene del método que
                usan los analistas de inteligencia cuando no hay modelo
                matemático ({" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                ). Dos hipótesis más —{" "}
                <em>misidentificación</em> (universo previo al filtro) y{" "}
                <em>heterogeneidad</em> (consecuencia de las seis) — viven{" "}
                <a href="#antecedente-derivada" className="text-accent hover:underline">
                  aparte
                </a>
                .
              </>
            }
            en={
              <>
                Each explanation is measured on its own — several can be true
                at once. The label (<em>almost certain</em>, <em>likely</em>,{" "}
                <em>unlikely</em>) comes from the method intelligence analysts
                use without a mathematical model ({" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                ). Two further hypotheses —{" "}
                <em>misidentification</em> (the universe before the filter)
                and <em>heterogeneity</em> (a consequence of the six) — live{" "}
                <a href="#antecedente-derivada" className="text-accent hover:underline">
                  apart
                </a>
                .
              </>
            }
          />
        </Caption>
      </div>

      <div className="divide-y-2 divide-text/10 border-y-2 border-text/15">
        {rows.map((h, idx) => (
          <article
            key={h.id}
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

              <PressureBadge drift={h.drift} />

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
              Estos números son juicios calibrados, no salida de una fórmula.
              El conteo de casos a la derecha indica cuántos del corpus
              exhiben patrones asociados a cada hipótesis — sirve para
              comparar dos hipótesis que comparten la misma banda. Razonamiento
              completo en{" "}
              <a className="text-accent hover:underline" href="/probabilidades">
                /probabilidades
              </a>
              .
            </>
          }
          en={
            <>
              These numbers are calibrated judgments, not the output of a
              formula. The case count on the right shows how many corpus cases
              exhibit patterns associated with each hypothesis — useful when
              two hypotheses share a band. Full reasoning at{" "}
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

/**
 * PressureBadge — displays the per-hypothesis evidence pressure index
 * computed from the corpus, alongside the drift relative to calibrated
 * probability. Three states:
 *   - aligned (|drift| < 5pp): green check
 *   - minor-drift (5-10pp): yellow caution
 *   - review-needed (>10pp): orange flag
 *
 * The badge always shows raw pressure + supporting cases so the reader
 * sees the continuous component of the calibration, not just the band.
 */
function PressureBadge({
  drift,
}: {
  drift: {
    pressure: number;
    supportingCases: number;
    impliedPct: number;
    drift: number;
    status: "aligned" | "minor-drift" | "review-needed";
  };
}) {
  const sign = drift.drift >= 0 ? "+" : "−";
  const driftAbs = Math.abs(drift.drift).toFixed(1);
  const symbol =
    drift.status === "aligned"
      ? "✓"
      : drift.status === "minor-drift"
        ? "⚠"
        : "▲";
  const stateColor =
    drift.status === "aligned"
      ? "text-text/60"
      : drift.status === "minor-drift"
        ? "text-accent"
        : "text-tierS";

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-text/15 pl-3 font-mono text-[11px] uppercase tracking-wider text-muted">
      <span>
        <T es="Presión" en="Pressure" />:{" "}
        <span className="text-text">{drift.pressure.toFixed(1)} pts</span>
      </span>
      <span aria-hidden className="text-text/30">
        ·
      </span>
      <span>
        <T es="Implica" en="Implies" />:{" "}
        <span className="text-text">~{drift.impliedPct.toFixed(0)}%</span>
      </span>
      <span aria-hidden className="text-text/30">
        ·
      </span>
      <span className={stateColor}>
        <span aria-hidden>{symbol}</span>{" "}
        <T
          es={
            drift.status === "aligned"
              ? `alineado (${sign}${driftAbs} pp)`
              : drift.status === "minor-drift"
                ? `leve drift ${sign}${driftAbs} pp`
                : `revisar — drift ${sign}${driftAbs} pp`
          }
          en={
            drift.status === "aligned"
              ? `aligned (${sign}${driftAbs} pp)`
              : drift.status === "minor-drift"
                ? `minor drift ${sign}${driftAbs} pp`
                : `review — drift ${sign}${driftAbs} pp`
          }
        />
      </span>
    </div>
  );
}
