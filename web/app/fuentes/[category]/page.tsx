import { CATEGORY_LABELS, type SourceCategory } from "@/lib/sources";
import { pageMeta } from "@/lib/seo";
import { FuentesCategoryView, groups } from "@/components/FuentesCategoryView";

export function generateStaticParams() {
  return groups().map((g) => ({ category: g.category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const label = CATEGORY_LABELS[category as SourceCategory];
  return pageMeta({
    title: label ? `Sources: ${label.en}` : "Sources",
    description: label ? label.description_en : "Sources cited in the UAP corpus.",
    path: `/fuentes/${category}/`,
  });
}

export default async function FuentesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <FuentesCategoryView category={category} page={1} />;
}
