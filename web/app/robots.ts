import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Requerido por Next 16 con output: "export" para rutas de metadata.
export const dynamic = "force-static";

/**
 * Crawlers de ENTRENAMIENTO de modelos: se llevan el corpus completo y no
 * devuelven tráfico. Se bloquean.
 *
 * Deliberadamente FUERA de esta lista (deben seguir entrando):
 *  - Googlebot / Bingbot — el canal de búsqueda del sitio.
 *  - OAI-SearchBot, PerplexityBot, ClaudeBot — búsqueda con IA: citan la
 *    fuente y mandan visitas. GA4 ya registra `chatgpt.com / ai-assistant`
 *    como fuente real (jul 2026), así que bloquearlos costaría tráfico.
 *  - Google-Extended NO afecta el ranking en Google: solo excluye del
 *    entrenamiento de Gemini. Bloquearlo es gratis en términos de SEO.
 *
 * Ojo: esto solo detiene a quien respeta robots.txt. El scraper que motivó el
 * tope de pageviews (ráfagas desde datacenters de Singapur; 28 páginas de una
 * sola IP el 19 jul 2026) es anónimo y lo va a ignorar — a ese lo contiene el
 * gate `_tracking_allowed` (deja de contarlo) o una regla de firewall en el
 * edge, no este archivo.
 */
const AI_TRAINING_CRAWLERS = [
  "GPTBot", // OpenAI — entrenamiento (distinto de OAI-SearchBot)
  "CCBot", // Common Crawl — alimenta corpus de terceros
  "Google-Extended", // Gemini — entrenamiento
  "Bytespider", // ByteDance
  "Meta-ExternalAgent", // Meta AI
  "anthropic-ai", // Anthropic — agente de entrenamiento legacy
  "Applebot-Extended", // Apple Intelligence — entrenamiento
  "Omgili", // Webz.io — reventa de datos
  "Diffbot",
  "ImagesiftBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_TRAINING_CRAWLERS, disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
