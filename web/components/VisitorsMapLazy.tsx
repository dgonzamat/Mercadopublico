"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { T } from "@/components/T";

// Wrapper cliente para el mapa Leaflet de visitantes. `ssr: false` con
// next/dynamic debe vivir dentro de un client component (Next 15/16).
const VisitorsMap = dynamic(() => import("@/components/VisitorsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[46vh] min-h-[300px] items-center justify-center rounded-lg border border-border bg-panel text-muted md:h-[440px]">
      <T es="Cargando mapa…" en="Loading map…" />
    </div>
  ),
});

export function VisitorsMapLazy(props: ComponentProps<typeof VisitorsMap>) {
  return <VisitorsMap {...props} />;
}
