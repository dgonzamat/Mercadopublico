import { execSync } from "child_process";
import type { MetadataRoute } from "next";
import { cases, patterns, researchers } from "@/lib/data";
import { posts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

// Requerido por Next 16 con output: "export" para rutas de metadata.
export const dynamic = "force-static";

/**
 * Fecha real de última modificación por archivo de datos, vía git.
 *
 * Un solo pase de `git log --name-only` sobre data/ construye el mapa
 * path → fecha del commit más reciente que tocó ese archivo (el log viene
 * newest-first, así que la primera aparición gana). Con esto el sitemap
 * deja de declarar "todo cambió en cada build" — señal que Google descuenta
 * — y le dice exactamente qué casos cambiaron y cuándo.
 *
 * Degradación: en clones shallow (CI de validación usa fetch-depth 1) o si
 * git no está disponible, los archivos sin fecha caen al build time, igual
 * que antes. El deploy real usa fetch-depth: 0, donde el mapa es completo.
 */
function gitLastModified(): Map<string, Date> {
  const map = new Map<string, Date>();
  try {
    const out = execSync(
      "git log --format=%x00%cI --name-only -- web/data data",
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    let current: Date | null = null;
    for (const line of out.split("\n")) {
      if (line.startsWith("\x00")) {
        current = new Date(line.slice(1).trim());
      } else if (line && current) {
        // git reporta paths desde la raíz del repo ("web/data/...");
        // normalizamos al path relativo a web/ que usa el resto del código.
        const rel = line.startsWith("web/") ? line.slice(4) : line;
        if (!map.has(rel)) map.set(rel, current);
      }
    }
  } catch {
    /* sin git o sin historia — fallback a build time */
  }
  return map;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const modified = gitLastModified();
  const dateFor = (path: string) => modified.get(path) ?? now;

  // Última vez que se movió el corpus completo: cota honesta para las rutas
  // estáticas (home, listados) que derivan su contenido de los datos.
  const corpusDates = [...modified.values()];
  const corpusLatest = corpusDates.length
    ? new Date(Math.max(...corpusDates.map((d) => d.getTime())))
    : now;

  // trailingSlash: true en next.config → las URLs servidas terminan en "/".
  // El sitemap debe listar exactamente esas URLs (mismo formato que canonicals).
  const staticRoutes = [
    "/",
    "/cases/",
    "/probabilidades/",
    "/atlas/",
    "/patterns/",
    "/frameworks/",
    "/researchers/",
    "/releases/",
    "/about/",
    "/resumen/",
    "/fuentes/",
    "/blog/",
    "/contact/",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: corpusLatest,
    // Home + /cases + /probabilidades: daily (corpus and disclosure cycle move
    // 2-3 times per week and home reflects the dial). Other static routes:
    // weekly is honest for their actual update rate.
    changeFrequency:
      path === "/" || path === "/cases/" || path === "/probabilidades/"
        ? ("daily" as const)
        : ("weekly" as const),
    priority: path === "/" ? 1.0 : 0.8,
  }));

  const caseRoutes = cases.map((c) => ({
    url: `${SITE_URL}/cases/${c.id}/`,
    lastModified: dateFor(`data/cases/${c.id}.json`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const patternRoutes = patterns.map((p) => ({
    url: `${SITE_URL}/patterns/${p.letter}/`,
    lastModified: dateFor("data/patterns.json"),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const researcherRoutes = researchers.map((r) => ({
    url: `${SITE_URL}/researchers/${r.id}/`,
    lastModified: dateFor("data/researchers.json"),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const postRoutes = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.id}/`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const releaseRoutes = Array.from(
    new Set(cases.flatMap((c) => c.pursueReleases ?? [])),
  )
    .sort((a, b) => a - b)
    .map((n) => ({
      url: `${SITE_URL}/releases/${String(n).padStart(2, "0")}/`,
      lastModified: corpusLatest,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [
    ...staticRoutes,
    ...caseRoutes,
    ...patternRoutes,
    ...researcherRoutes,
    ...postRoutes,
    ...releaseRoutes,
  ];
}
