"use client";

import Link from "next/link";
import { T } from "@/components/T";
import { useChunkReload } from "@/lib/chunkReload";

// Error boundary del segmento /atlas. Si el mapa (Leaflet, client-only)
// lanza un error en runtime, mostramos un fallback con reintento en vez de
// una pantalla en blanco. No captura un crash de proceso por OOM, pero sí
// cualquier excepción de render del cliente. Si el error es un chunk borrado
// por un deploy, recarga (ver lib/chunkReload).
export default function AtlasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunk = useChunkReload(error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T es="Mapa" en="Map" />
      </p>
      <h1 className="font-display text-2xl text-text md:text-3xl">
        <T
          es="No se pudo cargar el mapa"
          en="The map couldn't load"
        />
      </h1>
      <p className="max-w-md text-muted">
        {chunk ? (
          <T
            es="El sitio se actualizó mientras tenías la página abierta. Recarga para ver la versión nueva."
            en="The site was updated while you had the page open. Reload to get the new version."
          />
        ) : (
          <T
            es="Puede ser un problema de memoria del navegador. Reintenta, o abre el listado de casos."
            en="It may be a browser memory issue. Try again, or open the case list."
          />
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          onClick={chunk ? () => window.location.reload() : reset}
          className="inline-flex min-h-[44px] items-center border-l-4 border-text bg-accent px-5 font-display text-base font-medium text-bg hover:bg-text"
        >
          {chunk ? <T es="Recargar" en="Reload" /> : <T es="Reintentar" en="Try again" />}
        </button>
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-5 text-text hover:border-accent/50"
        >
          <T es="Ver los casos →" en="See the cases →" />
        </Link>
      </div>
    </div>
  );
}
