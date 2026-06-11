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
  effectiveCalibration,
} from "@/lib/hypothesisMapping";
import { pctToIcdLabel } from "@/lib/icd203";
import { IcdProbabilityChart } from "@/components/IcdProbabilityChart";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";

export const metadata = {
  title: "Probabilities",
  description:
    "Detailed reasoning per hypothesis. ICD-203 + corpus evidence sustaining each judgment.",

  alternates: { canonical: "/probabilidades/" },
};

const FEATURED_HYPOTHESIS_ID = "entidades-no-humanas";

/**
 * Visual conventions for this page (apply consistently when editing):
 *
 * BORDERS — section separators:
 *   border-t-2 border-text         major section break (top)
 *   border-l-4 border-accent       featured hypothesis card (H5)
 *   border-l-4 + style h.color     off-axis hypothesis (antecedent/derived)
 *   border-b   border-text/15      collapsed accordion separator
 *   border-l-2 border-text/15      content inset (expansion paragraphs)
 *   border-l-2 border-accent/40    content inset INSIDE the featured card
 *
 * CTAs — touch targets:
 *   min-h-[56px]                   primary nav CTA (hero-level, one per group)
 *   min-h-[44px]                   all other links and badges (a11y minimum)
 *
 * CTAs — variants by semantic role:
 *   bg-accent + hover:bg-text                    primary filled (the ONE
 *                                                main action in a section)
 *   border-2 border-text +                       outline secondary
 *     hover:bg-text hover:text-bg                (most "→" CTAs)
 *   border + border-l-color +                    categorical tag/badge
 *     hover:border-accent/50                     (patterns, taxonomies)
 *   hover:bg-panel                               in-list internal link
 *                                                (case listings)
 *
 * Text sizes follow target size:
 *   56px CTA  → text-base label + text-[11px] kicker
 *   44px CTA  → text-sm
 *   44px tag  → text-xs (compact, multi-row)
 *
 * COPY NUMERIC DISCIPLINE: see lib/hypotheses.ts JSDoc (prior vs
 * effective; tag every cited percentage with "prior" or move the cite
 * into a scope where `calib.pct` is available).
 */

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
                rigurosos, hay <strong className="text-text">ocho proposiciones plausibles</strong>{" "}
                sobre qué son estos objetos. No compiten entre sí — un mismo
                caso puede ser dos a la vez. Cada una con su nivel de confianza,
                en las mismas palabras que usan los analistas de inteligencia
                (
                <a
                  href="https://irp.fas.org/dni/icd/icd-203.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                ):{" "}
                <em>casi cierto</em>, <em>probable</em>, <em>improbable</em>,{" "}
                <em>casi imposible</em>.
              </>
            }
            en={
              <>
                Looking at the <strong className="text-text">{STATS.cases} UAP cases</strong>{" "}
                that passed strict military, government or journalistic filters,
                there are <strong className="text-text">eight plausible propositions</strong>{" "}
                about what these objects are. They don&apos;t compete — a single case
                can be more than one at once. Each gets a confidence level in
                the same words intelligence analysts use
                (
                <a
                  href="https://irp.fas.org/dni/icd/icd-203.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                ):{" "}
                <em>almost certain</em>, <em>likely</em>, <em>unlikely</em>,{" "}
                <em>almost no chance</em>.
              </>
            }
          />
        </Lede>
      </header>

      <IcdProbabilityChart framing={false} />

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

      <section
        id="antecedente-derivada"
        className="scroll-mt-20 space-y-10 border-t-2 border-text pt-12"
      >
        <header className="space-y-3">
          <Eyebrow>
            <T es="Antes y después del corpus" en="Before and after the corpus" />
          </Eyebrow>
          <H2>
            <T es="Dos hipótesis aparte" en="Two hypotheses set apart" />
          </H2>
          <Body className="text-muted">
            <T
              es={`Las ocho del cuadro de arriba son proposiciones, cada una a su modo, sobre los ${STATS.cases} casos del corpus. Las dos que siguen son distintas: una habla de un universo de reportes anterior al filtro (los miles que nunca llegan a este corpus), la otra es una conclusión que se desprende de las ocho, no una hipótesis aparte. Por eso van con su propia explicación.`}
              en={`The eight above are each, in their own way, propositions about the ${STATS.cases} corpus cases. The next two are different: one talks about a prior universe of reports (the thousands that never reach this corpus), the other is a conclusion that follows from the eight, not a separate hypothesis. So they get their own explanation.`}
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

      <nav className="grid gap-3 border-t-2 border-text pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/cases/lake-huron-2023"
          className="inline-flex min-h-[56px] flex-col justify-center bg-accent px-5 py-3 text-sm hover:bg-text"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-bg/70">
            <T es="El experimento pendiente" en="The pending experiment" />
          </span>
          <span className="font-display text-base font-medium text-bg">
            <T es="Lake Huron 2023 →" en="Lake Huron 2023 →" />
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
            <T es="¿Cómo se calibra cada %?" en="How is each % calibrated?" />
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
            <T es={`Ver los ${STATS.cases} casos →`} en={`See the ${STATS.cases} cases →`} />
          </span>
        </Link>
      </nav>

      <details className="group border-t-2 border-text pt-6">
        <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-widest text-muted hover:text-accent">
          <T
            es="Nota metodológica · qué es esto y qué NO es →"
            en="Methodological note · what this is and what it is NOT →"
          />
        </summary>
        <div className="mt-6 grid gap-6 rounded-lg border border-border bg-surface-2 p-6 md:grid-cols-2 md:p-8">
          <div className="space-y-3">
            <Eyebrow><T es="Lo que NO es" en="What it is NOT" /></Eyebrow>
            <ul className="space-y-2 text-sm text-text">
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={<><strong>No es inferencia Bayesiana formal.</strong> No tenemos P(evidencia | hipótesis) calculadas.</>}
                  en={<><strong>It is not formal Bayesian inference.</strong> We don&apos;t have P(evidence | hypothesis) calculated.</>}
                />
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={<><strong>No es &quot;posición del usuario&quot;.</strong> No se ajustan priors; son juicios del análisis del corpus.</>}
                  en={<><strong>It is not &quot;user position&quot;.</strong> No priors are adjusted; they are judgments from the corpus analysis.</>}
                />
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={<><strong>No son decimales precisos.</strong> Decir &quot;48%&quot; implica diferenciación que la evidencia no soporta. ICD-203 usa palabras por eso.</>}
                  en={<><strong>They are not precise decimals.</strong> Saying &quot;48%&quot; implies differentiation the evidence doesn&apos;t support. ICD-203 uses words for this reason.</>}
                />
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <Eyebrow><T es="Lo que SÍ es" en="What it IS" /></Eyebrow>
            <ul className="space-y-2 text-sm text-text">
              <li>
                <span className="text-accent">·</span>{" "}
                <T
                  es={<><strong>Juicio analítico estructurado</strong> sobre {TOTAL_CASES} casos institucionales (1947–2026).</>}
                  en={<><strong>Structured analytical judgment</strong> over {TOTAL_CASES} institutional cases (1947–2026).</>}
                />
              </li>
              <li>
                <span className="text-accent">·</span>{" "}
                <T
                  es={<><strong>Calibrado vía ICD-203</strong>, el mismo estándar que usan analistas IC para reportes a tomadores de decisión.</>}
                  en={<><strong>Calibrated via ICD-203</strong>, the same standard IC analysts use for reports to decision-makers.</>}
                />
              </li>
              <li>
                <span className="text-accent">·</span>{" "}
                <T
                  es={<><strong>Auditable:</strong> cada hipótesis lista los casos del corpus que la sostienen.</>}
                  en={<><strong>Auditable:</strong> each hypothesis lists the corpus cases that sustain it.</>}
                />
              </li>
            </ul>
          </div>
        </div>
      </details>
    </article>
  );
}

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

  const supportingCases = cases.filter(
    (c) =>
      c.patterns.some((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId) ||
      c.evidenceContribution?.some(
        (e) => e.hypothesisId === hypothesisId && e.direction === "supports",
      ),
  );
  const associatedPatterns = patterns.filter(
    (p) => PATTERN_TO_HYPOTHESIS[p.id] === hypothesisId,
  );

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
                <T es="La que más se discute" en="The one most debated" />
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
        <span className="opacity-70">({calib.pct.toFixed(0)}%)</span>
      </span>
    </div>
  );

  const detail = (
    <div className="mt-4 space-y-4">
      {h.prose && (
        <Body className="text-text/90">
          <T es={h.prose} en={h.proseEn ?? h.prose} />
        </Body>
      )}

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
                <span aria-hidden className="mr-2">{c.flag}</span>
                <span className="sr-only">{c.country_name}.</span>
                <span className="truncate">{c.name}</span>
                <span className="ml-2 shrink-0 font-mono text-muted">· {c.year_start}</span>
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
        renderNoEvidenceExpansion(h.id, calib.pct)}

      {supportingCases.length > 0 && (
        <Link
          href={`/cases/${supportingCases[0].id}`}
          className="group mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-4 border-2 border-text px-5 py-4 hover:bg-text hover:text-bg"
        >
          <span aria-hidden className="font-mono text-xs uppercase tracking-widest text-muted group-hover:text-bg/60">
            <T es="Empezar por" en="Start with" />
          </span>
          <span className="min-w-0">
            <span aria-hidden className="mr-2">{supportingCases[0].flag}</span>
            <span className="sr-only">{supportingCases[0].country_name}.</span>
            <span className="font-display text-lg font-medium leading-tight text-text group-hover:text-bg md:text-xl">
              {supportingCases[0].name}
            </span>
            <span className="ml-2 font-mono text-xs tabular-nums text-muted group-hover:text-bg/60">
              {supportingCases[0].year_start} · {supportingCases[0].tier}
            </span>
          </span>
          <span aria-hidden className="font-mono text-base text-accent group-hover:text-accent">→</span>
        </Link>
      )}
    </div>
  );

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

