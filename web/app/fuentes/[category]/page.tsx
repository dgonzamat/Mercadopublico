import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSources, groupByCategory, CATEGORY_LABELS, type SourceCategory } from "@/lib/sources";
import { pageMeta } from "@/lib/seo";
import { T } from "@/components/T";
import { SourceList } from "@/components/SourceList";
import { Eyebrow, H1, Caption } from "@/lib/typography";

const groups = () => groupByCategory(getAllSources());

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
  const g = groups().find((x) => x.category === category);
  if (!g) notFound();
  const label = CATEGORY_LABELS[g.category];
  return (
    <article className="mx-auto max-w-4xl space-y-10 py-8">
      <header className="space-y-3 border-b-2 border-text pb-4">
        <Link href="/fuentes/" className="text-sm text-accent hover:underline">
          <T es="← Todas las categorías" en="← All categories" />
        </Link>
        <Eyebrow>
          <T es={`${g.items.length} referencias`} en={`${g.items.length} references`} />
        </Eyebrow>
        <H1>
          <T es={label.es} en={label.en} />
        </H1>
        <Caption>
          <T es={label.description_es} en={label.description_en} />
        </Caption>
      </header>
      <SourceList items={g.items} />
    </article>
  );
}
