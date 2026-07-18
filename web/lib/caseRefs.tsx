import type { ReactNode } from "react";
import { LocaleLink } from "@/components/LocaleLink";

/**
 * Enlaza las referencias cruzadas entre casos en la prosa. La convención es el
 * markup `[[slug]]` incrustado en los campos de texto (whatHappened, whyMatters,
 * evidence, summary), que se renderiza como un enlace "↗" al caso destino.
 *
 * Reemplaza la vieja forma numérica "(caso N)", que era texto muerto Y frágil: el
 * "N" era el `num` del caso al momento de escribir la prosa, y dejaba de coincidir
 * cuando el corpus se renumeraba (el desfase no era constante), de modo que un
 * auto-linker por `num` habría enlazado al caso equivocado. El slug es estable: no
 * driftea. La sonda E24 de `audit-consistency.mjs` valida que cada `[[slug]]`
 * resuelve y que no vuelve a aparecer la forma numérica.
 *
 * Es un helper de SERVER COMPONENT (devuelve nodos React sin JS de cliente → no
 * consume del techo de 45 client components, compatible con el static export) y
 * DATA-FREE: el mapa `slug → nombre` (solo para el title/aria-label) se pasa por
 * parámetro, así es seguro alcanzarlo desde cualquier módulo sin arrastrar el
 * corpus al bundle cliente.
 */
const REF = /\[\[([a-z0-9-]+)\]\]/g;

export function linkCaseRefs(
  text: string | undefined | null,
  nameBySlug: Map<string, string>,
): ReactNode {
  if (!text) return text ?? "";
  const src = String(text);
  if (src.indexOf("[[") === -1) return src;

  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const m of src.matchAll(REF)) {
    const slug = m[1];
    const start = m.index;
    if (start > last) parts.push(src.slice(last, start));
    const name = nameBySlug.get(slug) ?? slug;
    parts.push(
      <LocaleLink
        key={key++}
        href={`/cases/${slug}`}
        title={name}
        aria-label={name}
        className="whitespace-nowrap font-medium text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
      >
        ↗
      </LocaleLink>,
    );
    last = start + m[0].length;
  }

  if (last < src.length) parts.push(src.slice(last));
  return parts;
}
