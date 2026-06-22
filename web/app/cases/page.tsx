import { cases, TOTAL_CASES } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { CasesFilter, type HypKey } from "@/components/CasesFilter";
import {
  corpusPosteriors,
  documentPosteriors,
  modalHypothesis,
} from "@/lib/meceModel";
import { regionOf, type Region } from "@/lib/regions";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { EpistemicBadge } from "@/components/Badge";

export const metadata = {
  title: "Casos UAP institucionales (1947–2026)",
  description: `${TOTAL_CASES} casos UAP institucionales documentados entre 1947 y 2026 — archivo cronológico con nivel de evidencia y fuentes primarias.`,

  alternates: { canonical: "/cases/" },
};

const ERAS: Array<{ start: number; end: number; es: string; en: string }> = [
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

  // Hipótesis modal por caso (misma lógica consolidada que /probabilidades y
  // que el donut de la home). Documentos incluidos vía documentPosteriors.
  const modalById = new Map<string, HypKey>();
  for (const s of [...corpusPosteriors(), ...documentPosteriors()]) {
    modalById.set(
      s.id,
      modalHypothesis(s, { consolidateNonHuman: true }).key as HypKey,
    );
  }
  const hypCounts: Partial<Record<HypKey, number>> = {};
  for (const c of cases) {
    const h = modalById.get(c.id) ?? "misid";
    hypCounts[h] = (hypCounts[h] ?? 0) + 1;
  }

  return (
    <div data-cases-root className="space-y-12 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="El archivo · 1947–2026" en="The archive · 1947–2026" />
        </Eyebrow>
        <H1>
          <T
            es={`Los ${TOTAL_CASES} que sobrevivieron`}
            en={`The ${TOTAL_CASES} that survived`}
          />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es="Cada caso superó tres filtros: tuvo testigos institucionales, dejó rastro documental, y nadie pudo descartarlo con explicación convencional. De 1947 a 2026, era por era, en orden cronológico."
            en="Each case survived three filters: institutional witnesses, documented paper trail, and no one could dismiss it with a conventional explanation. From 1947 to 2026, era by era, in chronological order."
          />
        </Lede>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="font-mono uppercase tracking-widest text-muted/70">
          <T es="Sin marca = documentado." en="No marker = documented." />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <EpistemicBadge status="developing" compact />
          <T es="reciente / en curso" en="recent / in progress" />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <EpistemicBadge status="projected" compact />
          <T es="proyectado / especulativo" en="projected / speculative" />
        </span>
      </div>

      <CasesFilter
        regionCounts={regionCounts}
        hypCounts={hypCounts}
        eras={eras.map(({ era, eraCases }) => ({
          key: String(era.start),
          es: `${era.start}–${era.end}`,
          en: `${era.start}–${era.end}`,
          count: eraCases.length,
        }))}
        total={cases.length}
      >
        <div className="space-y-8 pt-2">
          {/* CA-2 · cabecera de columnas — una sola vez, estilo tabla editorial */}
          <div
            aria-hidden
            className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-4 border-b-2 border-text pb-2 font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            <span className="hidden w-10 text-right sm:inline">Nº</span>
            <span className="w-6" />
            <span>
              <T es="Caso" en="Case" />
            </span>
            <span className="hidden w-16 text-right sm:inline">
              <T es="Año" en="Year" />
            </span>
            <span className="w-12 text-right">
              <T es="Evid." en="Evid." />
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
                    {era.start}–{era.end}
                  </span>{" "}
                  ·{" "}
                  <T es={era.es} en={era.en} />{" "}
                  <span className="text-muted">
                    ·{" "}
                    <T
                      es={`${eraCases.length} casos`}
                      en={`${eraCases.length} cases`}
                    />
                  </span>
                </h2>
                <div>
                  {eraCases.map((c) => (
                    <div
                      key={c.id}
                      data-region={regionOf(c.country) ?? "otro"}
                      data-hyp={modalById.get(c.id) ?? "misid"}
                      data-era={String(era.start)}
                      className="contents"
                    >
                      <CaseRow caseData={c} />
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
