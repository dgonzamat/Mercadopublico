import atlasPointsData from "@/data/atlas-points.json";

/**
 * Dataset MÍNIMO para el mapa del Atlas (WorldMap, client component).
 *
 * WorldMap solo usa coords + un puñado de labels; no renderiza prosa, summary,
 * evidence, sources ni posterior. Antes importaba `casesClient` (~1.5 MB) y
 * arrastraba todo eso al chunk de /atlas. Esta proyección (id, name, tier,
 * country, country_name, year_start, probability, location) la genera
 * scripts/build-cases.mjs a data/atlas-points.json (~60 KB, artefacto
 * gitignored) — solo lo que el marcador, el tooltip y el filtro necesitan.
 */
export type AtlasPoint = {
  id: string;
  name: string;
  tier: "S" | "A" | "B";
  country: string;
  country_name: string;
  year_start: number;
  probability: number;
  location: { lat: number; lng: number };
};

export const atlasPoints = atlasPointsData as AtlasPoint[];
