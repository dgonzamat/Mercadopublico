import { LocaleLink } from "@/components/LocaleLink";
import { T } from "@/components/T";

type Crumb = { href?: string; es: string; en: string };

/**
 * Rastro jerárquico para páginas de detalle (Inicio › Casos › Nimitz 2004).
 * Server component puro. El último item es la página actual (no enlaza,
 * marcado aria-current). El padre clickeable reemplaza al viejo "← Volver".
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Ruta de navegación"
      className="font-mono text-xs uppercase tracking-widest text-muted"
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-x-2">
              {it.href && !last ? (
                <LocaleLink href={it.href} className="hover:text-accent">
                  <T es={it.es} en={it.en} />
                </LocaleLink>
              ) : (
                <span
                  className={last ? "text-text" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  <T es={it.es} en={it.en} />
                </span>
              )}
              {!last && (
                <span aria-hidden className="text-muted/50">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
