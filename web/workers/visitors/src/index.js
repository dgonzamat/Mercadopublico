/* eslint-disable */
// UAP Codex · contador de visitas por país (Cloudflare Worker).
// -----------------------------------------------------------------------------
// Lee `request.cf.country` —que Cloudflare rellena gratis con el país del
// visitante por IP— y lleva la cuenta acumulada en un namespace de Workers KV.
//
// Rutas:
//   POST|GET /hit    -> incrementa el contador del país del visitante; 204
//   GET      /stats  -> { total, updated, countries: { "US": 123, ... } } (JSON)
//   OPTIONS  *       -> preflight CORS
//
// CORS abierto (*) porque /stats expone solo agregados públicos (cuentas por
// país, sin IPs ni datos personales) y /hit no devuelve nada.
//
// CAVEAT de exactitud: el contador usa un único blob JSON con lectura-
// modificación-escritura. Bajo alta concurrencia dos /hit simultáneos pueden
// pisarse y perder algún incremento. Es una métrica de vanidad (visitas por
// país), no contabilidad. Si se quisiera exactitud estricta, migrar a Durable
// Objects. Para el tráfico de este sitio, KV es más que suficiente.

const KEY = "counts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, extraHeaders) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS,
      ...(extraHeaders || {}),
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // --- incrementar ---------------------------------------------------------
    if (url.pathname === "/hit") {
      const raw = (request.cf && request.cf.country) || "XX";
      // Solo códigos ISO-2 válidos; "T1" (Tor) y desconocidos van a "XX".
      const cc = /^[A-Z]{2}$/.test(raw) && raw !== "T1" ? raw : "XX";

      const stored = await env.VISITS.get(KEY);
      const counts = stored ? JSON.parse(stored) : {};
      counts[cc] = (counts[cc] || 0) + 1;
      await env.VISITS.put(KEY, JSON.stringify(counts));

      return new Response(null, { status: 204, headers: CORS });
    }

    // --- leer agregados ------------------------------------------------------
    if (url.pathname === "/stats") {
      const stored = await env.VISITS.get(KEY);
      const counts = stored ? JSON.parse(stored) : {};
      let total = 0;
      for (const k in counts) total += counts[k];
      return json(
        { total, countries: counts, updated: new Date().toISOString() },
        { "Cache-Control": "public, max-age=60" },
      );
    }

    return new Response("UAP Codex · visitors counter (use /hit or /stats)", {
      status: 200,
      headers: CORS,
    });
  },
};
