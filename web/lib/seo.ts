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
  locale?: string;
}): Metadata {
  const { title, description, path, image = "/og.png", locale = "en_US" } = opts;
  const alternateLocale = locale === "en_US" ? ["es_ES"] : ["en_US"];
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
      locale,
      alternateLocale,
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
 * Mapa hreflang recíproco para una ruta EN (raíz, idioma primario) y su espejo
 * /es/. Se usa en AMBOS lados (la página raíz y la /es/) para que apunten una a
 * la otra. `x-default` apunta al INGLÉS (la ruta raíz): es la versión que Google
 * sirve a todo usuario que no matchea un idioma específico —la audiencia
 * global—, así que el inglés (lingua franca) maximiza el alcance internacional.
 * El argumento es la ruta EN raíz (p. ej. `/about/`), igual que antes.
 */
export function hreflangFor(enPath: string) {
  return { en: enPath, es: `/es${enPath}`, "x-default": enPath } as const;
}

/**
 * Metadata de una página /es/ (espejo español): openGraph/twitter
 * auto-referenciales en `/es${enPath}`, canonical propio, hreflang recíproco y
 * og:locale es_ES. `enPath` es la ruta EN raíz (con trailing slash, p. ej.
 * `/blog/`).
 */
export function esMeta(opts: {
  title: string;
  description: string;
  enPath: string;
  image?: string;
}): Metadata {
  const esPath = `/es${opts.enPath}`;
  return {
    ...pageMeta({
      title: opts.title,
      description: opts.description,
      path: esPath,
      image: opts.image,
      locale: "es_ES",
    }),
    alternates: { canonical: esPath, languages: hreflangFor(opts.enPath) },
  };
}
