import { T } from "@/components/T";

type CategoryNavItem = {
  anchor: string;
  es: string;
  en: string;
  count?: number;
};

/**
 * Índice de categorías — fila de chips ancla para saltar a cada sección de
 * la página sin scrollear. Server component puro (zero JS): son anchors
 * `#id` normales; AnchorExpander (global) abre cualquier <details> destino.
 *
 * Cada sección destino debe llevar el `id` correspondiente y `scroll-mt-*`
 * para que el header sticky no la tape.
 */
export function CategoryNav({
  label,
  items,
}: {
  label: { es: string; en: string };
  items: CategoryNavItem[];
}) {
  return (
    <nav aria-label="Índice de secciones" className="space-y-3">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es={label.es} en={label.en} />
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it.anchor}>
            <a
              href={`#${it.anchor}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded border border-border bg-panel px-3 py-1 text-xs text-text hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>
                <T es={it.es} en={it.en} />
              </span>
              {it.count != null && (
                <span className="font-mono text-muted">{it.count}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
