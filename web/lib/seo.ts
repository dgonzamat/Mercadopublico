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

/**
 * Mapa hreflang recíproco para una ruta ES y su espejo /en/. Se usa en AMBOS
 * lados (la página ES y la /en/) para que apunten una a la otra. `x-default`
 * apunta al INGLÉS (`/en${esPath}`): es la versión que Google sirve a todo
 * usuario que no matchea un idioma específico —la audiencia global—, así que
 * el inglés (lingua franca) maximiza el alcance internacional.
 */
export function hreflangFor(esPath: string) {
  return { es: esPath, en: `/en${esPath}`, "x-default": `/en${esPath}` } as const;
}

/**
 * Metadata de una página /en/ (espejo inglés): openGraph/twitter
 * auto-referenciales en `/en${esPath}`, canonical propio y hreflang recíproco.
 * `esPath` es la ruta ES (con trailing slash, p. ej. `/blog/`).
 */
export function enMeta(opts: {
  title: string;
  description: string;
  esPath: string;
  image?: string;
}): Metadata {
  const enPath = `/en${opts.esPath}`;
  return {
    ...pageMeta({
      title: opts.title,
      description: opts.description,
      path: enPath,
      image: opts.image,
    }),
    alternates: { canonical: enPath, languages: hreflangFor(opts.esPath) },
  };
}
