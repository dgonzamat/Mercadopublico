"use client";

import dynamic from "next/dynamic";
import { T } from "@/components/T";

// Recharts y todo el explorador viven sólo en cliente. `ssr: false` con
// next/dynamic debe declararse dentro de un client component (igual que
// WorldMapLazy) — el server component de /laboratorio importa este wrapper.
const DataExplorer = dynamic(() => import("./DataExplorer"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center rounded-lg border border-border bg-panel text-muted">
      <T es="Cargando explorador…" en="Loading explorer…" />
    </div>
  ),
});

export function ExplorerLazy() {
  return <DataExplorer />;
}
