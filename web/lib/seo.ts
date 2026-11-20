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
/**
 * Meta descripción que Google no corta a ciegas (auditoría SEO S2, nov 2026):
 * 1.096 páginas usaban el resumen entero, de hasta 650 caracteres, y la SERP
 * lo cortaba hacia los 155–160 en mitad de una palabra. Hasta `max` se deja
 * igual; si no, se corta en el último fin de frase que deje al menos 80
 * caracteres, o en el último espacio con «…». Solo afecta a las etiquetas
 * meta y las tarjetas sociales, nunca al texto de la página.
 */
export function metaDescription(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "));
  if (sentence >= 80) return head.slice(0, sentence + 1);
  const space = head.slice(0, max - 1).lastIndexOf(" ");
  let cut = head.slice(0, space > 0 ? space : max - 1);
  // Ni puntuación ni una palabra vacía antes de «…» («su carro de…»).
  for (let i = 0; i < 3; i++) {
    cut = cut.replace(/[\s,;:—–(«"'-]+$/u, "");
    const stripped = cut.replace(/\s(?:de|del|la|las|el|los|lo|un|una|y|o|a|al|en|con|por|para|que|su|sus|se|of|the|a|an|and|or|to|in|on|at|by|for|with|from|that|his|her|its|their)$/iu, "");
    if (stripped === cut) break;
    cut = stripped;
  }
  return `${cut}…`;
}

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  locale?: string;
}): Metadata {
  const { title, path, image = "/og.png", locale = "en_US" } = opts;
  const description = metaDescription(opts.description);
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
  /**
   * Título ABSOLUTO: reemplaza el título completo sin el sufijo "· UAP Codex"
   * del template del layout. Es lo que necesitan los `seoTitle` del corpus,
   * escritos ≤60 chars ya contando el snippet entero — con el sufijo se
   * pasarían de largo y Google los truncaría. Espeja lo que la ruta EN ya
   * hace con `seoTitle_en`.
   */
  absoluteTitle?: string;
}): Metadata {
  const esPath = `/es${opts.enPath}`;
  const displayTitle = opts.absoluteTitle ?? opts.title;
  return {
    ...pageMeta({
      title: displayTitle,
      description: opts.description,
      path: esPath,
      image: opts.image,
      locale: "es_ES",
    }),
    // El título absoluto solo aplica al <title>; og/twitter ya reciben
    // `displayTitle` como texto plano desde pageMeta.
    ...(opts.absoluteTitle ? { title: { absolute: opts.absoluteTitle } } : {}),
    alternates: { canonical: esPath, languages: hreflangFor(opts.enPath) },
  };
}
