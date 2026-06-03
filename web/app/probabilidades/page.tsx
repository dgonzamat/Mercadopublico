import Link from "next/link";
import { cases, patterns, TOTAL_CASES } from "@/lib/data";
import {
  HYPOTHESES,
  PRIMITIVE_HYPOTHESES,
  ANTECEDENT_HYPOTHESES,
  DERIVED_HYPOTHESES,
} from "@/lib/hypotheses";
import {
  PATTERN_TO_HYPOTHESIS,
  UMBRELLA_SUBCLASSES,
  effectiveCalibration,
} from "@/lib/hypothesisMapping";
import { pctToIcdLabel } from "@/lib/icd203";
import { IcdProbabilityChart } from "@/components/IcdProbabilityChart";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";

export const metadata = {
  title: "Probabilities · UAP Codex",
  description:
    "Detailed reasoning per hypothesis. ICD-203 + corpus evidence sustaining each judgment.",
};

const FEATURED_HYPOTHESIS_ID = "entidades-no-humanas";

export default function ProbabilidadesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-16 py-8">
      {/* ─────────── HERO ─────────── */}
      <header className="space-y-4">
        <Eyebrow>
          <T
            es="La respuesta del corpus, abierta"
            en="The corpus answer, opened up"
          />
        </Eyebrow>
        <H1>
          <T
            es="¿Qué tan probable es cada explicación de los UAP?"
            en="How likely is each explanation of UAP?"
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={
              <>
                Mirando los <strong className="text-text">{STATS.cases} casos</strong>{" "}
                que pasaron filtros militares, gubernamentales o periodísticos
                rigurosos, hay <strong className="text-text">seis cosas plausibles</strong>{" "}
                que estos objetos podrían ser. No compiten entre sí — un mismo
                caso puede ser dos a la vez. Cada una con su nivel de confianza,
                en las mismas palabras que usan los analistas de inteligencia:{" "}
                <em>casi cierto</em>, <em>probable</em>, <em>improbable</em>,{" "}
                <em>casi imposible</em>.
              </>
            }
            en={
              <>
                Looking at the <strong className="text-text">{STATS.cases} UAP cases</strong>{" "}
                that passed strict military, government or journalistic filters,
                there are <strong className="text-text">six plausible things</strong>{" "}
                these objects could be. They don&apos;t compete — a single case
                can be more than one at once. Each gets a confidence level in
                the same words intelligence analysts use:{" "}
                <em>almost certain</em>, <em>likely</em>, <em>unlikely</em>,{" "}
                <em>almost no chance</em>.
              </>
            }
          />
        </Lede>
      </header>

      {/* ─────────── CHART (overview) ─────────── */}
      <IcdProbabilityChart />

      {/* ─────────── POR QUÉ H5 ESTÁ EN "IMPROBABLE" — umbrella math ─────────── */}
      <section className="space-y-6 border-y-4 border-text bg-surface-2 px-6 py-10 md:px-10 md:py-14">
        <Eyebrow>
          <T es="La frontera analítica" en="The analytical frontier" />
        </Eyebrow>
        <H2>
          <T
            es={
              <>
                Por qué <em>algo no humano</em> sigue siendo improbable —{" "}
                pero no descartable
              </>
            }
            en={
              <>
                Why <em>something non-human</em> stays unlikely —{" "}
                but not ruled out
              </>
            }
          />
        </H2>
        <Body>
          <T
            es={
              <>
                <em>&quot;Algo no humano&quot;</em> es una categoría amplia.
                Incluye al menos tres versiones más específicas: realidad{" "}
                <strong className="text-text">interdimensional</strong> (otras
                físicas), fenómeno{" "}
                <strong className="text-text">psicoespiritual</strong>{" "}
                (contacto de conciencia, no de materia), o un{" "}
                <strong className="text-text">tratado encubierto</strong> con
                visitantes — la hipótesis Cooper-Lazar. Cada versión
                específica tiene, por separado, baja probabilidad. Pero la
                categoría general tiene que ser <strong className="text-text">
                al menos tan probable como la más alta de ellas
                </strong> — eso da algo cerca de 28%. Improbable, sí.
                Imposible, no.
              </>
            }
            en={
              <>
                <em>&quot;Something non-human&quot;</em> is a broad category.
                It includes at least three more specific versions:{" "}
                <strong className="text-text">interdimensional</strong>{" "}
                reality (different physics), a{" "}
                <strong className="text-text">psychospiritual</strong>{" "}
                phenomenon (contact of consciousness, not matter), or a{" "}
                <strong className="text-text">covert treaty</strong> with
                visitors — the Cooper-Lazar hypothesis. Each specific
                version is, on its own, low-probability. But the broad
                category has to be <strong className="text-text">
                at least as probable as the highest of them
                </strong> — that lands near 28%. Unlikely, yes. Impossible,
                no.
              </>
            }
          />
        </Body>
        <details className="group border-l-2 border-text/15 pl-5">
          <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-widest text-muted hover:text-accent">
            <T
              es="Por qué exactamente 28%, no 22% ni 50% ↓"
              en="Why exactly 28%, not 22% or 50% ↓"
            />
          </summary>
          <Body className="mt-4 text-sm text-muted">
            <T
              es={
                <>
                  Cota de Fréchet: si las versiones específicas son P(interdim.)
                  = 22%, P(psicoesp.) = 22%, P(tratado) = 6%, la categoría
                  paraguas tiene que estar entre{" "}
                  <strong>22%</strong> (si las versiones se solapan
                  completamente) y <strong>50%</strong> (si son perfectamente
                  disjuntas). El 28% asume solape significativo más un margen
                  pequeño para variantes no nombradas (ET clásico, categorías
                  sin vocabulario establecido). Cae en banda{" "}
                  <strong>Improbable</strong> (20-45%) según ICD-203.
                </>
              }
              en={
                <>
                  Fréchet bound: if the specific versions are P(interdim.) =
                  22%, P(psychospir.) = 22%, P(treaty) = 6%, the umbrella
                  category must lie between <strong>22%</strong> (if versions
                  overlap completely) and <strong>50%</strong> (if perfectly
                  disjoint). The 28% assumes significant overlap plus a small
                  margin for unnamed variants (classical ET, categories
                  without established vocabulary). Falls in the{" "}
                  <strong>Unlikely</strong> band (20-45%) per ICD-203.
                </>
              }
            />
          </Body>
        </details>
        <Body className="text-muted">
          <T
            es={
              <>
                Tomá{" "}
                <Link href="/cases/tehran-1976" className="text-accent hover:underline">
                  Tehran 1976
                </Link>
                : dos cazas iraníes en intercepción nocturna pierden de
                pronto radio y armas frente a un objeto que el radar terrestre
                confirma del tamaño de un avión comercial. La inteligencia
                militar de EE.UU. archivó el reporte con su máxima
                calificación interna. Hay <strong>{STATS.tierS} casos del corpus</strong>{" "}
                con ese nivel de evidencia.
              </>
            }
            en={
              <>
                Take{" "}
                <Link href="/cases/tehran-1976" className="text-accent hover:underline">
                  Tehran 1976
                </Link>
                : two Iranian fighters on night intercept suddenly lose radio
                and weapons facing an object that the ground radar confirms
                is the size of a commercial airliner. U.S. military
                intelligence filed the report with its highest internal
                rating. There are <strong>{STATS.tierS} corpus cases</strong>{" "}
                at that level of evidence.
              </>
            }
          />
        </Body>
        <Body className="text-muted">
          <T
            es={
              <>
                Lo importante: esa noche no se puede saber si lo que
                persiguieron era <strong className="text-text">un dron
                experimental ultra-clasificado</strong> (sabemos que existen
                — el F-117 y el B-2 fueron &quot;UAP&quot; antes de ser
                anunciados públicamente) o{" "}
                <strong className="text-text">algo más raro</strong>. Las dos
                lecturas explican lo que pasó. La hipótesis del programa
                clasificado gana terreno más rápido porque tiene precedente
                material; la del &quot;algo no humano&quot; se mantiene atrás
                porque, hasta hoy, falta el equivalente — material recuperado
                y analizado. Por eso un solo análisis isotópico de los
                fragmentos derribados sobre{" "}
                <Link href="/cases/lake-huron-2023" className="text-accent hover:underline">
                  Lake Huron en febrero 2023
                </Link>
                {" "}podría mover dramáticamente el balance, si esos restos
                alguna vez se examinan.
              </>
            }
            en={
              <>
                Here&apos;s what matters: that night you can&apos;t tell
                whether they were chasing{" "}
                <strong className="text-text">an ultra-classified
                experimental drone</strong> (we know they exist — the F-117
                and B-2 were &quot;UAP&quot; before being publicly announced)
                or <strong className="text-text">something stranger</strong>.
                Both readings explain what happened. The classified-program
                hypothesis gains ground faster because it has material
                precedent; the &quot;something non-human&quot; one stays
                behind because, to this day, it lacks the equivalent —
                recovered, analyzed material. That&apos;s why a single
                isotopic analysis of the fragments shot down over{" "}
                <Link href="/cases/lake-huron-2023" className="text-accent hover:underline">
                  Lake Huron in February 2023
                </Link>
                {" "}could dramatically move the balance, if those remains
                are ever examined.
              </>
            }
          />
        </Body>
        <Link
          href={`#${FEATURED_HYPOTHESIS_ID}`}
          className="inline-flex min-h-[44px] items-center bg-accent px-5 py-2 text-sm font-medium text-bg hover:bg-text"
        >
          <T
            es="Ir a H5 — los detalles ↓"
            en="Jump to H5 — the details ↓"
          />
        </Link>
      </section>

      {/* ─────────── 6 PROPOSICIONES PRIMITIVAS (H5 destacada) ─────────── */}
      <div className="space-y-16">
        {PRIMITIVE_HYPOTHESES.map((h, i) => (
          <HypothesisSection
            key={h.id}
            hypothesisId={h.id}
            index={i + 1}
            total={PRIMITIVE_HYPOTHESES.length}
            featured={h.id === FEATURED_HYPOTHESIS_ID}
          />
        ))}
      </div>

      {/* ─────────── DOS HIPÓTESIS APARTE ─────────── */}
      <section
        id="antecedente-derivada"
        className="scroll-mt-20 space-y-10 border-t-2 border-text pt-12"
      >
        <header className="space-y-3">
          <Eyebrow>
            <T
              es="Antes y después del corpus"
              en="Before and after the corpus"
            />
          </Eyebrow>
          <H2>
            <T
              es="Dos hipótesis aparte"
              en="Two hypotheses set apart"
            />
          </H2>
          <Body className="text-muted">
            <T
              es={`Las seis del cuadro de arriba describen, cada una a su modo, qué podrían ser los ${STATS.cases} casos del corpus. Las dos que siguen son distintas: una habla de un universo de reportes anterior al filtro (los miles que nunca llegan a este corpus), la otra es una conclusión que se desprende de las seis, no una hipótesis aparte. Por eso van con su propia explicación.`}
              en={`The six above each describe, in their own way, what the ${STATS.cases} corpus cases could be. The next two are different: one talks about a prior universe of reports (the thousands that never reach this corpus), the other is a conclusion that follows from the six, not a separate hypothesis. So they get their own explanation.`}
            />
          </Body>
        </header>

        {ANTECEDENT_HYPOTHESES.map((h) => (
          <OffAxisCard
            key={h.id}
            h={h}
            kindLabel={{ es: "Antes del filtro", en: "Before the filter" }}
          />
        ))}
        {DERIVED_HYPOTHESES.map((h) => (
          <OffAxisCard
            key={h.id}
            h={h}
            kindLabel={{ es: "Consecuencia", en: "Consequence" }}
          />
        ))}
      </section>

      {/* ─────────── PUENTE NARRATIVO al experimento ─────────── */}
      <section className="mx-auto max-w-prose space-y-4 pt-4">
        <Body className="text-muted">
          <T
            es={
              <>
                De las seis hipótesis principales, cinco están razonablemente
                decididas. La de <em>algo no humano</em> — más amplia, más
                incómoda — es la única que un solo experimento podría mover
                de manera significativa. Ese experimento existe y está pendiente.
              </>
            }
            en={
              <>
                Five of the six main hypotheses are reasonably settled. The{" "}
                <em>something non-human</em> one — broader, less comfortable —
                is the only one a single experiment could meaningfully move.
                That experiment exists, and it&apos;s pending.
              </>
            }
          />
        </Body>
      </section>

      {/* ─────────── CIERRE — el experimento pendiente (ya no re-resumen) ─────────── */}
      <section className="space-y-6 border-t-2 border-text pt-10">
        <Eyebrow>
          <T es="El experimento pendiente" en="The pending experiment" />
        </Eyebrow>
        <H2>
          <T
            es="Un solo análisis puede cerrar dos décadas de debate"
            en="One analysis can close two decades of debate"
          />
        </H2>
        <Body>
          <T
            es={
              <>
                El 12 de febrero de 2023, un F-16 de la Air National Guard
                derribó un objeto sobre el lago Huron con un misil AIM-9X.
                Los fragmentos cayeron al agua. Aún no fueron analizados
                públicamente.
              </>
            }
            en={
              <>
                On February 12, 2023, an Air National Guard F-16 shot down
                an object over Lake Huron with an AIM-9X missile. The
                fragments fell into the water. They have not yet been
                publicly analyzed.
              </>
            }
          />
        </Body>
        <Body className="text-muted">
          <T
            es={
              <>
                Si esos fragmentos pasan por análisis isotópico y revelan
                ratios inconsistentes con ocurrencia terrestre, H5 se mueve
                hacia <em>probable</em>. Si revelan composición convencional,
                H5 colapsa hacia <em>30%</em>. Un solo experimento. Dos
                décadas de claridad.
              </>
            }
            en={
              <>
                If those fragments undergo isotopic analysis and reveal
                ratios inconsistent with terrestrial occurrence, H5 moves
                toward <em>likely</em>. If they reveal conventional
                composition, H5 collapses toward <em>30%</em>. A single
                experiment. Two decades of clarity.
              </>
            }
          />
        </Body>
      </section>

      {/* ─────────── NAV CIERRE (CTAs específicos) ─────────── */}
      <nav className="grid gap-3 border-y-2 border-text py-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/cases/lake-huron-2023"
          className="inline-flex min-h-[56px] flex-col justify-center bg-accent px-5 py-3 text-sm hover:bg-text"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-bg/70">
            <T es="El experimento pendiente" en="The pending experiment" />
          </span>
          <span className="font-display text-base font-medium text-bg">
            <T
              es="Lake Huron 2023 →"
              en="Lake Huron 2023 →"
            />
          </span>
        </Link>
        <Link
          href="/about"
          className="inline-flex min-h-[56px] flex-col justify-center border-2 border-text px-5 py-3 text-sm hover:bg-text hover:text-bg"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="El método" en="The method" />
          </span>
          <span className="font-display text-base font-medium">
            <T
              es="¿Cómo se calibra cada %?"
              en="How is each % calibrated?"
            />
          </span>
        </Link>
        <Link
          href="/cases"
          className="inline-flex min-h-[56px] flex-col justify-center border-2 border-text px-5 py-3 text-sm hover:bg-text hover:text-bg"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="La evidencia" en="The evidence" />
          </span>
          <span className="font-display text-base font-medium">
            <T
              es={`Ver los ${STATS.cases} casos →`}
              en={`See the ${STATS.cases} cases →`}
            />
          </span>
        </Link>
      </nav>

      {/* ─────────── NOTA METODOLÓGICA (callout NO/SÍ movido al final) ─────────── */}
      <details className="group border-t border-border pt-6">
        <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-widest text-muted hover:text-accent">
          <T
            es="Nota metodológica · qué es esto y qué NO es →"
            en="Methodological note · what this is and what it is NOT →"
          />
        </summary>
        <div className="mt-6 grid gap-6 rounded-lg border border-border bg-surface-2 p-6 md:grid-cols-2 md:p-8">
          <div className="space-y-3">
            <Eyebrow>
              <T es="Lo que NO es" en="What it is NOT" />
            </Eyebrow>
            <ul className="space-y-2 text-sm text-text">
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>No es inferencia Bayesiana formal.</strong> No
                      tenemos P(evidencia | hipótesis) calculadas.
                    </>
                  }
                  en={
                    <>
                      <strong>It is not formal Bayesian inference.</strong> We
                      don&apos;t have P(evidence | hypothesis) calculated.
                    </>
                  }
                />
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>No es &quot;posición del usuario&quot;.</strong>{" "}
                      No se ajustan priors; son juicios del análisis del
                      corpus.
                    </>
                  }
                  en={
                    <>
                      <strong>It is not &quot;user position&quot;.</strong> No
                      priors are adjusted; they are judgments from the corpus
                      analysis.
                    </>
                  }
                />
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>No son decimales precisos.</strong> Decir
                      &quot;48%&quot; implica diferenciación que la evidencia
                      no soporta. ICD-203 usa palabras por eso.
                    </>
                  }
                  en={
                    <>
                      <strong>They are not precise decimals.</strong> Saying
                      &quot;48%&quot; implies differentiation the evidence
                      doesn&apos;t support. ICD-203 uses words for this
                      reason.
                    </>
                  }
                />
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <Eyebrow>
              <T es="Lo que SÍ es" en="What it IS" />
            </Eyebrow>
            <ul className="space-y-2 text-sm text-text">
              <li>
                <span className="text-accent">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>Juicio analítico estructurado</strong> sobre{" "}
                      {TOTAL_CASES} casos institucionales (1947–2026).
                    </>
                  }
                  en={
                    <>
                      <strong>Structured analytical judgment</strong> over{" "}
                      {TOTAL_CASES} institutional cases (1947–2026).
                    </>
                  }
                />
              </li>
              <li>
                <span className="text-accent">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>Calibrado vía ICD-203</strong>, el mismo estándar
                      que usan analistas IC para reportes a tomadores de
                      decisión.
                    </>
                  }
                  en={
                    <>
                      <strong>Calibrated via ICD-203</strong>, the same
                      standard IC analysts use for reports to decision-makers.
                    </>
                  }
                />
              </li>
              <li>
                <span className="text-accent">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>Auditable:</strong> cada hipótesis lista los
                      casos del corpus que la sostienen.
                    </>
                  }
                  en={
                    <>
                      <strong>Auditable:</strong> each hypothesis lists the
                      corpus cases that sustain it.
                    </>
                  }
                />
              </li>
            </ul>
          </div>
        </div>
      </details>
    </article>
  );
}

