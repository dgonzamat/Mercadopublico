import type { ReactNode } from "react";

/**
 * Bilingual text primitive — renders both languages as sibling spans.
 * CSS in globals.css shows only the active locale (via `[data-locale]`
 * attribute on the html element, set by LocaleToggle).
 *
 * SSG-compatible: zero runtime, pure server render.
 *
 * Usage:
 *   <T es="Hola" en="Hello" />
 *   <T es={<>multi <strong>nodes</strong></>} en={<>multi <strong>nodes</strong></>} />
 */
export function T({ es, en }: { es: ReactNode; en: ReactNode }) {
  return (
    <>
      <span lang="es" data-lang="es">{es}</span>
      <span lang="en" data-lang="en">{en}</span>
    </>
  );
}
