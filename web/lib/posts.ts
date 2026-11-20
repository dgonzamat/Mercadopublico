import postsData from "@/data/posts.json";
import type { Post } from "./types";

// Newest first for listing; source order is by `num` (build-posts.mjs).
export const posts = (postsData as Post[])
  .slice()
  .sort((a, b) => b.num - a.num);

export function getPost(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}

/** Etiquetas de los posts en inglés (nov 2026): se mostraban en español en la
 *  ruta inglesa. Una etiqueta sin traducción se muestra tal cual. */
const TAG_EN: Record<string, string> = {
  meta: "meta",
  metodología: "methodology",
  MECE: "MECE",
  institucional: "institutional",
  Latinoamérica: "Latin America",
  análisis: "analysis",
  calibración: "calibration",
  radar: "radar",
  disclosure: "disclosure",
  probabilidades: "probabilities",
};

export function tagLabel(tag: string, locale: "es" | "en"): string {
  return locale === "en" ? TAG_EN[tag] ?? tag : tag;
}
