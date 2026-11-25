import { CaseDetailPage } from "@/app/cases/[slug]/page";
import { cryptids } from "@/lib/data";
import { metaDescription } from "@/lib/seo";

/**
 * Detalle de un críptido (/cryptids/[slug]/): colección aparte, con su propio
 * modelo y fuera de los totales UAP (25 nov 2026, decisión del dueño). Reutiliza
 * el detalle de casos con `collection="cryptids"`, que cambia «Qué fue» por el
 * reparto de las seis explicaciones de los críptidos.
 */

// Con la colección vacía, el export estático no admite una ruta dinámica sin
// params: se genera un marcador que responde 404 y no figura en el sitemap.
export const PLACEHOLDER_SLUG = "_";
export const dynamicParams = false;

export function generateStaticParams() {
  const ids = cryptids.map((c) => c.id);
  return (ids.length ? ids : [PLACEHOLDER_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const c = cryptids.find((x) => x.id === params.slug);
  if (!c) return { title: "Cryptid file not found", robots: { index: false, follow: true } };
  const path = `/cryptids/${c.id}/`;
  const description = metaDescription(c.seoDescription_en ?? c.summary_en ?? c.summary);
  const title = c.name_en ?? c.name;
  return {
    title: c.seoTitle_en ? { absolute: c.seoTitle_en } : title,
    description,
    alternates: {
      canonical: path,
      languages: { en: path, es: `/es${path}`, "x-default": path },
    },
    openGraph: {
      type: "article",
      title: `${title} — ${c.year_start}${c.year_end ? `–${c.year_end}` : ""}`,
      description,
      url: path,
      locale: "en_US",
      alternateLocale: ["es_ES"],
      images: c.primaryDocument?.url
        ? [{ url: c.primaryDocument.url, alt: c.primaryDocument.alt_en ?? c.primaryDocument.caption_en ?? title }]
        : [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — UAP Codex`,
      description,
      images: c.primaryDocument?.url ? [c.primaryDocument.url] : ["/og.png"],
    },
  };
}

export default function CryptidDetailPage(props: { params: Promise<{ slug: string }> }) {
  return <CaseDetailPage params={props.params} locale="en" collection="cryptids" />;
}
