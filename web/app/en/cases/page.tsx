import CasesPage from "@/app/cases/page";
import { TOTAL_CASES } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

/**
 * Índice de casos en inglés (/en/cases/) — Fase 1. Reutiliza el componente ES
 * (renderiza ambos idiomas vía <T>); el wrapper `data-locale="en"` de
 * app/en/layout.tsx hace que el CSS muestre el inglés. Solo cambia la metadata:
 * título/descripción en EN, canonical propio y hreflang recíproco con /cases/.
 */
export const metadata = {
  ...pageMeta({
    title: "Institutional UAP cases (1947–2026)",
    description: `${TOTAL_CASES} documented institutional UAP cases (1947–2026) — a chronological archive with evidence tier and primary sources.`,
    path: "/en/cases/",
  }),
  alternates: {
    canonical: "/en/cases/",
    languages: { es: "/cases/", en: "/en/cases/", "x-default": "/cases/" },
  },
};

export default CasesPage;
