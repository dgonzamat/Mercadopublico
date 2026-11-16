// Mapa de la región del suceso: un SVG estático por ficha e idioma, generado en
// el build (cero JS en la página, sin teselas ni servicios externos). Corre en
// prebuild tras build-cases; escribe en public/maps/{es,en}/<id>.svg (gitignored).
//
// Respeta location.precision (16 nov 2026): «exact» dibuja el punto, «approx»
// una zona sin punto, «none» no genera mapa. La sonda E61 de audit-consistency
// vigila que la precisión case con lo que dice el lugar.
//
// Contornos y fronteras: Natural Earth 1:50m vía world-atlas (dominio público).
// A la escala del mapa (unos 450 km de radio) su error de pocos kilómetros no
// se ve; los nombres de país en español salen del mismo diccionario del sitio
// (lib/i18n-geo.ts), parseado y no duplicado.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { geoAzimuthalEqualArea, geoOrthographic, geoPath, geoCircle, geoDistance, geoGraticule10, geoBounds } from "d3-geo";
import { feature, mesh } from "topojson-client";

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const world = require("world-atlas/countries-50m.json");
const world110 = require("world-atlas/countries-110m.json");
const land = feature(world, world.objects.land);
const borders = mesh(world, world.objects.countries, (a, b) => a !== b);
const countries = feature(world, world.objects.countries).features;
const land110 = feature(world110, world110.objects.land);
// Estados de EE. UU. (us-atlas, Census Bureau, dominio público): un tercio de
// las fichas están en EE. UU. y, sin los estados, el mapa de una ficha del
// interior era tierra lisa (Mantell, nov 2026).
const usTopo = require("us-atlas/states-10m.json");
const usStates = feature(usTopo, usTopo.objects.states).features;
const usStateLines = mesh(usTopo, usTopo.objects.states, (a, b) => a !== b);
const STATE_ES = { "New Mexico": "Nuevo México", "New York": "Nueva York", "New Jersey": "Nueva Jersey", "New Hampshire": "Nuevo Hampshire", "North Carolina": "Carolina del Norte", "South Carolina": "Carolina del Sur", "North Dakota": "Dakota del Norte", "South Dakota": "Dakota del Sur", Pennsylvania: "Pensilvania", Hawaii: "Hawái", Louisiana: "Luisiana", Mississippi: "Misisipi", Missouri: "Misuri", Oregon: "Oregón", "West Virginia": "Virginia Occidental", Michigan: "Míchigan", "District of Columbia": "Distrito de Columbia" };
// Caja de cada país, para descartar rápido los que no tocan el encuadre.
const boxes = countries.map((f) => geoBounds(f));
const stateBoxes = usStates.map((f) => geoBounds(f));
// Tierra y fronteras recortadas a la región antes de proyectar: proyectar el
// mundo entero en cada uno de los ~750 mapas llevaba minutos.
const landPolys = (land.features ?? [land]).flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates));
const landParts = landPolys.map((poly) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: poly }, bbox: geoBounds({ type: "Polygon", coordinates: poly }) }));
const borderParts = borders.coordinates.map((line) => ({ type: "LineString", coordinates: line, bbox: geoBounds({ type: "LineString", coordinates: line }) }));
const near = (bbox, lat, lng, padDeg) => {
  const [[w, s], [e, n]] = bbox;
  if (s - padDeg > lat || n + padDeg < lat) return false;
  if (w <= e) return lng >= w - padDeg / Math.max(0.2, Math.cos((lat * Math.PI) / 180)) && lng <= e + padDeg / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  return true; // cruza el antimeridiano
};

