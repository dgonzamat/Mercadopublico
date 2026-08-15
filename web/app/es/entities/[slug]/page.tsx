import {
  EntityDetailPage,
  generateStaticParams,
} from "@/app/entities/[slug]/page";
import { getEntityMorphology } from "@/lib/data";
import { esMeta } from "@/lib/seo";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const f = getEntityMorphology(slug);
  if (!f || !f.present) return { title: "Forma no encontrada" };
  return esMeta({
    title: `${f.name} · forma de entidad`,
    description: f.description,
    enPath: `/entities/${f.slug}/`,
  });
}

export default function EsEntityDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <EntityDetailPage params={props.params} locale="es" />;
}
