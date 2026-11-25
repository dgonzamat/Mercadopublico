import { CaseDetailPage } from "@/app/cases/[slug]/page";
import { generateStaticParams } from "@/app/cryptids/[slug]/page";
import { cryptids } from "@/lib/data";
import { esMeta } from "@/lib/seo";

/** Detalle de un críptido en español (/es/cryptids/[slug]/). */
export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const c = cryptids.find((x) => x.id === params.slug);
  if (!c) return { title: "Expediente no encontrado", robots: { index: false, follow: true } };
  return esMeta({
    title: c.name,
    absoluteTitle: c.seoTitle,
    description: c.seoDescription ?? c.summary,
    enPath: `/cryptids/${c.id}/`,
  });
}

export default function EsCryptidDetailPage(props: { params: Promise<{ slug: string }> }) {
  return <CaseDetailPage params={props.params} locale="es" collection="cryptids" />;
}
