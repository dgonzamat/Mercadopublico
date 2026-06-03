import { PRIMITIVE_HYPOTHESES } from "@/lib/hypotheses";
import { cases } from "@/lib/data";
import {
  evidenceCountFor,
  effectiveCalibration,
  type CalibrationSource,
} from "@/lib/hypothesisMapping";
import { pctToIcdLabel } from "@/lib/icd203";
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
  const rows = PRIMITIVE_HYPOTHESES.map((h) => {
    const calib = effectiveCalibration(h, cases);
    const effectiveIcd = pctToIcdLabel(calib.pct);
    return {
      ...h,
      evidence: evidenceCountFor(h.id, cases),
      effectivePct: calib.pct,
      source: calib.source,
      pressure: calib.pressure,
      supportingCases: calib.supportingCases,
      shift: calib.shift,
      effectiveIcd,
    };
  }).sort((a, b) => {
    const bandDiff = b.effectiveIcd.max - a.effectiveIcd.max;
    if (bandDiff !== 0) return bandDiff;
    return b.effectivePct - a.effectivePct;
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
                  <T es={h.effectiveIcd.labelEs} en={h.effectiveIcd.label} />{" "}
                  <span className="text-muted">
                    <T
                      es={`(${h.effectiveIcd.label})`}
                      en={`(${Math.round(h.effectiveIcd.min)}–${Math.round(h.effectiveIcd.max)}%)`}
                    />
                  </span>
                </p>
              </div>

              {/* 0–100% scale with tick markers, rendered full-width */}
              <div
                className="relative h-2 bg-text/10"
                role="progressbar"
                aria-valuemin={h.effectiveIcd.min}
                aria-valuemax={h.effectiveIcd.max}
                aria-valuenow={Math.round((h.effectiveIcd.min + h.effectiveIcd.max) / 2)}
                aria-valuetext={`${h.label}: ${h.effectiveIcd.labelEs}. Evidencia: ${h.evidence.caseCount} casos, ${h.evidence.patternCount} patrones.`}
              >
                <div
                  className="absolute h-full"
                  style={{
                    left: `${h.effectiveIcd.min}%`,
                    width: `${h.effectiveIcd.max - h.effectiveIcd.min}%`,
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

              <CalibrationSourceBadge
                source={h.source}
                pct={h.effectivePct}
                prior={h.corpusPct}
                pressure={h.pressure}
                supportingCases={h.supportingCases}
                shift={h.shift}
              />

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
              Cada probabilidad se deriva del prior del analista{" "}
              <strong>más</strong> la presión acumulada de los casos del
              corpus que la sostienen — recalibrada automáticamente en cada
              build. Los pesos por caso son públicos y declarados (ver{" "}
              <a className="text-accent hover:underline" href="/about">
                /about Cap. 5
              </a>
              ). Cuando un analista discrepa con el resultado derivado, puede
              declarar un ajuste manual; el sitio lo indica explícitamente.
              Razonamiento completo en{" "}
              <a className="text-accent hover:underline" href="/probabilidades">
                /probabilidades
              </a>
              .
            </>
          }
          en={
            <>
              Each probability is derived from the analyst&apos;s prior{" "}
              <strong>plus</strong> the accumulated pressure of the corpus
              cases that sustain it — auto-recalibrated on every build.
              Per-case weights are public and declared (see{" "}
              <a className="text-accent hover:underline" href="/about">
                /about Ch. 5
              </a>
              ). When an analyst disagrees with the derived result, they
              can declare a manual override; the site flags it explicitly.
              Full reasoning at{" "}
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
 * CalibrationSourceBadge — shows how the displayed probability was
 * obtained. Three sources, all build-time computed:
 *
 *   - "derived":  effective = prior + pressure × 0.5. Default for
 *                 primitive hypotheses. Updates with every case added.
 *   - "prior":    pressure = 0 (no cases declared for this hypothesis).
 *                 Falls back to the prior.
 *   - "override": `corpusPctOverride` declared on the hypothesis (used by
 *                 antecedent/derived hypotheses whose pct doesn't come
 *                 from corpus).
 *
 * Always shows pressure + case count so the audit trail is visible.
 */
function CalibrationSourceBadge({
  source,
  pct,
  prior,
  pressure,
  supportingCases,
  shift,
}: {
  source: "override" | "derived" | "prior";
  pct: number;
  prior: number;
  pressure: number;
  supportingCases: number;
  shift: number;
}) {
  const sign = shift >= 0 ? "+" : "−";
  const shiftAbs = Math.abs(shift).toFixed(1);
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-text/15 pl-3 font-mono text-[11px] uppercase tracking-wider text-muted">
      {source === "derived" && (
        <>
          <span>
            <T es="Derivado" en="Derived" />:{" "}
            <span className="text-text">
              {prior.toFixed(0)} ({" "}
              <T es="prior" en="prior" />) {sign} {shiftAbs}{" "}
              <T es="pp presión" en="pp pressure" /> ={" "}
              <strong>{pct.toFixed(0)}%</strong>
            </span>
          </span>
          <span aria-hidden className="text-text/30">
            ·
          </span>
          <span>
            <span className="text-text">{supportingCases}</span>{" "}
            <T es="casos contribuyen" en="cases contribute" />
          </span>
          <span aria-hidden className="text-text/30">
            ·
          </span>
          <span>
            <T es="Presión" en="Pressure" />:{" "}
            <span className="text-text">{pressure.toFixed(1)} pts</span>
          </span>
        </>
      )}
      {source === "prior" && (
        <>
          <span>
            <T es="Prior" en="Prior" />:{" "}
            <span className="text-text">{pct.toFixed(0)}%</span>
          </span>
          <span aria-hidden className="text-text/30">
            ·
          </span>
          <span className="text-muted/70">
            <T
              es="ningún caso del corpus contribuye aún"
              en="no corpus case contributes yet"
            />
          </span>
        </>
      )}
      {source === "override" && (
        <span className="text-accent">
          <T
            es="Ajuste manual aplicado"
            en="Manual override applied"
          />
        </span>
      )}
    </div>
  );
}
