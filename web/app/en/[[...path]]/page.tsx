import type { Metadata } from "next";
import EnRedirect from "@/components/EnRedirect";

/**
 * Stubs de las rutas /en/ viejas (pre-inversión a inglés-primario). El inglés
 * ahora vive en la raíz; estas URLs se conservan solo para preservar el equity
 * SEO de los enlaces ya indexados: declaran `canonical` a la ruta raíz (Google
 * consolida las señales) + `noindex` (no re-indexar el stub) + `<EnRedirect>`
 * (cliente) para llevar al visitante a la raíz. Un solo catch-all + un solo
 * client component. Cubre las secciones estáticas; los detalles dinámicos
 * (/en/cases/[slug]…) no se enumeran (su contenido vive en la raíz).
 */
const SECTIONS = [
  "about",
  "cases",
  "blog",
  "patterns",
  "researchers",
  "probabilidades",
  "resumen",
  "cobertura",
  "frameworks",
  "releases",
];

export function generateStaticParams(): { path: string[] }[] {
  return [{ path: [] }, ...SECTIONS.map((s) => ({ path: [s] }))];
}

export async function generateMetadata(props: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const { path } = await props.params;
  const target = path?.length ? `/${path.join("/")}/` : "/";
  return {
    alternates: { canonical: target },
    robots: { index: false, follow: true },
  };
}

export default function EnRedirectPage() {
  return <EnRedirect />;
}
