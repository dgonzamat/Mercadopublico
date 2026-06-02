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

export default function ProbabilidadesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-16 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T
            es="La respuesta del corpus, abierta"
            en="The corpus answer, opened up"
          />
        </Eyebrow>
        <H1>
          <T
            es="8 hipótesis. Una sola que importa de verdad."
            en="8 hypotheses. Only one that actually matters."
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={
              <>
                Hay 8 explicaciones posibles para lo que pasa en el cielo.
                Siete son fáciles de calibrar — o casi ciertas, o casi
                imposibles. Una es donde está la <strong className="text-text">frontera analítica
                real</strong>, y la mayoría del debate público gira alrededor de ella
                sin saberlo. Calibradas vía{" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                , el estándar de la comunidad de inteligencia US para juicio
                analítico sin modelo formal.
              </>
            }
            en={
              <>
                There are 8 possible explanations for what&apos;s happening in
                the sky. Seven are easy to calibrate — either almost certain
                or almost impossible. One is where the{" "}
                <strong className="text-text">actual analytical frontier</strong>{" "}
                lives, and most of the public debate orbits around it without
                realizing. Calibrated via{" "}
                <a
                  href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  ICD-203
                </a>
                , the US intelligence community standard for analytical
                judgment without a formal model.
              </>
            }
          />
        </Lede>
      </header>

      <IcdProbabilityChart />

      <section className="rounded-lg border border-border bg-surface-2 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
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
                      don't have P(evidence | hypothesis) calculated.
                    </>
                  }
                />
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>No es "posición del usuario".</strong> No se
                      ajustan priors; son juicios del análisis del corpus.
                    </>
                  }
                  en={
                    <>
                      <strong>It is not "user position".</strong> No priors are
                      adjusted; they are judgments from the corpus analysis.
                    </>
                  }
                />
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>No son decimales precisos.</strong> Decir "48%"
                      implica diferenciación que la evidencia no soporta. ICD-203
                      usa palabras por eso.
                    </>
                  }
                  en={
                    <>
                      <strong>They are not precise decimals.</strong> Saying
                      "48%" implies differentiation the evidence doesn't support.
                      ICD-203 uses words for this reason.
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
                      que usan analistas IC para reportes a tomadores de decisión.
                    </>
                  }
                  en={
                    <>
                      <strong>Calibrated via ICD-203</strong>, the same standard
                      IC analysts use for reports to decision-makers.
                    </>
                  }
                />
              </li>
              <li>
                <span className="text-accent">·</span>{" "}
                <T
                  es={
                    <>
                      <strong>Auditable:</strong> cada hipótesis abajo lista los
                      casos del corpus que la sostienen.
                    </>
                  }
                  en={
                    <>
                      <strong>Auditable:</strong> each hypothesis below lists the
                      corpus cases that sustain it.
                    </>
                  }
                />
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="space-y-16">
        {HYPOTHESES.map((h) => (
          <HypothesisSection key={h.id} hypothesisId={h.id} />
        ))}
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <Eyebrow>
          <T
            es="Por qué la pregunta sigue abierta"
            en="Why the question stays open"
          />
        </Eyebrow>
        <H2>
          <T
            es="La frontera analítica real está en una hipótesis, no en ocho"
            en="The actual analytical frontier is in one hypothesis, not eight"
          />
        </H2>
        <Body className="text-muted">
          <T
            es="Siete de las ocho hipótesis se ubican en bandas extremas (casi cierto o muy improbable) — son fáciles de calibrar porque los hechos están del lado del juicio o claramente en contra. La hipótesis H5 (≥1 caso involucra entidades no humanas) está en Probabilidad Pareja 45-55% — ahí es donde el corpus deja de poder decidir, y es la única banda que mueve el debate público real."
            en="Seven of the eight hypotheses fall in extreme bands (almost certain or very unlikely) — easy to calibrate because the facts are clearly on one side. H5 (≥1 case involves non-human entities) sits at Roughly Even 45-55% — that's where the corpus stops being able to decide, and it's the only band that drives actual public debate."
          />
        </Body>
        <Body className="text-muted">
          <T
            es="Casos militares con sensor (Tehran, Nimitz, Belgian Wave) son evidencia fuerte de algo real pero no discriminan entre 'tecnología clasificada' y 'algo no humano'. Casos folklóricos persistentes (Hessdalen) sugieren fenómenos naturales raros pero no excluyen los otros. 79 años de cover-up institucional indica que el estado oculta algo, pero no resuelve si lo que oculta es programa propio, accidente conocido, contacto, o ambos a la vez. Ahí está la pregunta de verdad."
            en="Military sensor cases (Tehran, Nimitz, Belgian Wave) are strong evidence of something real but don't discriminate between 'classified tech' and 'something non-human'. Persistent folkloric cases (Hessdalen) suggest rare natural phenomena but don't exclude the others. 79 years of institutional cover-up indicates the state hides something, but doesn't resolve whether what it hides is an in-house program, a known accident, contact, or all of the above. That's the real question."
          />
        </Body>
        <Caption>
          <T
            es={
              <>
                Más detalle metodológico en{" "}
                <Link href="/about" className="text-accent hover:underline">
                  Metodología
                </Link>{" "}
                y en{" "}
                <a
                  href="https://github.com/dgonzamat/UAP-analysys-/blob/main/METHODOLOGY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  METHODOLOGY.md
                </a>{" "}
                del corpus original.
              </>
            }
            en={
              <>
                More methodological detail in{" "}
                <Link href="/about" className="text-accent hover:underline">
                  Method
                </Link>{" "}
                and in{" "}
                <a
                  href="https://github.com/dgonzamat/UAP-analysys-/blob/main/METHODOLOGY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  METHODOLOGY.md
                </a>{" "}
                of the original corpus.
              </>
            }
          />
        </Caption>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          <T
            es="¿Cuál es el caso más fuerte? →"
            en="What's the strongest case? →"
          />
        </Link>
        <Link
          href="/about"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          <T
            es="¿Cómo se calibra la probabilidad?"
            en="How is the probability calibrated?"
          />
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          <T es="← Volver al inicio" en="← Back to home" />
        </Link>
      </nav>
    </article>
  );
}

