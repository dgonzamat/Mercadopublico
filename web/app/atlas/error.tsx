"use client";

import Link from "next/link";
import { T } from "@/components/T";

// Error boundary del segmento /atlas. Si el mapa (Leaflet, client-only)
// lanza un error en runtime, mostramos un fallback con reintento en vez de
// una pantalla en blanco. No captura un crash de proceso por OOM, pero sí
// cualquier excepción de render del cliente.
export default function AtlasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <T
          es="Puede ser un problema de memoria del navegador. Reintenta, o abre el listado de casos."
          en="It may be a browser memory issue. Try again, or open the case list."
        />
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          onClick={reset}
          className="inline-flex min-h-[44px] items-center border-l-4 border-text bg-accent px-5 font-display text-base font-medium text-bg hover:bg-text"
        >
          <T es="Reintentar" en="Try again" />
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
