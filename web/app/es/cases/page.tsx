import { CasesView } from "@/app/cases/page";
import { TOTAL_CASES } from "@/lib/data";
import { esMeta } from "@/lib/seo";

/**
 * Índice de casos en español (/es/cases/). Reutiliza el componente raíz
 * (renderiza ambos idiomas vía <T>); el wrapper `data-locale="es"` de
 * app/es/layout.tsx hace que el CSS muestre el español. Solo cambia la metadata.
 */
export const metadata = esMeta({
  title: "Casos UAP institucionales (1947–2026)",
  description: `${TOTAL_CASES} casos UAP institucionales documentados (1947–2026) — un archivo cronológico con nivel de evidencia y fuentes primarias.`,
  enPath: "/cases/",
});

export default function EsCasesPage() {
  return <CasesView locale="es" />;
}
