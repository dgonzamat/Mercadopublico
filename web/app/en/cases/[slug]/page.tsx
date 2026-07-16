import CaseDetailPage, {
  generateStaticParams,
} from "@/app/cases/[slug]/page";
import { cases } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

/**
 * Detalle de caso en inglés (/en/cases/[slug]/) — Fase 1. Reutiliza el
 * componente y los params estáticos del detalle ES; el wrapper
 * `data-locale="en"` muestra el inglés. Solo cambia la metadata: title/
 * description desde los campos *_en, canonical propio y hreflang recíproco.
 */
export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Case not found" };
  const esPath = `/cases/${c.id}/`;
  const enPath = `/en${esPath}`;
  return {
    ...pageMeta({
      title: c.name_en ?? c.name,
      description: c.summary_en ?? c.summary,
      path: enPath,
    }),
    alternates: {
      canonical: enPath,
      languages: { es: esPath, en: enPath, "x-default": esPath },
    },
  };
}

export default CaseDetailPage;