/**
 * HypothesisSection — drill detallado por hipótesis.
 *
 * Cambios respecto a la versión anterior:
 * - Acepta index/total para counter "Hipótesis 3 de 8"
 * - Acepta featured para destacar H5 (la frontera analítica)
 * - Elimina caption duplicada del rango ICD-203 (ya visible en chart arriba)
 * - El chart arriba ya muestra label + ICD label + bar + note + counts;
 *   la section profundiza con patrones + casos + CTA o expansion.
 */
function HypothesisSection({
  hypothesisId,
  index,
  total,
  featured = false,
}: {
  hypothesisId: string;
  index: number;
  total: number;
  featured?: boolean;
}) {
  const h = HYPOTHESES.find((x) => x.id === hypothesisId);
  if (!h) return null;

  const calib = effectiveCalibration(h, cases);
  const effectiveIcd = pctToIcdLabel(calib.pct);

  const supportingCases = cases.filter((c) =>
    c.patterns.some((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId),
  );
  const associatedPatterns = patterns.filter(
    (p) => PATTERN_TO_HYPOTHESIS[p.id] === hypothesisId,
  );

  // Header común: counter + title + ICD badge.
  // Renderado como summary clickeable cuando NOT featured (accordion).
  const headerInner = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es={`Hipótesis ${index} de ${total}`}
            en={`Hypothesis ${index} of ${total}`}
          />
          {featured && (
            <>
              {" · "}
              <span className="text-accent">
                <T
                  es="La que más se discute"
                  en="The one most debated"
                />
              </span>
            </>
          )}
          {!featured && (
            <span
              aria-hidden
              className="ml-2 inline-block text-accent transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          )}
        </p>
        <H2 id={`${h.id}-title`}>
          <T es={h.label} en={h.labelEn} />
        </H2>
      </div>
      <span
        className="shrink-0 rounded-md border px-3 py-1 font-mono text-xs uppercase tracking-wider"
        style={{
          borderColor: `${h.color}66`,
          color: h.color,
          backgroundColor: `${h.color}11`,
        }}
      >
        <T es={effectiveIcd.labelEs} en={effectiveIcd.label} />{" "}
        <span className="opacity-70">
          ({calib.pct.toFixed(0)}%)
        </span>
      </span>
    </div>
  );

  // El detalle profundo (patrones + casos + CTA o expansion).
  const detail = (
    <div className="mt-4 space-y-4">
      {associatedPatterns.length > 0 && (
        <div className="space-y-2 pt-2">
          <Eyebrow>
            <T
              es={`Patrones asociados (${associatedPatterns.length})`}
              en={`Associated patterns (${associatedPatterns.length})`}
            />
          </Eyebrow>
          <div className="flex flex-wrap gap-2">
            {associatedPatterns.map((p) => (
              <Link
                key={p.id}
                href={`/patterns/${p.letter}`}
                className="inline-flex min-h-[44px] items-center rounded border border-border bg-panel px-3 py-1 text-xs hover:border-accent/50"
                style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
                title={p.description}
              >
                <span className="font-mono text-accent">{p.id}</span>{" "}
                <span className="ml-2 text-text">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {supportingCases.length > 0 && (
        <div className="space-y-2 pt-2">
          <Eyebrow>
            <T
              es={`Casos que la sostienen (${supportingCases.length})`}
              en={`Cases that sustain it (${supportingCases.length})`}
            />
          </Eyebrow>
          <div className="grid gap-2 sm:grid-cols-2">
            {supportingCases.slice(0, 12).map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="inline-flex min-h-[44px] items-center rounded px-2 py-1 text-xs text-text hover:bg-panel"
              >
                <span aria-hidden className="mr-2">
                  {c.flag}
                </span>
                <span className="sr-only">{c.country_name}.</span>
                <span className="truncate">{c.name}</span>
                <span className="ml-2 shrink-0 font-mono text-muted">
                  · {c.year_start}
                </span>
              </Link>
            ))}
          </div>
          {supportingCases.length > 12 && (
            <Caption>
              <T
                es={`+ ${supportingCases.length - 12} casos más asociados a esta hipótesis`}
                en={`+ ${supportingCases.length - 12} more cases associated with this hypothesis`}
              />
            </Caption>
          )}
        </div>
      )}

      {associatedPatterns.length === 0 &&
        supportingCases.length === 0 &&
        renderNoEvidenceExpansion(h.id)}

      {supportingCases.length > 0 && (
        <Link
          href={`/cases/${supportingCases[0].id}`}
          className="group mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-4 border-2 border-text px-5 py-4 hover:bg-text hover:text-bg"
        >
          <span
            aria-hidden
            className="font-mono text-xs uppercase tracking-widest text-muted group-hover:text-bg/60"
          >
            <T es="Empezar por" en="Start with" />
          </span>
          <span className="min-w-0">
            <span aria-hidden className="mr-2">
              {supportingCases[0].flag}
            </span>
            <span className="sr-only">{supportingCases[0].country_name}.</span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg md:text-xl">
              {supportingCases[0].name}
            </span>
            <span className="ml-2 font-mono text-xs tabular-nums text-muted group-hover:text-bg/60">
              {supportingCases[0].year_start} · {supportingCases[0].tier}
            </span>
          </span>
          <span
            aria-hidden
            className="font-mono text-base text-accent group-hover:text-accent"
          >
            →
          </span>
        </Link>
      )}
    </div>
  );

  // Render condicional:
  // - featured (H5): full expanded, sin accordion — esta es la hipótesis core
  // - not featured: <details> accordion cerrado por default. Header visible
  //   (counter + label + ICD badge); contenido expande al click.
  if (featured) {
    return (
      <section
        id={h.id}
        aria-labelledby={`${h.id}-title`}
        className="scroll-mt-20 border-l-4 border-accent bg-surface-2 px-6 py-8 md:px-8"
      >
        {headerInner}
        {detail}
      </section>
    );
  }

  return (
    <details
      id={h.id}
      className="scroll-mt-20 border-b border-text/15 pb-4 group"
    >
      <summary className="cursor-pointer list-none hover:opacity-80">
        {headerInner}
      </summary>
      {detail}
    </details>
  );
}

/**
 * Editorial expansion for hypotheses that legitimately have zero
 * pattern + zero supporting case matches.
 */
function renderNoEvidenceExpansion(id: string) {
  switch (id) {
    case "misidentificacion":
      return (
        <div className="space-y-4 border-l-2 border-text/15 pl-5 pt-2">
          <Body>
            <T
              es="Esta probabilidad NO se calcula sobre los 52 casos del corpus — esos ya sobrevivieron filtros institucionales (militar, congresional, periodístico). Aplica al universo previo: el conjunto general de reportes UAP enviados a Project Blue Book, AARO, y agencias similares, donde aproximadamente el 95% se resuelven como globos meteorológicos, satélites, aves, lens flares, pareidolia."
              en="This probability is NOT computed over the 52 corpus cases — those already survived institutional filters (military, congressional, journalistic). It applies to the prior universe: the general set of UAP reports sent to Project Blue Book, AARO, and similar agencies, where approximately 95% resolve as weather balloons, satellites, birds, lens flares, pareidolia."
            />
          </Body>
          <Body className="text-muted">
            <T
              es="La utilidad del corpus es justamente filtrar este 95%. Reconocer que la mayoría son misidentificaciones es lo que vuelve interesantes a los casos que no lo son."
              en="The corpus's value is precisely filtering out this 95%. Acknowledging that most are misidentifications is what makes the remaining cases interesting."
            />
          </Body>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/about"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Cómo se filtra el corpus →"
                en="How the corpus is filtered →"
              />
            </Link>
          </div>
        </div>
      );

    case "entidades-no-humanas":
      return (
        <div className="space-y-4 border-l-2 border-accent/40 pl-5 pt-2">
          <Body>
            <T
              es="Esta es la categoría paraguas. Su 45% se compone matemáticamente de la unión de proposiciones más específicas: interdimensional (22%), psicoespiritual (22%), tratado formal (6%), + categorías que aún no tenemos vocabulario para nombrar. P(unión) ≥ P(cualquier subclase), por eso el paraguas es mayor que cualquier specific bet."
              en="This is the umbrella category. Its 45% composes mathematically from the union of more specific propositions: interdimensional (22%), psychospiritual (22%), formal treaty (6%), + categories we don't yet have vocabulary for. P(union) ≥ P(any subclass), which is why the umbrella exceeds any specific bet."
            />
          </Body>
          <Body className="text-muted">
            <T
              es="La frontera analítica real vive acá. Casos militares con sensor (Tehran, Nimitz) son evidencia fuerte de algo, pero NO discriminan entre 'tecnología clasificada' y 'algo no humano' — ambas interpretaciones son consistentes con los datos. Esa indecidibilidad es la que mantiene la probabilidad en banda pareja."
              en="The real analytical frontier lives here. Military sensor cases (Tehran, Nimitz) are strong evidence of something, but do NOT discriminate between 'classified tech' and 'something non-human' — both interpretations are consistent with the data. That undecidability is what keeps the probability in the even band."
            />
          </Body>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="#interdimensional"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Subclase: interdimensional ↓"
                en="Subclass: interdimensional ↓"
              />
            </Link>
            <Link
              href="#psicoespiritual"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Subclase: psicoespiritual ↓"
                en="Subclass: psychospiritual ↓"
              />
            </Link>
            <Link
              href="#tratado-greys"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Subclase: tratado ↓"
                en="Subclass: treaty ↓"
              />
            </Link>
          </div>
        </div>
      );

    case "psicoespiritual":
      return (
        <div className="space-y-4 border-l-2 border-text/15 pl-5 pt-2">
          <Body>
            <T
              es="No hay patrones estructurales aislables en el corpus — la evidencia de esta hipótesis es testimonial (Mack, Strieber) o etnográfica-ontológica (Pasulka). Eso no la invalida, pero significa que la calibración debe basarse en literatura externa, no en el conteo de casos institucionales."
              en="No isolable structural patterns in the corpus — evidence for this hypothesis is testimonial (Mack, Strieber) or ethnographic-ontological (Pasulka). That doesn't invalidate it, but means calibration must rely on external literature, not on institutional case counts."
            />
          </Body>
          <Body className="text-muted">
            <T
              es="El 22% refleja: hay evidencia testimonial extensa y bien documentada (Harvard Med, novelas multi-décadas, Oxford UP), pero su naturaleza fenomenológica la hace difícil de auditar con métodos materialistas estándar."
              en="The 22% reflects: there is extensive, well-documented testimonial evidence (Harvard Med, multi-decade novels, Oxford UP), but its phenomenological nature makes it hard to audit with standard materialist methods."
            />
          </Body>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/researchers/mack"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T es="John Mack →" en="John Mack →" />
            </Link>
            <Link
              href="/researchers/strieber"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T es="Whitley Strieber →" en="Whitley Strieber →" />
            </Link>
            <Link
              href="/researchers/pasulka"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T es="Diana Pasulka →" en="Diana Pasulka →" />
            </Link>
          </div>
        </div>
      );

    case "tratado-greys":
      return (
        <div className="space-y-4 border-l-2 border-text/15 pl-5 pt-2">
          <Body>
            <T
              es="Es una claim histórica específica: William Cooper afirmó en los 80s que existió un tratado formal Eisenhower-Greys 1954. Bob Lazar afirmó haber trabajado con tecnología recuperada en S-4 (Area 51). Ninguna afirmación tiene evidencia primaria verificable — ni documentos, ni testigos corroborantes, ni materiales."
              en="It is a specific historical claim: William Cooper claimed in the 80s that a formal Eisenhower-Greys treaty existed in 1954. Bob Lazar claimed to have worked with recovered technology at S-4 (Area 51). Neither claim has verifiable primary evidence — no documents, no corroborating witnesses, no materials."
            />
          </Body>
          <Body className="text-muted">
            <T
              es="El 6% refleja: la claim circula 40+ años en cultura UAP, pero el corpus institucional no la sostiene. Aún así no está en 0% porque el cover-up institucional documentado (Twining → Bolender → PURSUE) deja espacio epistémico para sorpresas."
              en="The 6% reflects: the claim has circulated 40+ years in UAP culture, but the institutional corpus does not sustain it. Still not at 0% because the documented institutional cover-up (Twining → Bolender → PURSUE) leaves epistemic room for surprises."
            />
          </Body>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/frameworks"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Ver framework Treaty (Cooper) →"
                en="See Treaty framework (Cooper) →"
              />
            </Link>
          </div>
        </div>
      );

    default:
      return (
        <Caption className="italic">
          <T
            es="Sin patrones ni casos directos en el corpus actual — la calibración deriva de literatura externa."
            en="No direct patterns or cases in the current corpus — calibration derives from external literature."
          />
        </Caption>
      );
  }
}

/**
 * Off-axis hypothesis card — for antecedent (universe pre-filtro) and
 * derived (consecuencia lógica) hypotheses that should NOT share the
 * primitive ICD-203 axis.
 */
function OffAxisCard({
  h,
  kindLabel,
}: {
  h: (typeof HYPOTHESES)[number];
  kindLabel: { es: string; en: string };
}) {
  return (
    <article
      id={h.id}
      aria-labelledby={`${h.id}-offaxis-title`}
      className="scroll-mt-20 space-y-4 border-l-4 pl-6"
      style={{ borderColor: h.color }}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es={kindLabel.es} en={kindLabel.en} />
        {" · "}
        <T es={h.icd.labelEs} en={h.icd.label} />
        {" · "}
        {Math.round(h.icd.min)}–{Math.round(h.icd.max)}%
      </p>
      <H2 id={`${h.id}-offaxis-title`} className="text-2xl md:text-3xl">
        <T es={h.label} en={h.labelEn} />
      </H2>
      <Body className="text-muted">
        <T es={h.note} en={h.noteEn} />
      </Body>
    </article>
  );
}
