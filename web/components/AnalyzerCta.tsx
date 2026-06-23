import Link from "next/link";
import { T } from "@/components/T";
import { TOTAL_CASES } from "@/lib/data";

/**
 * CTA contextual al Laboratorio (reporting). Se ancla donde la intención de
 * "analizar" es alta — /cases y /probabilidades — convirtiendo lector en
 * analista justo donde ya está mirando los datos. Evita depender del nav
 * global (que manda anónimos contra el muro de login sin contexto).
 */
export function AnalyzerCta() {
  return (
    <Link
      href="/laboratorio"
      className="group flex items-center justify-between gap-4 border border-border bg-panel p-5 transition hover:border-accent"
    >
      <div className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          <T es="Laboratorio · análisis interactivo" en="Data Lab · interactive analysis" />
        </p>
        <p className="font-display text-xl font-medium leading-tight text-text">
          <T es="Analiza los datos a tu manera" en="Analyze the data your way" />
        </p>
        <p className="text-sm text-muted">
          <T
            es={`Filtra, cruza y grafica los ${TOTAL_CASES} casos. Arma tu propio tablero con KPIs y guárdalo.`}
            en={`Filter, cross and chart all ${TOTAL_CASES} cases. Build your own dashboard with KPIs and save it.`}
          />
        </p>
      </div>
      <span
        aria-hidden
        className="shrink-0 font-mono text-2xl text-accent transition group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
