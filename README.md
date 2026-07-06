# UAP Codex — institutional analysis of UAP phenomena

> Bilingual (ES/EN) editorial corpus of 300+ institutional UAP cases, 1947–2026.
> 19 recurring patterns, 11 theoretical frameworks compared, 90+ disclosure
> actors, and a comparable probability model (MECE: each incident case splits
> 100% over 6 mutually-exclusive narratives).

**Live:** https://uapcodex.org/ — also https://dgonzamat.github.io/Mercadopublico/

**Stack:** Next.js 14 (App Router · static export) + TypeScript strict + Tailwind CSS 3.4 + Fraunces/Inter via next/font + react-leaflet (Atlas map only).

## Hosting

GitHub Pages via `.github/workflows/deploy-pages.yml`, auto-deploying on push to `main`. The build is a static export (`web/out`) served at the apex of the custom domain `uapcodex.org`, so `basePath` is forced empty (`NEXT_PUBLIC_BASE_PATH=''`).

The workflow publishes the built site **two ways** (belt-and-suspenders):
1. **peaceiris → `gh-pages` branch** (works if Pages source = *Deploy from a branch: `gh-pages` /(root)*).
2. **`actions/upload-pages-artifact` + `actions/deploy-pages`** (works if Pages source = *GitHub Actions*).

> ⚠️ **Pages source must be "GitHub Actions" or the `gh-pages` branch — NOT "main /(root)".** If it is set to `main`, GitHub Pages renders this `README.md` via Jekyll instead of serving the app. Settings → Pages → Build and deployment → Source.

## Structure

```
web/
  app/                Next.js App Router
    page.tsx          Hero · corpus stats · MECE snapshot · CTAs
    cases/            300+ chronological cases (by era)
    cases/[slug]      Editorial detail: hero · narrative · evidence + sources · per-case posterior · prev/next
    probabilidades/   MECE partition (6 narratives) + per-narrative modal cases
    atlas/            Leaflet world map of cases
    patterns/         19 recurring patterns
    researchers/      Disclosure ecosystem (90+ actors)
    frameworks/       11 theoretical frameworks compared
    about/            methodology
    resumen/          plain-language summary
  components/         T.tsx (bilingual primitive) · MobileNav · Badge · MeceChart · HypothesesSnapshot · CorpusStats · WorldMap …
  lib/                data.ts · types.ts · meceModel.ts · siteStats.ts · typography.tsx
  data/cases/         300+ per-case JSON files (source of truth)
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
`data/cases.json`, builds the search index, and runs the consistency/schema/design
audits. To add a case, drop a new JSON under `data/cases/<id>.json` with schema
`UAPCase` (see `lib/types.ts`) and a unique sequential `num`.

## Self-learning loop

This repo runs a self-learning / compounding-engineering loop (à la Boris Cherny):
every correction or hard-won convention is written back into `CLAUDE.md` so it is
never rediscovered. The tooling lives in `.claude/`:

| Piece | Moment | What it does |
| --- | --- | --- |
| **`/learn`** | one correction, live | Distills a mistake or gotcha into a rule and files it in the right `CLAUDE.md` section. |
| **`/retro`** | end of session, batch | Mines the whole session (conversation + diff) for lessons not captured live, dedupes against `CLAUDE.md`, proposes them together. |
| **`/curar-memoria`** | memory health | Audits `CLAUDE.md`'s numeric/factual claims against the live repo (self-verifying probes) and flags duplicate/obsolete/contradictory rules. |
| **`/nuevo-caso`** | guided authoring | Creates a case honoring the `UAPCase` schema, sequential `num`, MECE `posterior` = 1, and the editorial length standard. |
| **PostToolUse hook** | prevention, on edit | Validates the corpus schema the instant a `data/cases/*.json` or `data/researchers.json` file is edited — blocks on a broken schema instead of waiting for CI. |
| **SessionEnd hook** | reminder, on close | When a session made changes, nudges you to run `/retro` before closing so nothing learned is lost. |

See `CLAUDE.md` → *Protocolo de aprendizaje* for the rules each command follows.

## Probability model (MECE)

Each incident case carries a `posterior`: a distribution over 6 mutually-exclusive,
collectively-exhaustive narratives (object + institutional stance) summing to 1 —
`mundano_natural`, `humana_clasificada`, `adversaria`, `nohumano_encubierto`,
`nohumano_abierto`, `indet`. The corpus aggregate is the expected number of cases
per narrative (`Eⱼ = Σᵢ P(narrativeⱼ|caseᵢ)`), which is comparable across
narratives. Document cases (memos, hearings, leaks) are excluded — the "what was
the object" question does not apply to them. See `web/lib/meceModel.ts`.

## i18n

Whole site is bilingual ES/EN via CSS-based switching: `<T es=".." en=".."/>`
renders two sibling spans with `data-lang` attributes; a toggle flips the active
locale. Pure CSS swap, SSG-compatible, zero overhead.

## License

Analytical content under CC BY 4.0. Code under MIT.

See `CLAUDE.md` for full project context, conventions, and anti-patterns.
