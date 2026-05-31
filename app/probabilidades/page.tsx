import Link from "next/link";
import { cases, patterns, TOTAL_CASES } from "@/lib/data";
import { HYPOTHESES } from "@/lib/hypotheses";
import { PATTERN_TO_HYPOTHESIS } from "@/lib/hypothesisMapping";

export const metadata = {
  title: "Probabilidades · UAP Atlas",
  description: "Razonamiento detallado por hipótesis. ICD-203 + evidencia del corpus que sostiene cada juicio.",
};

export default function ProbabilidadesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-12">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Razonamiento detallado
        </p>
        <h1 className="mt-2 text-3xl font-bold text-text">
          Por qué cada hipótesis tiene la probabilidad que tiene
        </h1>
        <p className="mt-4 text-muted">
          Las probabilidades del home se asignan vía{" "}
          <a
            href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            ICD-203
          </a>{" "}
          (Intelligence Community Directive 2007), el estándar USIC para juicio analítico
          cuando no hay un modelo formal de inferencia. Acá se explica el razonamiento
          detrás de cada etiqueta — qué evidencia del corpus la sostiene y cuál la debilita.
        </p>
      </header>

      <section className="rounded-lg border border-accent/30 bg-accent/5 p-5">
        <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
          Lo que NO es esto
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-text">
          <li>❌ <strong>No es inferencia Bayesiana formal.</strong> No tenemos P(evidencia | hipótesis) calculadas.</li>
          <li>❌ <strong>No es "posición del usuario".</strong> No se ajustan priors; son juicios del análisis del corpus.</li>
          <li>❌ <strong>No son decimales precisos.</strong> Decir "48%" y "12%" implica diferenciación que la evidencia no soporta. ICD-203 usa palabras (Roughly Even / Very Unlikely) por eso.</li>
        </ul>
        <h2 className="mt-4 text-sm font-mono uppercase tracking-widest text-accent">
          Lo que SÍ es
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-text">
          <li>✓ <strong>Juicio analítico estructurado</strong> sobre {TOTAL_CASES} casos institucionales (militar, congreso, agencias) entre 1947 y 2026.</li>
          <li>✓ <strong>Calibrado vía ICD-203</strong> — el mismo estándar que usan analistas IC para reportes a tomadores de decisión.</li>
          <li>✓ <strong>Auditable</strong> — cada hipótesis abajo lista los casos del corpus que la sostienen, mapeados por patrón documentado.</li>
        </ul>
      </section>

      {HYPOTHESES.map((h) => (
        <HypothesisSection key={h.id} hypothesisId={h.id} />
      ))}

      <section className="rounded-lg border border-accent/40 bg-accent/10 p-6">
        <h2 className="text-2xl font-bold text-text">Por qué el corpus elige Plurality como posición</h2>
        <p className="mt-3 text-text">
          Ninguna hipótesis individual explica todo el corpus. Casos militares con sensor
          (Tehran, Nimitz, Belgian Wave) son evidencia fuerte de algo real pero no
          discriminan entre interpretaciones. Casos folklóricos persistentes (Hessdalen)
          sugieren fenómenos naturales raros. El cover-up institucional documentado de
          79 años sugiere que el estado oculta algo, pero no resuelve si lo que oculta
          es ET, programa propio, o ambos.
        </p>
        <p className="mt-3 text-text">
          La posición <strong>Plurality</strong> dice: probablemente son <em>varios fenómenos
          distintos</em> agrupados bajo la etiqueta "UAP". Esto es honesto epistemológicamente
          — admitir que no tenemos resolución suficiente para una explicación unitaria.
        </p>
        <p className="mt-3 text-sm text-muted">
          Más detalle metodológico en{" "}
          <Link href="/about" className="text-accent hover:underline">Metodología</Link>{" "}
          y en{" "}
          <a
            href="https://github.com/dgonzamat/UAP-analysys-/blob/main/METHODOLOGY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            METHODOLOGY.md
          </a>
          {" "}del corpus original.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          ← Volver al dashboard
        </Link>
        <Link
          href="/cases"
          className="rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          Ver casos
        </Link>
        <Link
          href="/about"
          className="rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          Metodología
        </Link>
      </div>
    </article>
  );
}

function HypothesisSection({ hypothesisId }: { hypothesisId: string }) {
  const h = HYPOTHESES.find((x) => x.id === hypothesisId);
  if (!h) return null;

  // Casos que sostienen esta hipótesis = aquellos con al menos un patrón mapeado a h.id
  const supportingCases = cases.filter((c) =>
    c.patterns.some((p) => PATTERN_TO_HYPOTHESIS[p] === hypothesisId),
  );

  // Patrones asociados a esta hipótesis
  const associatedPatterns = patterns.filter(
    (p) => PATTERN_TO_HYPOTHESIS[p.id] === hypothesisId,
  );

  return (
    <section id={h.id} aria-labelledby={`${h.id}-title`} className="scroll-mt-16">
      <div className="flex items-start justify-between gap-4">
        <h2 id={`${h.id}-title`} className="text-2xl font-bold text-text">
          {h.label}
        </h2>
        <span
          className="shrink-0 rounded-md border px-3 py-1 font-mono text-xs uppercase tracking-wider"
          style={{ borderColor: `${h.color}66`, color: h.color, backgroundColor: `${h.color}11` }}
        >
          {h.icd.labelEs}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Rango ICD-203: {h.icd.min}–{h.icd.max}% — {h.note}
      </p>

      {associatedPatterns.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-panel p-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
            Patrones asociados ({associatedPatterns.length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {associatedPatterns.map((p) => (
              <Link
                key={p.id}
                href={`/patterns/${p.letter}`}
                className="inline-flex min-h-[44px] items-center rounded border border-border bg-bg px-2.5 py-1 text-xs hover:border-accent/50"
                style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
                title={p.description}
              >
                <span className="font-mono text-accent">{p.id}</span>{" "}
                <span className="text-text">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {supportingCases.length > 0 && (
        <div className="mt-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
            Casos que la sostienen ({supportingCases.length})
          </h3>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {supportingCases.slice(0, 12).map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="inline-flex min-h-[44px] items-center rounded px-2 py-1 text-xs text-text hover:bg-panel"
              >
                <span aria-hidden className="mr-1">{c.flag}</span>
                <span className="sr-only">{c.country_name}.</span>
                <span>{c.name}</span>
                <span className="ml-1 font-mono text-muted">· {c.year_start}</span>
              </Link>
            ))}
            {supportingCases.length > 12 && (
              <p className="mt-1 px-2 text-xs text-muted">
                + {supportingCases.length - 12} casos más
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
