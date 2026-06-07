"use client";

import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cases } from "@/lib/data";
import { T } from "@/components/T";

type Tier = "S" | "A" | "B";

// Colores del tema (tailwind.config: tierS/A/B). Antes el mapa usaba otros.
const TIERS: { key: Tier; color: string; es: string; en: string }[] = [
  { key: "S", color: "#8b0000", es: "Sólido (S)", en: "Solid (S)" },
  { key: "A", color: "#b86b1f", es: "Aceptable (A)", en: "Acceptable (A)" },
  { key: "B", color: "#1e4f8b", es: "Folklórico (B)", en: "Folkloric (B)" },
];
const TIER_COLOR: Record<Tier, string> = { S: "#8b0000", A: "#b86b1f", B: "#1e4f8b" };

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function WorldMap() {
  const [active, setActive] = useState<Record<Tier, boolean>>({
    S: true,
    A: true,
    B: true,
  });
  const counts: Record<Tier, number> = {
    S: cases.filter((c) => c.tier === "S").length,
    A: cases.filter((c) => c.tier === "A").length,
    B: cases.filter((c) => c.tier === "B").length,
  };
  const shown = cases.filter((c) => active[c.tier]);
  const toggle = (t: Tier) => setActive((a) => ({ ...a, [t]: !a[t] }));

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2 text-xs"
        role="group"
        aria-label="Filtro por nivel de evidencia"
      >
        {TIERS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => toggle(t.key)}
            aria-pressed={active[t.key]}
            className={`inline-flex min-h-[36px] items-center gap-2 rounded border px-2.5 py-1 font-mono transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active[t.key]
                ? "border-border bg-panel text-muted"
                : "border-border/40 bg-transparent text-muted/40"
            }`}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: t.color,
                opacity: active[t.key] ? 1 : 0.25,
              }}
            />
            <span className={active[t.key] ? "" : "line-through"}>
              <T
                es={`${t.es} · ${counts[t.key]} casos`}
                en={`${t.en} · ${counts[t.key]} cases`}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
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
          {shown.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.location.lat, c.location.lng]}
              radius={Math.max(4, c.probability / 12)}
              pathOptions={{
                color: TIER_COLOR[c.tier],
                fillColor: TIER_COLOR[c.tier],
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
                    <span aria-hidden>{c.flag} </span>
                    {c.name}
                  </strong>
                  <br />
                  {c.country_name} · {c.year_start} · Tier {c.tier} ·{" "}
                  {c.probability}%
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
