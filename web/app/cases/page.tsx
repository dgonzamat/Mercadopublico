import { cases, TOTAL_CASES, TOTAL_DOCUMENTS } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { CasesFilter, type HypKey } from "@/components/CasesFilter";
import {
  corpusPosteriors,
  modalHypothesis,
} from "@/lib/meceModel";
import { regionOf, type Region } from "@/lib/regions";
import { TIER_META } from "@/lib/ui";
import { searchKey } from "@/lib/searchKey";
import { countryEn } from "@/lib/i18n-geo";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { EpistemicBadge } from "@/components/Badge";
import { AnalyzerCta } from "@/components/AnalyzerCta";
import { pageMeta } from "@/lib/seo";
import {
  casesCollectionJsonLd,
  corpusDatasetJsonLd,
  serializeJsonLd,
} from "@/lib/jsonld";

const TIER_ORDER = ["S", "A", "B"] as const;

export const metadata = {
  ...pageMeta({
    title: "Institutional UAP cases (1947–2026)",
    description: `${TOTAL_CASES} documented institutional UAP cases (1947–2026) — a chronological archive with evidence tier and primary sources.`,
    path: "/cases/",
  }),
  alternates: {
    canonical: "/cases/",
    languages: { en: "/cases/", es: "/es/cases/", "x-default": "/cases/" },
  },
};

// `range` sobreescribe el rótulo numérico del encabezado y del filtro. Solo lo
// usa el bucket de antecedentes: su rango real arrancaría en 1561 (Núremberg) y
// hornearlo driftearía en cuanto entre un caso más antiguo, mientras que "‹1946"
// es estable y ya es la convención de /cobertura para su columna equivalente.
const ERAS: Array<{ start: number; end: number; es: string; en: string; range?: string }> = [
  {
    // Los ~17 antecedentes previos a la era institucional moderna (Núremberg
    // 1561, Basilea 1566, Utsuro-bune 1803, los scareships de 1909, los foo
    // fighters de 1944…). Sin este bucket no caían en ninguna era y /cases no
    // los listaba, aunque el filtro sí los contaba: el conteo prometía 389 y la
    // página renderizaba 372. El corte en 1945 respeta el ancla editorial de
    // 1947 (ver CORPUS_START_YEAR) sin esconder la profundidad histórica.
    start: 0,
    end: 1945,
    es: "Antecedentes",
    en: "Antecedents",
    range: "‹1946",
  },
  {
    start: 1946,
    end: 1959,
    es: "La primera oleada",
    en: "The first wave",
  },
  {
    start: 1960,
    end: 1979,
    es: "La Guerra Fría sospecha de todo",
    en: "The Cold War suspects everything",
  },
  {
    start: 1980,
    end: 1995,
    es: "Reagan habla en la ONU",
    en: "Reagan speaks at the UN",
  },
  {
    start: 1996,
    end: 2016,
    es: "Pre-divulgación: filtraciones, libros, demandas",
    en: "Pre-disclosure: leaks, books, lawsuits",
  },
  {
    start: 2017,
    end: 2030,
    es: "Divulgación: Nimitz, Grusch, PURSUE",
    en: "Disclosure: Nimitz, Grusch, PURSUE",
  },
];

export default function CasesPage() {
  return <CasesView locale="en" />;
}

