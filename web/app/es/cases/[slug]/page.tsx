import CaseDetailPage, {
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
  return esMeta({
    title: c.name,
    description: c.summary,
    enPath: `/cases/${c.id}/`,
  });
}

export default CaseDetailPage;
