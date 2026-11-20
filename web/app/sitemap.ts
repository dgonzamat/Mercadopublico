import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import type { MetadataRoute } from "next";
import { cases, researchers, entityMorphologies } from "@/lib/data";
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
    "/cobertura/",
    "/atlas/",
    "/frameworks/",
    "/entities/",
    "/researchers/",
    "/releases/",
    "/about/",
    "/resumen/",
    "/fuentes/",
    "/visitantes/",
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

  // Solo formas `present: true` tienen página — mismo criterio que
  // generateStaticParams en app/entities/[slug]/page.tsx.
  const entityRoutes = entityMorphologies
    .filter((f) => f.present)
    .map((f) => ({
      url: `${SITE_URL}/entities/${f.slug}/`,
      lastModified: dateFor("data/entity-morphology.json"),
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

  return withSpanishMirrors([
    ...staticRoutes,
    ...caseRoutes,
    ...entityRoutes,
    ...researcherRoutes,
    ...postRoutes,
    ...releaseRoutes,
  ]);
}

/**
 * Espejo español en el sitemap (nov 2026). Hasta entonces el sitemap listaba
 * solo las URL inglesas: las ~640 páginas /es/ existían con canonical y
 * hreflang propios, pero Google solo podía descubrirlas por esos enlaces. Cada
 * URL con espejo lleva ahora su gemela /es/ y las dos declaran las alternativas
 * por idioma (xhtml:link), igual que el hreflang de la página (`hreflangFor`).
 *
 * Qué secciones tienen espejo se lee de `app/es/<sección>` en el build, la
 * misma fuente que vigila E23 frente a MIRRORED, para que no haya una tercera
 * lista que mantener (atlas, fuentes, visitantes y contact no tienen espejo).
 */
function withSpanishMirrors(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const esDir = path.join(process.cwd(), "app", "es");
  const hasMirror = (url: string) => {
    const section = url.slice(SITE_URL.length).split("/")[1] ?? "";
    return section === "" || fs.existsSync(path.join(esDir, section));
  };
  return entries.flatMap((e) => {
    if (!hasMirror(e.url)) return [e];
    const enPath = e.url.slice(SITE_URL.length);
    const languages = {
      en: e.url,
      es: `${SITE_URL}/es${enPath}`,
      "x-default": e.url,
    };
    return [
      { ...e, alternates: { languages } },
      { ...e, url: languages.es, alternates: { languages } },
    ];
  });
}
