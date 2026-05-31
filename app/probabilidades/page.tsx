import Link from "next/link";
import { cases, patterns, TOTAL_CASES } from "@/lib/data";
import { HYPOTHESES } from "@/lib/hypotheses";
import { PATTERN_TO_HYPOTHESIS } from "@/lib/hypothesisMapping";
import { Eyebrow, H1, H2, H3, Lede, Body, Caption } from "@/lib/typography";

export const metadata = {
  title: "Probabilidades · UAP Atlas",
  description:
    "Razonamiento detallado por hipótesis. ICD-203 + evidencia del corpus que sostiene cada juicio.",
};

export default function ProbabilidadesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-16 py-8">
      <header className="space-y-4">
        <Eyebrow>Razonamiento detallado</Eyebrow>
        <H1>Por qué cada hipótesis tiene la probabilidad que tiene</H1>
        <Lede className="text-muted">
          Las probabilidades del home se asignan vía{" "}
          <a
            href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            ICD-203
          </a>{" "}
          (Intelligence Community Directive 2007), el estándar USIC para juicio
          analítico sin modelo formal de inferencia. Acá se explica el
          razonamiento detrás de cada etiqueta.
        </Lede>
      </header>

      <section className="rounded-lg border border-border bg-surface-2 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Eyebrow>Lo que NO es</Eyebrow>
            <ul className="space-y-2 text-sm text-text">
              <li>
                <span className="text-muted">·</span>{" "}
                <strong>No es inferencia Bayesiana formal.</strong> No tenemos
                P(evidencia | hipótesis) calculadas.
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <strong>No es "posición del usuario".</strong> No se ajustan
                priors; son juicios del análisis del corpus.
              </li>
              <li>
                <span className="text-muted">·</span>{" "}
                <strong>No son decimales precisos.</strong> Decir "48%" implica
                diferenciación que la evidencia no soporta. ICD-203 usa
                palabras por eso.
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <Eyebrow>Lo que SÍ es</Eyebrow>
            <ul className="space-y-2 text-sm text-text">
              <li>
                <span className="text-accent">·</span>{" "}
                <strong>Juicio analítico estructurado</strong> sobre{" "}
                {TOTAL_CASES} casos institucionales (1947–2026).
              </li>
              <li>
                <span className="text-accent">·</span>{" "}
                <strong>Calibrado vía ICD-203</strong>, el mismo estándar que
                usan analistas IC para reportes a tomadores de decisión.
              </li>
              <li>
                <span className="text-accent">·</span>{" "}
                <strong>Auditable:</strong> cada hipótesis abajo lista los
                casos del corpus que la sostienen.
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
        <Eyebrow>Posición del corpus</Eyebrow>
        <H2>Por qué el corpus elige Plurality</H2>
        <Body className="text-muted">
          Ninguna hipótesis individual explica todo el corpus. Casos militares
          con sensor (Tehran, Nimitz, Belgian Wave) son evidencia fuerte de
          algo real pero no discriminan entre interpretaciones. Casos
          folklóricos persistentes (Hessdalen) sugieren fenómenos naturales
          raros. El cover-up institucional documentado de 79 años sugiere que
          el estado oculta algo, pero no resuelve si lo que oculta es ET,
          programa propio, o ambos.
        </Body>
        <Body className="text-muted">
          La posición <strong className="text-text">Plurality</strong> dice:
          probablemente son <em>varios fenómenos distintos</em> agrupados bajo
          la etiqueta "UAP". Esto es honesto epistemológicamente — admitir que
          no tenemos resolución suficiente para una explicación unitaria.
        </Body>
        <Caption>
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
        </Caption>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          ← Volver al dashboard
        </Link>
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          Ver casos
        </Link>
        <Link
          href="/about"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          Metodología
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
        <H2 id={`${h.id}-title`}>{h.label}</H2>
        <span
          className="shrink-0 rounded-md border px-3 py-1 font-mono text-xs uppercase tracking-wider"
          style={{
            borderColor: `${h.color}66`,
            color: h.color,
            backgroundColor: `${h.color}11`,
          }}
        >
          {h.icd.labelEs}
        </span>
      </div>
      <Caption>
        Rango ICD-203: {h.icd.min}–{h.icd.max}% — {h.note}
      </Caption>

      {associatedPatterns.length > 0 && (
        <div className="space-y-2 pt-2">
          <Eyebrow>Patrones asociados ({associatedPatterns.length})</Eyebrow>
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
          <Eyebrow>Casos que la sostienen ({supportingCases.length})</Eyebrow>
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
              + {supportingCases.length - 12} casos más asociados a esta
              hipótesis
            </Caption>
          )}
        </div>
      )}

      {associatedPatterns.length === 0 && supportingCases.length === 0 && (
        <Caption className="italic">
          Sin patrones ni casos del corpus que sostengan directamente esta
          hipótesis — es prevalente en discurso público pero no en evidencia
          institucional.
        </Caption>
      )}
    </section>
  );
}
