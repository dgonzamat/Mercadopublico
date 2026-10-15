import { notFound } from "next/navigation";
import { CATEGORY_LABELS, type SourceCategory } from "@/lib/sources";
import { pageMeta } from "@/lib/seo";
import { FuentesCategoryView, groups, pageCount } from "@/components/FuentesCategoryView";

// Páginas 2..N de cada categoría de /fuentes (la 1 vive en /fuentes/<categoría>/).
export function generateStaticParams() {
  return groups().flatMap((g) =>
    Array.from({ length: pageCount(g.items.length) - 1 }, (_, i) => ({
      category: g.category,
      page: String(i + 2),
    })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; page: string }> }) {
  const { category, page } = await params;
  const label = CATEGORY_LABELS[category as SourceCategory];
  return pageMeta({
    title: label ? `Sources: ${label.en} (page ${page})` : "Sources",
    description: label ? label.description_en : "Sources cited in the UAP corpus.",
    path: `/fuentes/${category}/${page}/`,
  });
}

export default async function FuentesCategoryPagedPage({ params }: { params: Promise<{ category: string; page: string }> }) {
  const { category, page } = await params;
  const n = Number(page);
  if (!Number.isInteger(n) || n < 2) notFound();
  return <FuentesCategoryView category={category} page={n} />;
}
