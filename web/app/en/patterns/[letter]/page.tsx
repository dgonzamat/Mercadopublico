import PatternDetailPage, {
  generateStaticParams,
} from "@/app/patterns/[letter]/page";
import { patterns } from "@/lib/data";
import { enMeta } from "@/lib/seo";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;
  const p = patterns.find((x) => x.letter === letter);
  if (!p) return { title: "Pattern not found" };
  return enMeta({
    title: `${p.id} ${p.name_en ?? p.name}`,
    description: p.description_en ?? p.description,
    esPath: `/patterns/${p.letter}/`,
  });
}

export default PatternDetailPage;
