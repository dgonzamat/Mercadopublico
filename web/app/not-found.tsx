import type { Metadata } from "next";
import { LocaleLink } from "@/components/LocaleLink";
import { T } from "@/components/T";
import { STATS } from "@/lib/siteStats";

// GitHub Pages sirve este 404.html para cualquier URL inexistente, en la raíz
// inglesa y en /es/. Por eso va bilingüe con <T> sin locale (el chrome fija
// data-locale según la URL pedida) y con LocaleLink, que en /es/ apunta al
// espejo. Hasta nov 2026 estaba entero en español.
export const metadata: Metadata = {
  title: "Page not found (404)",
  description: "The page you are looking for does not exist or has moved.",
  robots: { index: false, follow: false },
};

// Rutas en español que el sitio nunca tuvo pero que la gente escribe o comparte:
// /casos/<id> (y /es/casos/, /caso/) llegaban aquí; en el panel de visitas del
// 25 nov 2026, /casos/catalina-1953 era la página más vista, con 5 de 38. El
// espejo español vive en /es/cases/<id>/, así que el 404 reenvía allí antes de
// pintarse. Script en línea y no un client component: corre sin hidratar.
const SPANISH_PATH_REDIRECT = `(function(){var m=location.pathname.match(/^\\/(?:es\\/)?casos?\\/([a-z0-9-]+)\\/?$/);if(m)location.replace("/es/cases/"+m[1]+"/"+location.search+location.hash);})();`;

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <script dangerouslySetInnerHTML={{ __html: SPANISH_PATH_REDIRECT }} />
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        <T es="Error 404 · Página no encontrada" en="Error 404 · Page not found" />
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-text">
        <T es="Esta entrada no existe en el corpus." en="This entry does not exist in the corpus." />
      </h1>
      <p className="mt-4 text-muted">
        <T
          es={`O lo borramos al limpiar el archivo. Si buscabas un caso específico, prueba la lista completa de los ${STATS.cases}.`}
          en={`Or we removed it while cleaning up the archive. If you were looking for a specific case, try the full list of ${STATS.cases}.`}
        />
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LocaleLink
          href="/"
          className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-text"
        >
          <T es="Volver al inicio" en="Back to home" />
        </LocaleLink>
        <LocaleLink
          href="/cases"
          className="rounded-none border border-border px-4 py-2 text-sm text-text hover:bg-panel"
        >
          <T es={`Ver los ${STATS.cases} casos`} en={`See the ${STATS.cases} cases`} />
        </LocaleLink>
      </div>
    </div>
  );
}
