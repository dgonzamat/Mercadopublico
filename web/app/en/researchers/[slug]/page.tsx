import ResearcherDetailPage, {
  generateStaticParams,
} from "@/app/researchers/[slug]/page";
import { researchers } from "@/lib/data";
import { enMeta } from "@/lib/seo";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const r = researchers.find((x) => x.id === slug);
  if (!r) return { title: "Not found" };
  return enMeta({
    title: r.name,
    description: r.bio_short_en ?? r.seoDescription ?? r.bio_short.slice(0, 160),
    esPath: `/researchers/${r.id}/`,
  });
}

export default ResearcherDetailPage;