const geoSrc = fs.readFileSync(path.join(ROOT, "lib/i18n-geo.ts"), "utf8");
const EN_TO_ES = { "United States of America": "Estados Unidos", "Dem. Rep. Congo": "R. D. del Congo" };
for (const m of geoSrc.matchAll(/^\s*(?:"([^"]+)"|([\p{L} .]+)):\s*"([^"]+)",/gmu)) EN_TO_ES[m[3]] ??= m[1] ?? m[2];
if (Object.keys(EN_TO_ES).length < 50) {
  console.error("build-maps: el diccionario de países de lib/i18n-geo.ts rindió menos de 50 entradas");
  process.exit(1);
}
const EN_NAME = { "United States of America": "United States", "Dem. Rep. Congo": "DR Congo" };

const casesDir = path.join(ROOT, "data/cases");
const cases = fs.readdirSync(casesDir).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf8")));

// Tokens del sitio (tailwind.config.ts).
const C = { bg: "#f7f2e8", panel: "#ede6d4", border: "#c4b89d", text: "#1a1a1a", muted: "#615a4d", accent: "#c41e3a", sea: "#dde3e1" };
const R_EARTH = 6371;
const W = 640, H = 360;
const RADIUS_KM = 450;
const APPROX_KM = 90;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const FONT = 'font-family="Inter, system-ui, sans-serif"';

// Trazo que descarta los puntos a menos de `min` px del anterior: el globo mide
// 76 px y su contorno a escala 1:110m traía unos 20 KB de puntos encimados.
function coarsePath(projection, min = 1.5) {
  return (obj) => {
    let d = "", lx = null, ly = null, first = null;
    const ctx = {
      moveTo(x, y) { d += `M${Math.round(x)},${Math.round(y)}`; lx = x; ly = y; first = [x, y]; },
      lineTo(x, y) { if (Math.hypot(x - lx, y - ly) >= min) { d += `L${Math.round(x)},${Math.round(y)}`; lx = x; ly = y; } },
      closePath() { d += "Z"; },
      arc() {},
    };
    geoPath(projection, ctx)(obj);
    return d;
  };
}

function niceKm(km) {
  return [10, 20, 25, 50, 100, 200, 250, 500, 1000].reduce((best, s) => (s <= km ? s : best), 10);
}

function regionMap(c, locale) {
  const { lat, lng, precision } = c.location;
  const center = [lng, lat];
  const deg = (km) => (km / R_EARTH) * (180 / Math.PI);
  const proj = geoAzimuthalEqualArea().rotate([-lng, -lat])
    .fitExtent([[0, 0], [W, H]], geoCircle().center(center).radius(deg(RADIUS_KM))())
    .clipExtent([[-2, -2], [W + 2, H + 2]]);
  const p = geoPath(proj).digits(0);
  const [x, y] = proj(center);
  const pxKm = (proj([lng + 1, lat])[0] - x) / (111.32 * Math.cos((lat * Math.PI) / 180));
  const barKm = niceKm((W * 0.18) / pxKm);
  const barPx = barKm * pxKm;

  const pad = deg(RADIUS_KM * 1.8);
  const landHere = { type: "FeatureCollection", features: landParts.filter((f) => near(f.bbox, lat, lng, pad)) };
  const bordersHere = { type: "MultiLineString", coordinates: borderParts.filter((l) => near(l.bbox, lat, lng, pad)).map((l) => l.coordinates) };
  const nearCases = cases.filter((o) => o.id !== c.id && o.location?.precision === "exact" && geoDistance(center, [o.location.lng, o.location.lat]) * R_EARTH < RADIUS_KM * 1.3)
    .map((o) => proj([o.location.lng, o.location.lat]))
    .filter((pt) => pt && pt[0] > 4 && pt[0] < W - 4 && pt[1] > 4 && pt[1] < H - 4);

  const labels = countries.map((f, i) => {
    if (!near(boxes[i], lat, lng, pad) || p.area(f) < 2500) return null;
    const pt = p.centroid(f);
    if (!(pt[0] > 40 && pt[0] < W - 100 && pt[1] > 20 && pt[1] < H - 30)) return null;
    // Junto al punto, el rótulo del país baja para no taparlo.
    const ly = Math.hypot(pt[0] - x, pt[1] - y) < 40 ? Math.min(H - 40, y + 46) : pt[1];
    const name = f.properties.name;
    return { name: locale === "es" ? EN_TO_ES[name] ?? name : EN_NAME[name] ?? name, x: pt[0], y: ly, size: 11 };
  }).filter(Boolean);
  const stateLabels = usStates.map((f, i) => {
    if (!near(stateBoxes[i], lat, lng, pad) || p.area(f) < 1800) return null;
    const pt = p.centroid(f);
    if (!(pt[0] > 30 && pt[0] < W - 100 && pt[1] > 20 && pt[1] < H - 30)) return null;
    const ly = Math.hypot(pt[0] - x, pt[1] - y) < 34 ? Math.min(H - 40, y + 40) : pt[1];
    const name = f.properties.name;
    return { name: locale === "es" ? STATE_ES[name] ?? name : name, x: pt[0], y: ly, size: 9.5 };
  }).filter(Boolean);
  const hasStates = stateLabels.length > 0 || usStates.some((f, i) => near(stateBoxes[i], lat, lng, 0));
  if (hasStates) for (const l of labels) if (l.name === "Estados Unidos" || l.name === "United States") l.drop = true;

  const placeFull = (locale === "es" ? c.location.place : c.location.place_en ?? c.location.place) ?? "";
  const place = placeFull.split(/[,(]/)[0].trim();
  const right = x < W - 200;
  const tx = right ? x + 12 : x - 12;
  const anchor = right ? "start" : "end";

  const g = geoOrthographic().rotate([-lng, -lat * 0.6]).scale(38).translate([W - 50, 50]).clipAngle(90);
  const gp = coarsePath(g);
  const [gx, gy] = g(center);

  const mark = precision === "exact"
    ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="${C.accent}" opacity="0.15"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="${C.accent}" stroke="${C.bg}" stroke-width="2"/>`
    : `<path d="${p(geoCircle().center(center).radius(deg(APPROX_KM))())}" fill="${C.accent}" fill-opacity="0.12" stroke="${C.accent}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
  const label = place
    ? `<text x="${tx.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" ${FONT} font-size="13" font-weight="600" fill="${C.text}" stroke="${C.bg}" stroke-width="3" paint-order="stroke">${esc(place)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.sea}"/>
<path d="${p(geoGraticule10())}" fill="none" stroke="${C.border}" stroke-width="0.4" opacity="0.6"/>
<path d="${p(landHere)}" fill="${C.panel}" stroke="${C.muted}" stroke-width="0.6"/>
<path d="${p(bordersHere)}" fill="none" stroke="${C.muted}" stroke-width="0.6" stroke-dasharray="3 2"/>
${nearCases.map(([nx, ny]) => `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="3" fill="${C.muted}" opacity="0.55"/>`).join("")}
${hasStates ? `<path d="${p(usStateLines)}" fill="none" stroke="${C.muted}" stroke-width="0.4" stroke-dasharray="2 2" opacity="0.8"/>` : ""}
${[...labels.filter((l) => !l.drop), ...stateLabels].map((l) => `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="middle" ${FONT} font-size="${l.size}" letter-spacing="1.2" fill="${C.muted}">${esc(l.name.toUpperCase())}</text>`).join("")}
${mark}
${label}
<g transform="translate(16 ${H - 22})" ${FONT} font-size="11" fill="${C.text}">
<rect width="${barPx.toFixed(1)}" height="4" fill="${C.text}"/>
<rect x="${(barPx / 2).toFixed(1)}" width="${(barPx / 2).toFixed(1)}" height="4" fill="${C.bg}" stroke="${C.text}" stroke-width="0.8"/>
<text y="-5">${barKm} km</text>
</g>
<circle cx="${W - 50}" cy="50" r="38" fill="${C.sea}" stroke="${C.muted}" stroke-width="0.8"/>
<path d="${gp(land110)}" fill="${C.panel}" stroke="${C.muted}" stroke-width="0.4"/>
<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="3" fill="${C.accent}"/>
</svg>
`;
}

const outRoot = path.join(ROOT, "public/maps");
fs.rmSync(outRoot, { recursive: true, force: true });
let n = 0;
for (const locale of ["es", "en"]) {
  fs.mkdirSync(path.join(outRoot, locale), { recursive: true });
  for (const c of cases) {
    if (!c.location || c.location.precision === "none") continue;
    fs.writeFileSync(path.join(outRoot, locale, `${c.id}.svg`), regionMap(c, locale));
    n++;
  }
}
console.log(`build-maps: ${n} mapas (${n / 2} fichas × 2 idiomas) en public/maps/`);