export function CasesView({ locale }: { locale: "es" | "en" }) {
  // CA-1 · la promesa de la Home es «caminar en orden cronológico»:
  // eras ascendentes (1947 → 2026) y, dentro de cada una, por año.
  const eras = ERAS.map((era) => ({
    era,
    eraCases: cases
      .filter((c) => c.year_start >= era.start && c.year_start <= era.end)
      .sort(
        (a, b) => a.year_start - b.year_start || b.probability - a.probability,
      ),
  })).filter(({ eraCases }) => eraCases.length > 0);

  const regionCounts: Partial<Record<Region, number>> = {};
  for (const c of cases) {
    const r = regionOf(c.country);
    if (r) regionCounts[r] = (regionCounts[r] ?? 0) + 1;
  }

  // Narrativa modal por caso (misma lógica que /probabilidades y el donut de la
  // home): solo los INCIDENTES, conservando «Indeterminado» (keepIndet) para lo
  // que no se puede decidir. Los casos-documento se listan pero no cuentan en
  // ninguna hipótesis (son evidencia, no sucesos): llevan data-hyp="documento",
  // que ninguna opción del filtro selecciona, así que solo aparecen con
  // «Explicación · todas».
  const modalById = new Map<string, HypKey>();
  for (const s of corpusPosteriors()) {
    modalById.set(
      s.id,
      modalHypothesis(s, { consolidateNonHuman: true, keepIndet: true }).key as HypKey,
    );
  }
  const hypCounts: Partial<Record<HypKey, number>> = {};
  for (const c of cases) {
    const h = modalById.get(c.id);
    if (h) hypCounts[h] = (hypCounts[h] ?? 0) + 1;
  }

  const tierCounts: Record<string, number> = {};
  for (const c of cases) tierCounts[c.tier] = (tierCounts[c.tier] ?? 0) + 1;
  const tierOpts = TIER_ORDER.filter((t) => (tierCounts[t] ?? 0) > 0).map(
    (t) => ({
      key: t,
      es: `${TIER_META[t].label} · ${TIER_META[t].plain}`,
      en: `${TIER_META[t].label} · ${TIER_META[t].plain_en}`,
      count: tierCounts[t] ?? 0,
    }),
  );

  return (
    <div data-cases-root className="space-y-12 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(casesCollectionJsonLd(cases, locale)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(corpusDatasetJsonLd()),
        }}
      />
      <header className="space-y-4">
        <Eyebrow>
          <T es="El archivo · 1947–2026" en="The archive · 1947–2026" locale={locale} />
        </Eyebrow>
        <H1>
          <T
            es={`Los ${TOTAL_CASES} casos`}
            en={`The ${TOTAL_CASES} cases`}
            locale={locale}
          />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es={`Cada caso lleva sus fuentes, su nivel de evidencia (S, A o B) y una probabilidad repartida entre seis explicaciones; muchos tienen una explicación ordinaria y se quedan en el archivo para que se vea qué se explica y qué no. De 1947 a 2026, era por era, en orden cronológico. Junto a ellos van los ${TOTAL_DOCUMENTS} documentos oficiales que los respaldan: son evidencia de los casos, no casos.`}
            en={`Each case carries its sources, its evidence tier (S, A or B) and a probability split across six explanations; many have an ordinary explanation and stay in the archive so you can see what is explained and what is not. From 1947 to 2026, era by era, in chronological order. Alongside them are the ${TOTAL_DOCUMENTS} official documents that back them: evidence for the cases, not cases.`}
            locale={locale}
          />
        </Lede>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="font-mono uppercase tracking-widest text-muted/70">
          <T es="Sin marca = documentado." en="No marker = documented." locale={locale} />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <EpistemicBadge status="developing" compact locale={locale} />
          <T es="reciente / en curso" en="recent / in progress" locale={locale} />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <EpistemicBadge status="projected" compact locale={locale} />
          <T es="proyectado / especulativo" en="projected / speculative" locale={locale} />
        </span>
      </div>

      <AnalyzerCta locale={locale} />

      <CasesFilter
        locale={locale}
        regionCounts={regionCounts}
        hypCounts={hypCounts}
        eras={eras.map(({ era, eraCases }) => ({
          key: String(era.start),
          es: era.range ?? `${era.start}–${era.end}`,
          en: era.range ?? `${era.start}–${era.end}`,
          count: eraCases.length,
        }))}
        tiers={tierOpts}
        total={cases.length}
      >
        <div className="space-y-8 pt-2">
          {/* CA-2 · cabecera de columnas — una sola vez, estilo tabla editorial */}
          <div
            aria-hidden
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b-2 border-text pb-2 font-mono text-[10px] uppercase tracking-widest text-muted sm:grid-cols-[auto_auto_1fr_auto_auto_auto]"
          >
            <span className="hidden w-10 text-right sm:inline">Nº</span>
            <span className="w-6" />
            <span>
              <T es="Caso" en="Case" locale={locale} />
            </span>
            <span className="hidden w-16 text-right sm:inline">
              <T es="Año" en="Year" locale={locale} />
            </span>
            <span className="w-12 text-right">
              <T es="Evid." en="Evid." locale={locale} />
            </span>
            <span className="w-12 text-right">%</span>
          </div>
          {eras.map(({ era, eraCases }) => {
            return (
              <section
                key={`${era.start}-${era.end}`}
                id={`era-${era.start}`}
                data-group
                className="scroll-mt-20"
              >
                <h2 className="sticky top-[76px] z-10 -mx-4 border-b border-border bg-bg px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted">
                  <span className="text-text">
                    {era.range ?? `${era.start}–${era.end}`}
                  </span>{" "}
                  ·{" "}
                  <T es={era.es} en={era.en} locale={locale} />{" "}
                  <span className="text-muted">
                    ·{" "}
                    <T
                      es={`${eraCases.length} casos`}
                      en={`${eraCases.length} cases`}
                      locale={locale}
                    />
                  </span>
                </h2>
                <div>
                  {eraCases.map((c) => (
                    <div
                      key={c.id}
                      data-region={regionOf(c.country) ?? "otro"}
                      data-hyp={modalById.get(c.id) ?? "documento"}
                      data-era={String(era.start)}
                      data-tier={c.tier}
                      // Clave del buscador de la barra de filtros, normalizada
                      // en el SERVIDOR (ver lib/searchKey). Indexa nombre, país
                      // y año —no la prosa—: es un filtro para acotar ESTA
                      // lista, no el buscador global del header, que sí hace
                      // texto completo difuso contra /search-index.json cargado
                      // aparte. Meter los 388 resúmenes aquí serían ~78 KB de
                      // atributos en el HTML de una página cuyo LCP ya costó
                      // trabajo (ver la regla de bundle bloat en CLAUDE.md).
                      data-search={searchKey(
                        locale === "en" ? c.name_en ?? c.name : c.name,
                        locale === "en"
                          ? countryEn(c.country_name)
                          : c.country_name,
                        String(c.year_start),
                      )}
                      className="contents"
                    >
                      <CaseRow caseData={c} locale={locale} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </CasesFilter>
    </div>
  );
}
