# UAP Atlas

> 79 años del fenómeno UAP documentados institucionalmente. 51 casos verificables, 18 patrones recurrentes, 11 frameworks teóricos comparados.

**Stack:** Next.js 14 (App Router · static export) + TypeScript strict + Tailwind CSS + react-leaflet.

**Live:** https://dgonzamat.github.io/mercadopublico/

## Hosting

GitHub Pages via `.github/workflows/deploy-pages.yml`. Auto-deploys on push to main.

## Estructura

```
app/                  Next.js App Router
  page.tsx            Landing
  cases/              51 casos cronológicos
  atlas/              Mapa mundial interactivo (Leaflet)
  patterns/           18 patrones recurrentes
  frameworks/         11 frameworks teóricos comparados
  researchers/        Ecosistema de disclosure (5 secciones)
  about/              Metodología (Bayesian, 4-tier framework)
  resumen/            Versión accesible 10 min
  not-found.tsx       404 custom
  sitemap.ts          SEO
  robots.ts
components/           CaseRow, WorldMap
lib/                  data fetchers + types
data/                 cases.json (51), patterns.json (18), frameworks.json (11), researchers.json (14)
```

## Desarrollo local

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # static export to ./out/
```

## Páginas

- `/` Landing con hero, 3 módulos, casos destacados, taxonomía 8m/8n/8q/8r
- `/cases` Lista cronológica de 51 casos por era (1947-2026)
- `/cases/[slug]` Detalle con map coords, patrones, casos relacionados
- `/atlas` Mapa mundial interactivo Leaflet con 51 marcadores tier-colored
- `/patterns` 18 patrones recurrentes (8a-8r)
- `/patterns/[letter]` Detalle de patrón con casos que lo exhiben
- `/frameworks` Matriz comparativa 11 frameworks teóricos
- `/researchers` Ecosistema en 5 secciones (Vallée, Mack, Strieber, Grusch, Coulthart, Pasulka, etc.)
- `/researchers/[slug]` Detalle de figura con works
- `/about` Metodología Bayesiana + 4-tier evidential framework
- `/resumen` Versión accesible 10 min

## Licencia

Contenido analítico bajo CC BY 4.0. Código bajo MIT.
