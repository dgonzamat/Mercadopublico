import {
  CaseDetailPage,
  generateStaticParams,
} from "@/app/cases/[slug]/page";
import { cases } from "@/lib/data";
import { esMeta } from "@/lib/seo";

/**
 * Detalle de caso en español (/es/cases/[slug]/). Reutiliza el componente y los
 * params estáticos del detalle raíz (inglés); el wrapper `data-locale="es"`
 * muestra el español. Solo cambia la metadata: title/description en ES,
 * canonical propio y hreflang recíproco.
 */
export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Caso no encontrado" };
  // `seoTitle`/`seoDescription` están en ESPAÑOL: esta es su ruta. Antes no se
  // leían en ninguna parte —la ruta EN se pasó a los pares `_en` (#…) y esta
  // seguía con name/summary—, así que los 15 títulos ES optimizados por query
  // no se servían nunca. Y donde `name` está en inglés (grusch-testimony-2023,
  // robertson-panel-1953) la ruta española mostraba título en inglés.
  return esMeta({
    title: c.name,
    absoluteTitle: c.seoTitle,
    description: c.seoDescription ?? c.summary,
    enPath: `/cases/${c.id}/`,
  });
}

export default function EsCaseDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <CaseDetailPage params={props.params} locale="es" />;
}
