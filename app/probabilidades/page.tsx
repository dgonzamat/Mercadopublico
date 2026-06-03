import Link from "next/link";
import { cases, patterns, TOTAL_CASES } from "@/lib/data";
import { HYPOTHESES } from "@/lib/hypotheses";
import { PATTERN_TO_HYPOTHESIS } from "@/lib/hypothesisMapping";
import { IcdProbabilityChart } from "@/components/IcdProbabilityChart";
import { T } from "@/components/T";
import { Eyebrow, H1, H2, Lede, Body, Caption } from "@/lib/typography";

export const metadata = {
  title: "Probabilities · UAP Atlas",
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
                Hay 8 explicaciones posibles. Siete son fáciles de evaluar —
                casi seguro que sí, o casi seguro que no. Una sola se queda{" "}
                <strong className="text-text">atascada en el medio</strong>:
                tan probable como improbable. Ahí es donde realmente vive el
                debate. Calibradas con{" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                , el estándar que usan los analistas de inteligencia.
              </>
            }
            en={
              <>
                There are 8 possible explanations. Seven are easy to evaluate
                — almost certain yes, or almost certain no. Only one stays{" "}
                <strong className="text-text">stuck in the middle</strong>:
                as likely as it is unlikely. That&apos;s where the real
                debate lives. Calibrated with{" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                , the standard intelligence analysts use.
              </>
            }
          />
        </Lede>
      </header>

      {/* ─────────── CHART (overview) ─────────── */}
      <IcdProbabilityChart />

      {/* ─────────── POR QUÉ se traba — caso ancla + 3 razones ─────────── */}
      <section className="space-y-6 border-y-4 border-text bg-surface-2 px-6 py-10 md:px-10 md:py-14">
        <Eyebrow>
          <T es="Por qué se traba" en="Why it gets stuck" />
        </Eyebrow>
        <H2>
          <T
            es="¿Por qué H5 se queda 50-50?"
            en="Why does H5 stay 50-50?"
          />
        </H2>
        <Body>
          <T
            es={
              <>
                En septiembre de 1976, dos F-4 Phantom de la fuerza aérea
                iraní perdieron sus comunicaciones y armamento al acercarse
                a un objeto que el radar terrestre confirmó del tamaño de un
                Boeing 707. La DIA estadounidense lo calificó como{" "}
                <em>&quot;outstanding report&quot;</em> — la máxima nota
                interna del formulario. Eso es{" "}
                <Link href="/cases/tehran-1976" className="text-accent hover:underline">
                  Tehran 1976
                </Link>
                . Hay 28 casos Tier S del mismo nivel de solidez.
              </>
            }
            en={
              <>
                In September 1976, two Iranian Air Force F-4 Phantoms lost
                their communications and weapons systems as they approached
                an object that ground radar confirmed was the size of a
                Boeing 707. The U.S. DIA rated the report{" "}
                <em>&quot;outstanding&quot;</em> — the highest internal
                grade. That is{" "}
                <Link href="/cases/tehran-1976" className="text-accent hover:underline">
                  Tehran 1976
                </Link>
                . There are 28 Tier S cases at that level of solidity.
              </>
            }
          />
        </Body>
        <Body className="text-muted">
          <T
            es={
              <>
                Y sin embargo, ningún caso puede decidir entre dos lecturas
                igualmente consistentes con los datos: <strong>tecnología
                clasificada terrestre</strong> (sabemos que existe — el U-2,
                el F-117 y el B-2 fueron UAP antes de ser desclasificados) o{" "}
                <strong>algo no humano</strong>. Mientras no haya un método
                nuevo de medición — material recuperado, análisis isotópico,
                espectrometría — cada caso adicional refuerza el mismo
                dilema sin resolverlo. Por eso H5 se queda 50-50.
              </>
            }
            en={
              <>
                And yet no case can decide between two readings equally
                consistent with the data: <strong>classified terrestrial
                technology</strong> (we know it exists — the U-2, F-117 and
                B-2 were all UAP before being declassified) or{" "}
                <strong>something non-human</strong>. Until there is a new
                measurement method — recovered material, isotopic analysis,
                spectrometry — each additional case reinforces the same
                dilemma without resolving it. That&apos;s why H5 stays
                50-50.
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

      {/* ─────────── 8 HIPÓTESIS (H5 destacada) ─────────── */}
      <div className="space-y-16">
        {HYPOTHESES.map((h, i) => (
          <HypothesisSection
            key={h.id}
            hypothesisId={h.id}
            index={i + 1}
            total={HYPOTHESES.length}
            featured={h.id === FEATURED_HYPOTHESIS_ID}
          />
        ))}
      </div>

      {/* ─────────── PUENTE NARRATIVO al experimento ─────────── */}
      <section className="mx-auto max-w-prose space-y-4 pt-4">
        <Body className="text-muted">
          <T
            es={
              <>
                Recorriste las ocho. Siete ya están resueltas. H5 sigue
                atascada — y existe un experimento que podría desempatarla.
              </>
            }
            en={
              <>
                You walked through all eight. Seven are already resolved.
                H5 remains stuck — and there is one experiment that could
                break the tie.
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
              es="Ver los 52 casos →"
              en="See the 52 cases →"
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
                  es="AQUÍ ESTÁ LA DUDA REAL"
                  en="WHERE THE REAL DOUBT IS"
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
        <T es={h.icd.labelEs} en={h.icd.label} />
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
