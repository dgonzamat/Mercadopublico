import { HYPOTHESES } from "@/lib/hypotheses";

/**
 * Probability chart using ICD-203 labels + ranges instead of single
 * decimal percentages. Each bar shows the ICD range as a band — not a
 * point — to honestly convey the underlying uncertainty.
 */
export function IcdProbabilityChart() {
  return (
    <section aria-labelledby="probability-chart-title">
      <h2 id="probability-chart-title" className="text-sm font-mono uppercase tracking-widest text-muted">
        ¿Qué son los UAP? — probabilidad por hipótesis
      </h2>
      <p className="mt-3 max-w-2xl text-text">
        Las 6 hipótesis principales con probabilidad expresada como{" "}
        <a
          href="https://www.dni.gov/files/documents/ICD/ICD%20203%20Analytic%20Standards.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          etiqueta ICD-203
        </a>{" "}
        — el estándar USIC para juicio analítico cuando no hay modelo formal.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-panel">
        {HYPOTHESES.map((h, idx) => (
          <div
            key={h.id}
            id={h.id}
            className={`px-5 py-4 ${idx > 0 ? "border-t border-border" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-text">{h.label}</p>
              <span
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: h.color }}
              >
                {h.icd.labelEs}
              </span>
            </div>

            <div
              className="relative mt-2 h-2 overflow-hidden rounded-full bg-bg"
              role="progressbar"
              aria-valuemin={h.icd.min}
              aria-valuemax={h.icd.max}
              aria-valuenow={Math.round((h.icd.min + h.icd.max) / 2)}
              aria-valuetext={`${h.label}: ${h.icd.labelEs}, entre ${h.icd.min} y ${h.icd.max} por ciento. Juicio analítico ICD-203, no inferencia formal.`}
            >
              <div
                className="absolute h-full rounded-full"
                style={{
                  left: `${h.icd.min}%`,
                  width: `${h.icd.max - h.icd.min}%`,
                  backgroundColor: h.color,
                }}
              />
              <div className="absolute inset-y-0 left-1/4 w-px bg-border/40" aria-hidden />
              <div className="absolute inset-y-0 left-1/2 w-px bg-border/40" aria-hidden />
              <div className="absolute inset-y-0 left-3/4 w-px bg-border/40" aria-hidden />
            </div>

            <div className="mt-1 flex items-baseline justify-between text-xs text-muted">
              <span>{h.icd.min}–{h.icd.max}%</span>
              <span className="text-right">{h.note}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Las etiquetas (Roughly Even, Very Unlikely, etc.) son juicios analíticos calibrados,
        no posteriori derivados de un modelo Bayesiano formal. El razonamiento detrás de cada{" "}
        <a className="text-accent hover:underline" href="/probabilidades">se documenta en /probabilidades</a>.
      </p>
    </section>
  );
}
