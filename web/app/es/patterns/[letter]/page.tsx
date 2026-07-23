import {
  PatternDetailPage,
  generateStaticParams,
} from "@/app/patterns/[letter]/page";
import { patterns } from "@/lib/data";
import { esMeta } from "@/lib/seo";

export { generateStaticParams };

export async function generateMetadata(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;
  const p = patterns.find((x) => x.letter === letter);
  if (!p) return { title: "Patrón no encontrado" };
  return esMeta({
    title: `${p.id} ${p.name}`,
    description: p.description,
    enPath: `/patterns/${p.letter}/`,
  });
}

export default function EsPatternDetailPage(props: {
  params: Promise<{ letter: string }>;
}) {
  return <PatternDetailPage params={props.params} locale="es" />;
}
