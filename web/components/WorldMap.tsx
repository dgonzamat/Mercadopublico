"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cases } from "@/lib/data";
import { T } from "@/components/T";

type Tier = "S" | "A" | "B";

// Colores del tema (tailwind.config: tierS/A/B). Antes el mapa usaba otros.
const TIERS: { key: Tier; color: string; es: string; en: string }[] = [
  { key: "S", color: "#8b0000", es: "Sólido (S)", en: "Solid (S)" },
  { key: "A", color: "#9c5a18", es: "Aceptable (A)", en: "Acceptable (A)" },
  { key: "B", color: "#1e4f8b", es: "Folklórico (B)", en: "Folkloric (B)" },
];
const TIER_COLOR: Record<Tier, string> = { S: "#8b0000", A: "#9c5a18", B: "#1e4f8b" };

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type ResearcherRef = { id: string; name: string };

/** Encuadra el mapa al país elegido; vuelve a la vista mundial en "all". */
function FitBounds({
  points,
  depKey,
}: {
  points: [number, number][];
  depKey: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (depKey.startsWith("all|") || points.length === 0) {
      map.setView([20, 0], 2);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 6);
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 7 });
    // `points` cambia de identidad cada render; el gatillo real es `depKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, map]);
  return null;
}

export default function WorldMap({
  countryResearchers,
}: {
  countryResearchers: Record<string, ResearcherRef[]>;
}) {
  const [active, setActive] = useState<Record<Tier, boolean>>({
    S: true,
    A: true,
    B: true,
  });
  const [country, setCountry] = useState<string>("all");
  const counts: Record<Tier, number> = {
    S: cases.filter((c) => c.tier === "S").length,
    A: cases.filter((c) => c.tier === "A").length,
    B: cases.filter((c) => c.tier === "B").length,
  };
  const countryOptions = Object.values(
    cases.reduce<
      Record<string, { code: string; name: string; n: number }>
    >((by, c) => {
      (by[c.country] ??= {
        code: c.country,
        name: c.country_name,
        n: 0,
      }).n++;
      return by;
    }, {}),
  ).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const shown = cases.filter(
    (c) => active[c.tier] && (country === "all" || c.country === country),
  );
  const points = shown.map(
    (c) => [c.location.lat, c.location.lng] as [number, number],
  );
  const assocResearchers =
    country === "all" ? [] : countryResearchers[country] ?? [];
  const depKey = `${country}|${active.S ? 1 : 0}${active.A ? 1 : 0}${active.B ? 1 : 0}`;
  const toggle = (t: Tier) => setActive((a) => ({ ...a, [t]: !a[t] }));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          <T es="Filtrar por nivel de evidencia" en="Filter by evidence level" />
        </span>
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
            className={`inline-flex min-h-[44px] items-center gap-2 border px-3 py-1.5 font-mono transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active[t.key]
                ? "border-accent/40 bg-panel text-text"
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
      </div>

      <div className="space-y-2">
        <label
          htmlFor="atlas-country"
          className="block font-mono text-xs uppercase tracking-widest text-muted"
        >
          <T es="Filtrar por país" en="Filter by country" />
        </label>
        <select
          id="atlas-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="block w-full max-w-xs border border-border bg-panel px-3 py-2 font-mono text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="all">{`Todos · ${cases.length}`}</option>
          {countryOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {`${o.name} · ${o.n}`}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[60vh] min-h-[360px] overflow-hidden border border-border md:h-[600px]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom
          // preferCanvas: renderiza los ~177 marcadores en un único canvas en
          // vez de un nodo SVG por marcador. Baja drásticamente el uso de
          // memoria/DOM y evita el crash del renderer en móviles con poca RAM.
          preferCanvas
          style={{ height: "100%", width: "100%", background: "#e8e4da" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds points={points} depKey={depKey} />
          {shown.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.location.lat, c.location.lng]}
              radius={Math.max(4, c.probability / 12)}
              pathOptions={{
                color: TIER_COLOR[c.tier],
                fillColor: TIER_COLOR[c.tier],
                fillOpacity: 0.75,
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
                  <strong>{c.name}</strong>
                  <br />
                  {c.country_name} · {c.year_start} · Tier {c.tier} ·{" "}
                  {c.probability}%
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* AT-3 · la codificación central del mapa, explicada en una línea */}
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        <T
          es="○ tamaño = probabilidad del caso · color = nivel de evidencia"
          en="○ size = case probability · color = evidence level"
        />
      </p>

      {country !== "all" && (
        <div className="space-y-2">
          <span className="block font-mono text-xs uppercase tracking-widest text-muted">
            <T es="Actores asociados" en="Associated actors" />
          </span>
          {assocResearchers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assocResearchers.map((r) => (
                <a
                  key={r.id}
                  href={`${basePath}/researchers/${r.id}/`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 border border-border bg-panel px-3 py-1.5 text-sm text-text transition hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {r.name}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              <T
                es="Ningún investigador del corpus está asociado a casos de este país."
                en="No researcher in the corpus is associated with cases from this country."
              />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
