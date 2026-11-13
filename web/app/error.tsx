"use client";

import Link from "next/link";
import { T } from "@/components/T";
import { useChunkReload } from "@/lib/chunkReload";

// Error boundary de todas las páginas (el Atlas tiene el suyo). Sin él, un
// chunk borrado por un deploy (el visor PDF de una ficha, el laboratorio)
// tumbaba la página entera con la pantalla genérica de Next, en inglés.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunk = useChunkReload(error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="font-display text-2xl text-text md:text-3xl">
        <T
          es="No se pudo cargar la página"
          en="The page couldn't load"
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
            es="Reintenta, o vuelve al listado de casos."
            en="Try again, or go back to the case list."
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