function renderNoEvidenceExpansion(id: string, effectivePct: number) {
  switch (id) {
    case "misidentificacion":
      return (
        <div className="space-y-4 border-l-2 border-text/15 pl-5 pt-2">
          <Body>
            <T
              es={`Esta probabilidad NO se calcula sobre los ${STATS.cases} casos del corpus — esos ya sobrevivieron filtros institucionales (militar, congresional, periodístico). Aplica al universo previo: el conjunto general de reportes UAP enviados a Project Blue Book, AARO, y agencias similares, donde aproximadamente el 97% se resuelven como globos meteorológicos, satélites, aves, lens flares, pareidolia.`}
              en={`This probability is NOT computed over the ${STATS.cases} corpus cases — those already survived institutional filters (military, congressional, journalistic). It applies to the prior universe: the general set of UAP reports sent to Project Blue Book, AARO, and similar agencies, where approximately 97% resolve as weather balloons, satellites, birds, lens flares, pareidolia.`}
            />
          </Body>
          <Body className="text-muted">
            <T
              es="La utilidad del corpus es justamente filtrar este 97%. Reconocer que la mayoría son misidentificaciones es lo que vuelve interesantes a los casos que no lo son."
              en="The corpus's value is precisely filtering out this 97%. Acknowledging that most are misidentifications is what makes the remaining cases interesting."
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
              es={
                <>
                  <strong className="text-text">Cómo se deriva el prior de 28%.</strong>{" "}
                  Por cota de Fréchet, el paraguas tiene que ser al menos tan alto como la subclase de mayor prior — con interdimensional (prior 22%), ontológico no materialista (prior 22%) y tratado formal (prior 6%), más variantes sin vocabulario establecido, el prior queda en 28% asumiendo solape significativo entre subclases.{" "}
                  <strong className="text-text">El chart muestra {effectivePct.toFixed(0)}%</strong>{" "}
                  porque los casos militares con sensor (Tehran, Nimitz) son evidencia fuerte de <em>algo</em>, pero NO discriminan entre tecnología clasificada y entidades no humanas — esa indecidibilidad presiona el prior hacia arriba sin resolverse en ninguna dirección.
                </>
              }
              en={
                <>
                  <strong className="text-text">How the 28% prior is derived.</strong>{" "}
                  By the Fréchet bound, the umbrella must be at least as high as the highest-prior subclass — with interdimensional (prior 22%), non-materialist ontological (prior 22%) and formal treaty (prior 6%), plus variants without established vocabulary, the prior settles at 28% assuming significant overlap between subclasses.{" "}
                  <strong className="text-text">The chart shows {effectivePct.toFixed(0)}%</strong>{" "}
                  because military sensor cases (Tehran, Nimitz) are strong evidence of <em>something</em>, but do NOT discriminate between classified tech and non-human entities — that undecidability pushes the prior upward without resolving in either direction.
                </>
              }
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
              href="#ontologico-no-materialista"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Subclase: ontológico no materialista ↓"
                en="Subclass: non-materialist ontological ↓"
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

    case "ontologico-no-materialista":
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
              es="Su prior de 22% refleja: hay evidencia testimonial extensa y bien documentada (Harvard Med, novelas multi-décadas, Oxford UP), pero su naturaleza fenomenológica la hace difícil de auditar con métodos materialistas estándar."
              en="Its 22% prior reflects: there is extensive, well-documented testimonial evidence (Harvard Med, multi-decade novels, Oxford UP), but its phenomenological nature makes it hard to audit with standard materialist methods."
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
              es="Su prior de 6% refleja: la claim circula 40+ años en cultura UAP, pero el corpus institucional no la sostiene. Aún así no está en 0% porque el cover-up institucional documentado (Twining → Bolender → PURSUE) deja espacio epistémico para sorpresas."
              en="Its 6% prior reflects: the claim has circulated 40+ years in UAP culture, but the institutional corpus does not sustain it. Still not at 0% because the documented institutional cover-up (Twining → Bolender → PURSUE) leaves epistemic room for surprises."
            />
          </Body>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/frameworks"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Ver marco Treaty (Cooper) →"
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
        <T
          es={h.prose ?? h.note}
          en={h.proseEn ?? h.noteEn}
        />
      </Body>
    </article>
  );
}
