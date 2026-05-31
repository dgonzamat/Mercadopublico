import Link from "next/link";
import { cases } from "@/lib/data";
import { IcdProbabilityChart } from "@/components/IcdProbabilityChart";

/**
 * Home minimalista — SOLO un dashboard.
 *
 * Iteraciones previas agregaban "Lo que sí podemos contar" (CorpusStats) +
 * CTAs múltiples. El usuario dejó claro: solo título + dashboard + ir al cálculo.
 * Esta versión cumple esa restricción a la letra.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Título ultra compacto */}
      <header>
        <h1 className="text-2xl font-bold text-text sm:text-3xl">
          ¿Qué tan probable es cada hipótesis sobre UAP?
        </h1>
        <p className="mt-2 text-sm text-muted">
          {cases.length} casos institucionales · 1947–2026 · estándar ICD-203
        </p>
      </header>

      {/* EL dashboard — único elemento del home */}
      <IcdProbabilityChart />

      {/* Una sola CTA hacia el razonamiento detallado */}
      <div className="border-t border-border pt-6">
        <Link
          href="/probabilidades"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:bg-accent/90"
        >
          Ver cómo se llegó a estas probabilidades →
        </Link>
      </div>
    </div>
  );
}
