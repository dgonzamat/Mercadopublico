import {
  ResearcherDetailPage,
  generateStaticParams,
} from "@/app/researchers/[slug]/page";
import { researchers } from "@/lib/data";
import { esMeta } from "@/lib/seo";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const r = researchers.find((x) => x.id === slug);
  if (!r) return { title: "No encontrado" };
  return esMeta({
    title: r.name,
    // `seoTitle` está en español: esta es su ruta (como /es/cases/[slug]).
    absoluteTitle: r.seoTitle,
    description: r.seoDescription ?? r.bio_short,
    enPath: `/researchers/${r.id}/`,
  });
}

export default function EsResearcherDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <ResearcherDetailPage params={props.params} locale="es" />;
}
