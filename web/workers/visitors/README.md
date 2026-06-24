# Contador de visitas por país — Cloudflare Worker

Cuenta el tráfico del sitio **por país**, sin cookies ni datos personales, usando
`request.cf.country` (que Cloudflare rellena gratis) y un namespace de **Workers KV**.

La web (`/visitantes`) hace `fetch` a `/stats` para pintar la tabla, y un beacon
ligero (`components/VisitorBeacon.tsx`) llama a `/hit` una vez por sesión.

Funciona aunque el sitio siga en GitHub Pages: el Worker vive en `*.workers.dev`
y se llama por CORS desde la página estática.

## Despliegue (una vez)

Requisitos: una cuenta de Cloudflare (plan gratuito sirve) y Node.

```bash
cd web/workers/visitors

# 1) Login (abre el navegador)
npx wrangler login

# 2) Crear el namespace KV y copiar el id que imprime
npx wrangler kv namespace create VISITS
#   -> pega ese id en wrangler.toml (campo `id`)

# 3) Desplegar
npx wrangler deploy
#   -> imprime la URL pública, p. ej. https://uap-visitors.TU-SUBDOMINIO.workers.dev
```

## Conectar la web

Pon la URL del Worker en el entorno de build de la web (sin barra final):

```
NEXT_PUBLIC_VISITORS_WORKER_URL=https://uap-visitors.TU-SUBDOMINIO.workers.dev
```

En GitHub Actions, añádela como variable/secret y pásala al paso de build. Mientras
no esté definida, `/visitantes` muestra "contador no configurado" y el beacon no
hace nada (no rompe el sitio).

## Endpoints

- `GET /stats` → `{ total, updated, countries: { "US": 123, "CL": 45, ... } }`
- `POST /hit` → incrementa el país del visitante; responde `204`

## Notas

- **Privacidad**: solo se guardan agregados por país (cuentas), nunca IPs.
- **Exactitud**: KV usa lectura-modificación-escritura sobre un blob; bajo alta
  concurrencia puede perderse algún incremento. Es una métrica de vanidad, no
  contabilidad. Para exactitud estricta, migrar a Durable Objects.
- **Reset**: `npx wrangler kv key delete --binding VISITS counts` (o por dashboard).
