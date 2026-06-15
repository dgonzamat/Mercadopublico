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
    case "ontologico-no-materialista":
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
export function IcdProbabilityChart({ framing = true }: { framing?: boolean } = {}) {
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
              es="La respuesta del corpus es mixta — parte es uno, parte es otro."
              en="The corpus answer is mixed — part is one, part is another."
            />
          </span>
        </H2>
        {framing && (
          <Caption className="max-w-2xl pt-2">
            <T
              es={
                <>
                  Un mismo caso puede caer en varias hipótesis — por eso los
                  porcentajes <strong>no compiten ni suman 100</strong>.{" "}
                  <a href="/probabilidades" className="text-accent hover:underline">
                    Cómo se lee →
                  </a>
                </>
              }
              en={
                <>
                  A single case can fall into multiple hypotheses — that&apos;s
                  why the percentages <strong>don&apos;t compete or sum to
                  100</strong>.{" "}
                  <a href="/probabilidades" className="text-accent hover:underline">
                    How to read this →
                  </a>
                </>
              }
            />
          </Caption>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {rows.map((h) => {
          return (
            <article
              key={h.id}
              className="flex flex-col gap-3 border-l-4 bg-surface-2/50 p-5 md:p-6"
              style={{ borderColor: h.color }}
              aria-label={`${h.label}: ${h.effectiveIcd.labelEs}, ${Math.round(h.effectivePct)} por ciento`}
            >
              {/* ICD verbal label — dominant. Format matches /home CategoryFact.
                  PR-2 · texto en text-text (AA sobre surface-2); el color de la
                  hipótesis ya vive en el border-l-4 de la tarjeta. */}
              <p className="font-mono text-xs uppercase tracking-wider text-text">
                <T es={h.effectiveIcd.labelEs} en={h.effectiveIcd.label} />{" "}
                <span className="text-muted">
                  ({Math.round(h.effectivePct)}%)
                </span>
                {h.source === "override" && (
                  <span className="ml-2 border border-border bg-panel px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted">
                    <T es="calibración editorial" en="editorial calibration" />
                  </span>
                )}
              </p>

              {/* Título con el label COMPLETO: el prefijo "≥1 caso es…" ES el
                  claim. Recortarlo convertía "90% · tecnología de otro Estado"
                  en una afirmación que el modelo no hace. */}
              <h3 className="font-display text-xl font-medium leading-tight text-text md:text-2xl">
                <T es={h.label} en={h.labelEn} />
              </h3>

              {/* Hypothesis note */}
              <p className="text-sm leading-snug text-muted">
                <T es={h.note} en={h.noteEn} />
              </p>

              {/* Compact evidence — single line, no duplication */}
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {h.supportingCases > 0 ? (
                  <>
                    <span className="text-text">{h.supportingCases}</span>{" "}
                    <T es="casos" en="cases" />
                    <span className="mx-2 text-text/30">·</span>
                    <span className="text-text">{h.evidence.patternCount}</span>{" "}
                    <T es="patrones" en="patterns" />
                  </>
                ) : (
                  <T es={noEvidenceCopy(h.id).es} en={noEvidenceCopy(h.id).en} />
                )}
              </p>

              {/* Calibration audit — collapsed by default, expand for math */}
              <details className="group">
                <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-widest text-muted hover:text-accent">
                  <T es="Cómo se derivó ▾" en="How it was derived ▾" />
                </summary>
                <div className="mt-3">
                  <CalibrationSourceBadge
                    source={h.source}
                    pct={h.effectivePct}
                    prior={h.corpusPct}
                    pressure={h.pressure}
                    supportingCases={h.supportingCases}
                    shift={h.shift}
                  />
                </div>
              </details>

              {/* Detail link */}
              <a
                href={`#${h.id}`}
                className="mt-auto self-end border-t border-text/10 pt-3 font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
              >
                <T es="Razonamiento →" en="Reasoning →" />
              </a>
            </article>
          );
        })}
      </div>

      {framing && (
        <Caption className="max-w-2xl pt-4">
          <T
            es={
              <>
                Cada % = prior del analista + presión de los casos que la
                sostienen, recalibrado en cada build. Método completo en{" "}
                <a className="text-accent hover:underline" href="/about">/about</a>{" "}
                y{" "}
                <a className="text-accent hover:underline" href="/probabilidades">/probabilidades</a>.
              </>
            }
            en={
              <>
                Each % = the analyst&apos;s prior + the pressure of the cases
                that sustain it, recalibrated on every build. Full method at{" "}
                <a className="text-accent hover:underline" href="/about">/about</a>{" "}
                and{" "}
                <a className="text-accent hover:underline" href="/probabilidades">/probabilidades</a>.
              </>
            }
          />
        </Caption>
      )}
    </section>
  );
}

/**
 * CalibrationSourceBadge — shows how the displayed probability was
 * obtained. Three sources, all build-time computed:
 *
 *   - "derived":  effective = sigmoid(logit(prior) + pressure). Default
 *                 for primitive hypotheses. Updates with every case added.
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
