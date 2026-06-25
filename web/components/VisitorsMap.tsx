"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { T } from "@/components/T";
import { COUNTRY_CENTROIDS } from "@/lib/countryCentroids";
import { flagEmoji, countryName } from "@/lib/visitorsFormat";

export interface VisitorPoint {
  country: string;
  count: number;
}

/**
 * Mapa de burbujas de visitantes: un punto por país en su centroide, con radio
 * proporcional a las visitas del periodo. Mismo basemap (CARTO light) que /atlas.
 * Se carga vía dynamic import (ssr:false) desde VisitorsMapLazy.
 */
export default function VisitorsMap({
  points,
  max,
}: {
  points: VisitorPoint[];
  max: number;
}) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={1}
      minZoom={1}
      scrollWheelZoom={false}
      worldCopyJump
      className="h-[46vh] min-h-[300px] w-full rounded-lg border border-border md:h-[440px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {points.map((p) => {
        const c = COUNTRY_CENTROIDS[p.country];
        if (!c) return null;
        const radius = 5 + Math.sqrt(Math.max(p.count, 0) / Math.max(max, 1)) * 20;
        return (
          <CircleMarker
            key={p.country}
            center={c}
            radius={radius}
            pathOptions={{
              color: "#c41e3a",
              weight: 1,
              fillColor: "#c41e3a",
              fillOpacity: 0.45,
            }}
          >
            <Tooltip direction="top">
              <span aria-hidden>{flagEmoji(p.country)}</span>{" "}
              <T
                es={countryName(p.country, "es")}
                en={countryName(p.country, "en")}
              />{" "}
              · {p.count.toLocaleString()}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
