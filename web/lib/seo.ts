import type { Metadata } from "next";

/**
 * Metadata de una página de sección con `openGraph`/`twitter`
 * auto-referenciales. Espeja `title`/`description`/`canonical` en las tarjetas
 * sociales para que cada sección comparta SU propia card — no la de la home.
 *
 * Contexto: el `openGraph` global vive en `app/layout.tsx` con `url: "/"`,
 * `title` y `description` del sitio. Next NO hace deep-merge de `openGraph`:
 * una página que solo declara `title`/`description`/`alternates` hereda ese
 * `openGraph` de la home, así que al compartir `/cases/` o `/blog/` la card
 * apunta a la raíz con copy genérico. Este helper lo evita.
 *
 * `path` es una ruta relativa (con trailing slash, p. ej. `/cases/`); Next la
 * resuelve contra `metadataBase` (definido en el layout) tanto para `canonical`
 * como para `og:url`.
 */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const { title, description, path, image = "/og.png" } = opts;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "UAP Codex",
      title,
      description,
      url: path,
      locale: "es_ES",
      alternateLocale: ["en_US"],
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
