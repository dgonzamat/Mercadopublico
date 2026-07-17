import { cases } from "@/lib/data";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { STATS } from "@/lib/siteStats";
import { MECE_CLASSES, corpusPosteriors, documentPosteriors } from "@/lib/meceModel";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  ...pageMeta({
    title: "Calidad del corpus · panel de salud editorial",
    description: `Salud editorial de los ${STATS.cases} casos institucionales UAP: completitud (prosa, bilingüe, fuentes), cobertura de evidencia visual, balance MECE y alcance geográfico-temporal. Derivado del corpus en cada build.`,
    path: "/calidad/",
  }),
  alternates: { canonical: "/calidad/", languages: hreflangFor("/calidad/") },
};

// ─── métricas derivadas del corpus (build-time; se recalculan en cada deploy) ─
const TIERS = ["S", "A", "B"] as const;
type Tier = (typeof TIERS)[number];

const hasVisual = (c: (typeof cases)[number]) =>
  (Array.isArray(c.documents) && c.documents.length > 0) ||
  Boolean(c.primaryDocument && (c.primaryDocument.url || c.primaryDocument.href)) ||
  Boolean(c.featuredDoc && c.featuredDoc.url);

const bodyLen = (c: (typeof cases)[number]) =>
  ((c.whatHappened || "") + "\n\n" + (c.whyMatters || "")).trim().length;

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export default function CalidadPage() {
  const total = cases.length;

  // completitud editorial
  const proseOk = cases.filter((c) => bodyLen(c) >= 3500).length;
  const bilingual = cases.filter((c) => {
    if (!(c.whatHappened || c.whyMatters)) return true;
    return (!c.whatHappened || c.whatHappened_en) && (!c.whyMatters || c.whyMatters_en);
  }).length;
  const withEvidence = cases.filter((c) => Array.isArray(c.evidence) && c.evidence.length > 0).length;
  const withSources = cases.filter((c) => Array.isArray(c.sources) && c.sources.length > 0).length;
  const withPosterior = cases.filter((c) => c.posterior).length;
  const withVisual = cases.filter(hasVisual).length;

  const scorecard = [
    { k: "Prosa ≥ 1 página", kEn: "Prose ≥ 1 page", note: "E13", n: proseOk },
    { k: "Bilingüe ES + EN", kEn: "Bilingual ES + EN", note: "E10", n: bilingual },
    { k: "Evidencia documentada", kEn: "Documented evidence", note: "", n: withEvidence },
    { k: "Fuentes citadas", kEn: "Cited sources", note: "", n: withSources },
    { k: "Posterior MECE", kEn: "MECE posterior", note: "M1", n: withPosterior },
    { k: "Evidencia visual", kEn: "Visual evidence", note: "E21", n: withVisual, gap: true },
  ];

  // visual por tier
  const tierColor: Record<Tier, string> = { S: "bg-tierS", A: "bg-tierA", B: "bg-tierB" };
  const visualByTier = TIERS.map((t) => {
    const inTier = cases.filter((c) => c.tier === t);
    const w = inTier.filter(hasVisual).length;
    return { tier: t, withV: w, without: inTier.length - w, total: inTier.length };
  });

  // distribución por tier
  const tierDist = TIERS.map((t) => ({ tier: t, n: cases.filter((c) => c.tier === t).length }));

  // categoría
  const catMeta: Record<string, { es: string; en: string }> = {
    incident: { es: "Incidente", en: "Incident" },
    document: { es: "Documento", en: "Document" },
    contactee: { es: "Contactado", en: "Contactee" },
    crop_circle: { es: "Crop circle", en: "Crop circle" },
  };
  const catDist = Object.keys(catMeta)
    .map((k) => ({ k, n: cases.filter((c) => c.category === k).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  // MECE agregado (Eⱼ = Σ P(narrativaⱼ | casoᵢ)) sobre el CORPUS COMPLETO: los
  // incidentes por su objeto y los casos-documento por la inclinación de su
  // contenido (documentPosteriors siembra «indeterminable» a los que no traen
  // lean). Conserva «Indeterminable»: es la vista comparable (valor esperado),
  // hermana del conteo modal navegable de la home/probabilidades. Mismo conjunto
  // (STATS.cases) que las demás vistas.
  const meceScored = [...corpusPosteriors(), ...documentPosteriors()];
  const meceN = meceScored.length;
  const agg: Record<string, number> = {};
  MECE_CLASSES.forEach((m) => {
    agg[m.id] = 0;
  });
  meceScored.forEach((c) => {
    const p = c.posterior as Record<string, number> | undefined;
    if (p) MECE_CLASSES.forEach((m) => {
      agg[m.id] += p[m.id] || 0;
    });
  });
  const mece = MECE_CLASSES.map((m) => ({
    label: m.label,
    labelEn: m.labelEn,
    n: agg[m.id],
  })).sort((a, b) => b.n - a.n);
  const meceMax = Math.max(...mece.map((m) => m.n));

  // región
  const REG: Record<string, string> = {
    US: "N.América", CA: "N.América", MX: "N.América",
    BR: "Sudamérica", AR: "Sudamérica", CL: "Sudamérica", PE: "Sudamérica", UY: "Sudamérica", VE: "Sudamérica", CO: "Sudamérica", BO: "Sudamérica", EC: "Sudamérica", PY: "Sudamérica",
    GB: "Europa", FR: "Europa", ES: "Europa", PT: "Europa", IT: "Europa", DE: "Europa", BE: "Europa", NL: "Europa", NO: "Europa", SE: "Europa", FI: "Europa", PL: "Europa", CH: "Europa", AT: "Europa", IE: "Europa", DK: "Europa", GR: "Europa", RO: "Europa", UA: "Europa", CZ: "Europa",
    SU: "Rusia / URSS", RU: "Rusia / URSS",
    CN: "Asia", JP: "Asia", IN: "Asia", MY: "Asia", ID: "Asia", VN: "Asia", KR: "Asia", TH: "Asia", PH: "Asia", KZ: "Asia", IR: "Asia", IL: "Asia", TR: "Asia", KP: "Asia",
    AU: "Oceanía", NZ: "Oceanía", PG: "Oceanía",
    ZA: "África", EG: "África", DZ: "África", ZW: "África", MA: "África", MG: "África", TZ: "África", NG: "África",
  };
  const regionCount: Record<string, number> = {};
  cases.forEach((c) => {
    const r = REG[c.country] || "Otros";
    regionCount[r] = (regionCount[r] || 0) + 1;
  });
  const regions = Object.entries(regionCount).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
  const regionMax = Math.max(...regions.map((r) => r.n));

  // décadas (1940+)
  const decadeCount: Record<number, number> = {};
  cases.forEach((c) => {
    const dc = c.year_start < 1940 ? 0 : Math.floor(c.year_start / 10) * 10;
    decadeCount[dc] = (decadeCount[dc] || 0) + 1;
  });
  const decades = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => ({
    d,
    n: decadeCount[d] || 0,
  }));
  const decadeMax = Math.max(...decades.map((x) => x.n));
  const preN = decadeCount[0] || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-16 py-4">
      <header className="space-y-4 border-b-2 border-text pb-8">
        <Eyebrow>
          <T es="Panel de calidad del corpus" en="Corpus quality panel" />
        </Eyebrow>
        <H1>
          <T es={`Salud editorial de los ${total} casos`} en={`Editorial health of the ${total} cases`} />
        </H1>
        <Lede>
          <T
            es="Las mismas señales que las sondas del repositorio miden en cada build: completitud editorial, cobertura de evidencia visual, balance analítico MECE y alcance geográfico-temporal. Se recalcula desde el corpus en cada despliegue — no es una foto fija."
            en="The same signals the repository's probes measure on every build: editorial completeness, visual-evidence coverage, MECE analytical balance and geographic-temporal reach. Recomputed from the corpus on every deploy — not a fixed snapshot."
          />
        </Lede>
      </header>

      {/* ── completitud ── */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="font-display text-2xl font-medium">
            <T es="Completitud editorial" en="Editorial completeness" />
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="% de casos que cumplen" en="% of cases meeting" />
          </span>
        </div>
        <div className="space-y-3">
          {scorecard.map((s) => {
            const p = pct(s.n, total);
            return (
              <div key={s.k} className="grid grid-cols-[minmax(120px,190px)_1fr_auto] items-center gap-3">
                <div className="truncate text-sm">
                  <T es={s.k} en={s.kEn} />
                  {s.note && <span className="ml-2 font-mono text-[10px] text-muted">{s.note}</span>}
                </div>
                <div className="h-6 overflow-hidden rounded-sm bg-surface-2" title={`${s.n} / ${total}`}>
                  <div
                    className={`h-full rounded-sm ${s.gap ? "bg-accent" : "bg-text"}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
                <div className="w-14 text-right font-mono text-sm tabular-nums">
                  {p}<span className="text-muted">%</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted">
          <T
            es="La cobertura de evidencia visual (E21) es el frente en cierre activo — sube caso por caso con material de dominio público."
            en="Visual-evidence coverage (E21) is the front under active closure — it rises case by case with public-domain material."
          />
        </p>
      </section>

      {/* ── tiles ── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { n: total, es: "Casos totales", en: "Total cases", cls: "border-l-text" },
          { n: proseOk === total ? "100%" : `${pct(proseOk, total)}%`, es: "Prosa al día", en: "Prose complete", cls: "border-l-text" },
          { n: withVisual, es: "Con evidencia visual", en: "With visual evidence", cls: "border-l-tierB" },
          { n: total - withVisual, es: "Sin visual (backlog)", en: "Without visual (backlog)", cls: "border-l-accent" },
        ].map((t, i) => (
          <div key={i} className={`border border-border border-l-4 ${t.cls} bg-panel p-4`}>
            <div className="font-display text-3xl font-medium leading-none tabular-nums">{t.n}</div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              <T es={t.es} en={t.en} />
            </div>
          </div>
        ))}
      </section>

      {/* ── visual por tier ── */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="font-display text-2xl font-medium">
            <T es="Evidencia visual por tier" en="Visual evidence by tier" />
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">E21</span>
        </div>
        <div className="space-y-3">
          {visualByTier.map((v) => (
            <div key={v.tier} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-block h-2.5 w-2.5 rounded-sm ${tierColor[v.tier]}`} />
                Tier {v.tier}
              </div>
              <div className="flex h-5 gap-0.5 overflow-hidden rounded-sm bg-surface-2">
                <div className={`h-full ${tierColor[v.tier]}`} style={{ width: `${pct(v.withV, v.total)}%` }} title={`${v.withV} con visual`} />
              </div>
              <div className="w-24 text-right font-mono text-xs tabular-nums text-muted">
                {v.withV}<span className="text-text">/{v.total}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-tierS" /> <T es="Con visual" en="With visual" /></span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-surface-2 ring-1 ring-border" /> <T es="Sin visual" en="Without visual" /></span>
        </div>
      </section>

      {/* ── balance analítico ── */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="font-display text-2xl font-medium">
            <T es="Reparto MECE del corpus" en="Corpus MECE split" />
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            <T es="nº esperado de casos" en="expected # of cases" />
          </span>
        </div>
        <div className="space-y-2.5">
          {mece.map((m) => (
            <div key={m.label} className="grid grid-cols-[minmax(140px,220px)_1fr_auto] items-center gap-3">
              <div className="truncate text-sm">
                <T es={m.label} en={m.labelEn} />
              </div>
              <div className="h-5 overflow-hidden rounded-sm bg-surface-2">
                <div className="h-full rounded-sm bg-muted" style={{ width: `${pct(m.n, meceMax)}%` }} />
              </div>
              <div className="w-14 text-right font-mono text-sm tabular-nums">{m.n.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted">
          <T
            es={`Valor esperado (Eⱼ = Σ P) sobre los ${meceN} casos del corpus —incidentes por su objeto, casos-documento por el lean de su contenido—. Conserva «Indeterminable» de forma fraccional: es la vista comparable del modelo. El conteo modal navegable (cada caso en una narrativa, «Indeterminado» incluido) vive en /probabilidades y en la home. Comparable, no una frecuencia calibrada.`}
            en={`Expected value (Eⱼ = Σ P) over the corpus's ${meceN} cases —incidents by their object, document cases by their content's lean—. It keeps 'Indeterminable' fractionally: this is the model's comparable view. The navigable modal count (each case in one narrative, 'Indeterminate' included) lives on /probabilidades and the home. Comparable, not a calibrated frequency.`}
          />
        </p>
      </section>

      {/* ── alcance ── */}
      <section className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="border-b border-border pb-2 font-display text-xl font-medium">
            <T es="Casos por región" en="Cases by region" />
          </h2>
          <div className="space-y-2">
            {regions.map((r) => (
              <div key={r.k} className="grid grid-cols-[minmax(90px,120px)_1fr_auto] items-center gap-3">
                <div className="truncate text-sm">{r.k}</div>
                <div className="h-4 overflow-hidden rounded-sm bg-surface-2">
                  <div className="h-full rounded-sm bg-text" style={{ width: `${pct(r.n, regionMax)}%` }} />
                </div>
                <div className="w-8 text-right font-mono text-xs tabular-nums">{r.n}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="border-b border-border pb-2 font-display text-xl font-medium">
            <T es="Casos por década" en="Cases by decade" />
          </h2>
          <div className="grid grid-cols-9 items-end gap-1.5" style={{ height: "150px" }}>
            {decades.map((x) => (
              <div key={x.d} className="flex h-full flex-col items-center justify-end gap-1.5">
                <span className="font-mono text-[10px] tabular-nums">{x.n}</span>
                <div
                  className="w-full max-w-[30px] rounded-t-sm bg-text"
                  style={{ height: `${Math.max(2, pct(x.n, decadeMax))}%` }}
                  title={`${x.d}s: ${x.n}`}
                />
                <span className="font-mono text-[9px] text-muted">{`${String(x.d).slice(2)}s`}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            <T es={`Anteriores a 1940: ${preN} casos históricos dispersos.`} en={`Pre-1940: ${preN} scattered historical cases.`} />
          </p>
        </div>
      </section>

      <footer className="border-t border-border pt-6 text-sm text-muted">
        <T
          es="Panel derivado de las mismas señales que audit-consistency.mjs reporta en cada build. Cifras vivas — se recalculan con el corpus, no fijadas a mano."
          en="Panel derived from the same signals audit-consistency.mjs reports on every build. Live figures — recomputed with the corpus, never hand-set."
        />
      </footer>
    </div>
  );
}
