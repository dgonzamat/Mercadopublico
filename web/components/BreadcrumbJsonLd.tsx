"use client";

import { usePathname } from "next/navigation";
import { localizeHref } from "@/components/LocaleLink";
import { breadcrumbJsonLd, serializeJsonLd } from "@/lib/jsonld";

/**
 * BreadcrumbList JSON-LD consciente del locale. En el árbol /en/ localiza el
 * `href` de cada ítem (usePathname → localizeHref) antes de construir el
 * schema, de modo que el dato estructurado de las páginas /en apunte a URLs
 * /en/… en vez de a las ES. Client component: durante el SSG de las rutas /en
 * usePathname devuelve el path /en, así que el `<script>` estático ya sale con
 * las URLs correctas (visible al crawler, igual que LocaleLink hace con los
 * anclas). En el árbol ES localizeHref es no-op y el resultado es idéntico al
 * anterior.
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  const pathname = usePathname();
  const localized = items.map((it) =>
    it.href ? { ...it, href: localizeHref(it.href, pathname) } : it,
  );
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(breadcrumbJsonLd(localized)),
      }}
    />
  );
}
