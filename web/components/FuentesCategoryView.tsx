import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSources, groupByCategory, CATEGORY_LABELS } from "@/lib/sources";
import { T } from "@/components/T";
import { SourceList } from "@/components/SourceList";
import { Eyebrow, H1, Caption } from "@/lib/typography";

// Las categorías grandes pasaban de 12.000 palabras en una sola página (y
// bilingüe: /fuentes no tiene espejo /es). Se paginan de forma estática:
// la página 1 vive en /fuentes/<categoría>/ y las siguientes en
// /fuentes/<categoría>/<n>/ (oct 2026).
export const PAGE_SIZE = 30;

export const groups = () => groupByCategory(getAllSources());

export function pageCount(n: number): number {
  return Math.max(1, Math.ceil(n / PAGE_SIZE));
}

export function FuentesCategoryView({ category, page }: { category: string; page: number }) {
  const g = groups().find((x) => x.category === category);
  if (!g) notFound();
  const pages = pageCount(g.items.length);
  if (page < 1 || page > pages) notFound();
  const label = CATEGORY_LABELS[g.category];
  const from = (page - 1) * PAGE_SIZE;
  const items = g.items.slice(from, from + PAGE_SIZE);
  const href = (n: number) => (n === 1 ? `/fuentes/${category}/` : `/fuentes/${category}/${n}/`);
  return (
    <article className="mx-auto max-w-4xl space-y-10 py-8">
      <header className="space-y-3 border-b-2 border-text pb-4">
        <Link href="/fuentes/" className="text-sm text-accent hover:underline">
          <T es="← Todas las categorías" en="← All categories" />
        </Link>
        <Eyebrow>
          {pages > 1 ? (
            <T
              es={`${g.items.length} referencias · página ${page} de ${pages}`}
              en={`${g.items.length} references · page ${page} of ${pages}`}
            />
          ) : (
            <T es={`${g.items.length} referencias`} en={`${g.items.length} references`} />
          )}
        </Eyebrow>
        <H1>
          <T es={label.es} en={label.en} />
        </H1>
        <Caption>
          <T es={label.description_es} en={label.description_en} />
        </Caption>
      </header>
      <SourceList items={items} />
      {pages > 1 && (
        <nav aria-label="Pages" className="flex flex-wrap gap-2 border-t border-border pt-6 font-mono text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
            n === page ? (
              <span key={n} aria-current="page" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-text px-3 text-text">
                {n}
              </span>
            ) : (
              <Link key={n} href={href(n)} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-border px-3 text-muted hover:border-accent/50 hover:text-text">
                {n}
              </Link>
            ),
          )}
        </nav>
      )}
    </article>
  );
}

