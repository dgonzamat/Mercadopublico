/**
 * Contador de visitas por país (Cloudflare Worker · web/workers/visitors).
 *
 * Tras desplegar el Worker, define su URL en el entorno de build:
 *     NEXT_PUBLIC_VISITORS_WORKER_URL=https://uap-visitors.<sub>.workers.dev
 *
 * Vacío = la página /visitantes muestra "no configurado" y el beacon no hace
 * nada (no rompe el sitio). La barra final se elimina para poder hacer
 * `${VISITORS_WORKER_URL}/stats`.
 */
export const VISITORS_WORKER_URL = (
  process.env.NEXT_PUBLIC_VISITORS_WORKER_URL || ""
).replace(/\/$/, "");

/** Respuesta de `GET /stats` del Worker. */
export interface VisitorStats {
  /** Total de visitas acumuladas (suma de todos los países). */
  total: number;
  /** Mapa código ISO-2 → nº de visitas (incluye "XX" = desconocido). */
  countries: Record<string, number>;
  /** ISO timestamp de la respuesta. */
  updated: string;
}
