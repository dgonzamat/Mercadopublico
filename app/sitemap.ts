import type { MetadataRoute } from "next";
import { cases, patterns, researchers } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://uap-atlas.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/cases",
    "/atlas",
    "/patterns",
    "/frameworks",
    "/researchers",
    "/about",
    "/resumen",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1.0 : 0.8,
  }));

  const caseRoutes = cases.map((c) => ({
    url: `${SITE_URL}/cases/${c.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const patternRoutes = patterns.map((p) => ({
    url: `${SITE_URL}/patterns/${p.letter}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const researcherRoutes = researchers.map((r) => ({
    url: `${SITE_URL}/researchers/${r.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...caseRoutes,
    ...patternRoutes,
    ...researcherRoutes,
  ];
}
