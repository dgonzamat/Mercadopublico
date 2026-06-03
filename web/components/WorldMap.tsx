"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cases } from "@/lib/data";

const tierColors = {
  S: "#ff4d4d",
  A: "#ffb347",
  B: "#7fdbff",
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function WorldMap() {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom
      style={{ height: "600px", width: "100%", background: "#0a0a0f" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {cases.map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.location.lat, c.location.lng]}
          radius={Math.max(4, c.probability / 12)}
          pathOptions={{
            color: tierColors[c.tier],
            fillColor: tierColors[c.tier],
            fillOpacity: 0.6,
            weight: 1,
          }}
          eventHandlers={{
            click: () => {
              window.location.href = `${basePath}/cases/${c.id}/`;
            },
          }}
        >
          <Tooltip>
            <div style={{ fontFamily: "monospace", fontSize: 12 }}>
              <strong>
                <span aria-hidden>{c.flag} </span>{c.name}
              </strong>
              <br />
              {c.country_name} · {c.year_start} · Tier {c.tier} · {c.probability}%
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
