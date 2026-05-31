# UAP Atlas — institutional analysis of UAP phenomena

> Bilingual (ES/EN) editorial atlas of 52 institutional UAP cases, 1947–2026.
> 18 recurring patterns, 11 theoretical frameworks compared, 6 hypotheses with
> ICD-203 calibrated probability.

**Live:** https://dgonzamat.github.io/uap-atlas/

**Stack:** Next.js 14 (App Router · static export) + TypeScript strict + Tailwind CSS 3.4 + Fraunces/Inter via next/font + react-leaflet (Atlas map only).

## Hosting

GitHub Pages via `.github/workflows/deploy-pages.yml`. Auto-deploys on push to main. basePath auto-detected by `actions/configure-pages` from the repo name (no manual config needed).

## Structure

```
web/
  app/                Next.js App Router
    page.tsx          Hero · 52/79/N stats · thesis dark block · timeline · CTAs
    cases/            52 cronological cases (CorpusStats at top)
    cases/[slug]      Editorial detail: hero · 3 parts · evidence + sources · prev/next
    probabilidades/   ICD-203 chart + per-hypothesis reasoning
    atlas/            Leaflet world map of cases
    patterns/         18 recurring patterns (8a-8r)
    researchers/      Disclosure ecosystem (5 sections)
    frameworks/       11 theoretical frameworks compared
    about/            5-chapter methodology
    resumen/          10-min plain-language summary
  components/
    T.tsx             Bilingual primitive: <T es=".." en=".."/>
    LocaleToggle.tsx  ES/EN toggle (client, localStorage persist)
    Badge, MobileNav, IcdProbabilityChart, CorpusStats, TimelineByYear, WorldMap
  lib/                data.ts · types.ts · hypotheses.ts · icd203.ts · typography.tsx
  data/cases/         52 per-case JSON files (source of truth)
  scripts/build-cases.mjs   Build-time aggregator → data/cases.json (gitignored)
```

## Development

```bash
cd web
npm install
npm run dev    # http://localhost:3000
npm run build  # static export to ./out/
```

`npm run build` runs `prebuild` automatically: aggregates `data/cases/*.json` →
`data/cases.json`. To add a case, drop a new JSON under `data/cases/<id>.json`
with schema `UAPCase` (see `lib/types.ts`).

## i18n

Whole site is bilingual ES/EN via CSS-based switching:
- `<T es=".." en=".."/>` renders two sibling spans with `data-lang` attributes
- `LocaleToggle` flips `html[data-locale]` and persists in localStorage
- Pure CSS swap, SSG-compatible, zero overhead

UI strings are fully translated. Per-case narrative translation (52 cases ×
4 fields) is ongoing.

## License

Analytical content under CC BY 4.0. Code under MIT.

See `web/CLAUDE.md` for full project context, conventions, and anti-patterns.

<!-- redeploy-trigger: rename to uap-atlas -->
