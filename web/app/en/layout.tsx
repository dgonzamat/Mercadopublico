import type { ReactNode } from "react";

/**
 * Layout de las rutas en inglés (/en/…) — PRUEBA DE CONCEPTO (Fase 1, solo
 * /en/cases/). Fija `data-locale="en"` en un wrapper server-side, así el CSS
 * bilingüe (`app/globals.css`, selector por ancestro) muestra el inglés en el
 * HTML ESTÁTICO — sin depender del toggle cliente ni de JS. Reutiliza los
 * mismos componentes de caso (que renderizan ambos idiomas vía `<T>`); el
 * wrapper decide cuál se ve.
 *
 * Limitaciones conocidas de la fase 1 (a resolver en el roll-out):
 * - El chrome (header/footer del root layout) queda fuera de este wrapper, así
 *   que se ve en ES sobre las páginas /en/.
 * - Los links internos de los componentes reutilizados apuntan a las URLs ES
 *   (/cases/…), no a /en/cases/… — se harán locale-aware en la Fase 2.
 */
export default function EnLayout({ children }: { children: ReactNode }) {
  return (
    <div data-locale="en" lang="en">
      {children}
    </div>
  );
}
