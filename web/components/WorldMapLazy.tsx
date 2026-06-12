"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { T } from "@/components/T";

// Wrapper cliente para el mapa Leaflet. Desde Next 15/16, `ssr: false` con
// next/dynamic solo se permite dentro de un client component — el server
// component de /atlas importa este wrapper en vez de hacer el dynamic ahí.
const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] min-h-[360px] items-center justify-center rounded-lg border border-border bg-panel text-muted md:h-[600px]">
      <T es="Cargando mapa…" en="Loading map…" />
    </div>
  ),
});

export function WorldMapLazy(props: ComponentProps<typeof WorldMap>) {
  return <WorldMap {...props} />;
}
