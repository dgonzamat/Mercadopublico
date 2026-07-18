import ResearcherDetailPage, {
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
    description: r.seoDescription ?? r.bio_short.slice(0, 160),
    enPath: `/researchers/${r.id}/`,
  });
}

export default ResearcherDetailPage;