function HypothesisSection({ hypothesisId }: { hypothesisId: string }) {
  const h = HYPOTHESES.find((x) => x.id === hypothesisId);
  if (!h) return null;

  const supportingCases = cases.filter((c) =>
    c.patterns.some((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId),
  );
  const associatedPatterns = patterns.filter(
    (p) => PATTERN_TO_HYPOTHESIS[p.id] === hypothesisId,
  );

  return (
    <section
      id={h.id}
      aria-labelledby={`${h.id}-title`}
      className="scroll-mt-20 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <H2 id={`${h.id}-title`}>
          <T es={h.label} en={h.labelEn} />
        </H2>
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
      <Caption>
        <T
          es={`Rango ICD-203: ${h.icd.min}–${h.icd.max}% — ${h.note}`}
          en={`ICD-203 range: ${h.icd.min}–${h.icd.max}% — ${h.noteEn}`}
        />
      </Caption>

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
    </section>
  );
}

/**
 * Editorial expansion for hypotheses that legitimately have zero
 * pattern + zero supporting case matches. Instead of an italic
 * "no evidence" caption (which reads as empty), we render the
 * actual reasoning for the assigned probability + relevant cross-
 * links (to subclasses, to researchers, to other pages).
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
        <div className="space-y-4 border-l-2 border-text/15 pl-5 pt-2">
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
                es="Ver subclase: interdimensional ↓"
                en="See subclass: interdimensional ↓"
              />
            </Link>
            <Link
              href="#psicoespiritual"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Ver subclase: psicoespiritual ↓"
                en="See subclass: psychospiritual ↓"
              />
            </Link>
            <Link
              href="#tratado-greys"
              className="inline-flex min-h-[44px] items-center border-2 border-text px-4 py-2 text-sm hover:bg-text hover:text-bg"
            >
              <T
                es="Ver subclase: tratado ↓"
                en="See subclass: treaty ↓"
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
