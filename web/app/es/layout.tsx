import type { ReactNode } from "react";

/**
 * Layout del espejo español (/es/…). Fija `data-locale="es"` en un wrapper
 * server-side, así el CSS bilingüe (`app/globals.css`, selector por ancestro)
 * muestra el español en el HTML ESTÁTICO — sin depender del toggle cliente ni
 * de JS. Reutiliza los mismos componentes raíz (que renderizan ambos idiomas
 * vía `<T>`); el wrapper decide cuál se ve. El inglés es el idioma primario de
 * la raíz; este espejo sirve el español indexable.
 */
export default function EsLayout({ children }: { children: ReactNode }) {
  return (
    <div data-locale="es" lang="es">
      {children}
    </div>
  );
}
