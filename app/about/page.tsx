import Link from "next/link";
import {
  Eyebrow,
  H1,
  H2,
  Lede,
  Body,
  Caption,
  PullQuote,
} from "@/lib/typography";
import { T } from "@/components/T";

export const metadata = {
  title: "Method · UAP Atlas",
  description:
    "Four-tier evidential framework, Bayesian principle, non-mutual hypothesis exclusivity",
};

/**
 * TOC central — fuente única de verdad para los capítulos.
 * Cada entry: id (slug + anchor), counter, eyebrow es/en, h2 es/en,
 * tldr es/en (1-línea summary).
 */
const CHAPTERS = [
  {
    id: "tiers",
    n: "1",
    es: { eyebrow: "Capítulo 1", h2: "Por qué Roswell no equivale a Meier", tldr: "4 tiers de evidencia — Tier 1 militar+sensor pesa distinto que Tier 4 contactee" },
    en: { eyebrow: "Chapter 1", h2: "Why Roswell isn't equivalent to Meier", tldr: "4 evidence tiers — Tier 1 military+sensor weighs differently than Tier 4 contactee" },
  },
  {
    id: "bayes",
    n: "2",
    es: { eyebrow: "Capítulo 2", h2: "El caso #50 ya no enseña nada (retorno marginal)", tldr: "Tier 1 con sensor mueve la aguja; el caso 50 del mismo patrón aporta ~0%" },
    en: { eyebrow: "Chapter 2", h2: "Case #50 teaches nothing new (marginal return)", tldr: "Tier 1 sensor cases move the needle; case 50 of the same pattern adds ~0%" },
  },
  {
    id: "non-exclusive",
    n: "3",
    es: { eyebrow: "Capítulo 3", h2: "Por qué las probabilidades superan 100% (y no es un error)", tldr: "Las 8 hipótesis no son mutuamente excluyentes — pueden ser parcialmente ciertas en simultáneo" },
    en: { eyebrow: "Chapter 3", h2: "Why probabilities exceed 100% (and it's not a bug)", tldr: "The 8 hypotheses are not mutually exclusive — can be partially true simultaneously" },
  },
  {
    id: "movement",
    n: "4",
    es: { eyebrow: "Capítulo 4", h2: "Hipótesis fáciles vs hipótesis en frontera", tldr: "7 de 8 hipótesis están en bandas extremas y no se mueven; solo H5 (entidades no humanas) es la frontera real" },
    en: { eyebrow: "Chapter 4", h2: "Easy hypotheses vs frontier hypotheses", tldr: "7 of 8 hypotheses sit in extreme bands and don't move; only H5 (non-human entities) is the actual frontier" },
  },
  {
    id: "movers",
    n: "5",
    es: { eyebrow: "Capítulo 5", h2: "Qué movería el análisis ahora", tldr: "Análisis isotópico de Lake Huron, material recuperado verificable, nuevo país acknowledging" },
    en: { eyebrow: "Chapter 5", h2: "What would move the analysis now", tldr: "Lake Huron isotopic analysis, verifiable recovered material, new country acknowledging" },
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 py-4 lg:grid-cols-[14rem_1fr]">
      {/* TOC sticky en desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="Capítulos" en="Chapters" />
          </p>
          <ol className="space-y-2">
            {CHAPTERS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="block text-sm leading-snug text-muted hover:text-accent"
                >
                  <span className="font-mono text-xs tabular-nums text-text">
                    {c.n}
                  </span>{" "}
                  <T es={c.es.h2} en={c.en.h2} />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <article className="space-y-16">
        {/* HERO */}
        <header className="space-y-4">
          <Eyebrow>
            <T es="Metodología" en="Method" />
          </Eyebrow>
          <H1>
            <T es="Las reglas del juego" en="The rules of the game" />
          </H1>
          <Lede className="text-muted">
            <T
              es="Toda colección de evidencia UAP necesita una respuesta a tres preguntas: qué cuenta, cómo se pesa, y cuándo cambia. Acá las tres, explícitas — para que cualquiera pueda auditar el análisis en lugar de creerlo."
              en="Any UAP evidence collection needs an answer to three questions: what counts, how it's weighted, and when it changes. Here are all three, made explicit — so anyone can audit the analysis instead of having to believe it."
            />
          </Lede>
        </header>

        {/* ÍNDICE mobile (solo visible <lg) */}
        <nav
          aria-label="Índice de capítulos"
          className="space-y-3 border-y-2 border-text/15 py-6 lg:hidden"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="Saltar a capítulo" en="Jump to chapter" />
          </p>
          <ol className="space-y-2">
            {CHAPTERS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="flex items-baseline gap-3 py-1 text-sm"
                >
                  <span className="w-6 font-mono text-xs tabular-nums text-muted">
                    {c.n}
                  </span>
                  <span className="text-text hover:text-accent">
                    <T es={c.es.h2} en={c.en.h2} />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* CAP 1 */}
        <section id="tiers" className="scroll-mt-20 space-y-6">
          <div className="space-y-3">
            <Eyebrow>
              <T es={CHAPTERS[0].es.eyebrow} en={CHAPTERS[0].en.eyebrow} />
            </Eyebrow>
            <H2>
              <T es={CHAPTERS[0].es.h2} en={CHAPTERS[0].en.h2} />
            </H2>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              <T es="TL;DR · " en="TL;DR · " />
              <span className="normal-case tracking-normal text-muted">
                <T es={CHAPTERS[0].es.tldr} en={CHAPTERS[0].en.tldr} />
              </span>
            </p>
          </div>
          <Body className="text-muted">
            <T
              es="No todos los casos UAP son equivalentes en valor evidencial. Mezclar tiers opaca el análisis e infla artificialmente la apariencia de evidencia. El público y la prensa frecuentemente conflactan tiers — esa es una fuente principal de confusión."
              en="Not all UAP cases are equivalent in evidential value. Mixing tiers obscures the analysis and artificially inflates the appearance of evidence. The public and the press frequently conflate tiers — that's a principal source of confusion."
            />
          </Body>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                    Tier
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                    <T es="Categoría" en="Category" />
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                    <T es="Ejemplos" en="Examples" />
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                    <T es="Confiabilidad" en="Reliability" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <TierRow
                  tier="1"
                  es="Institucional militar + sensor"
                  en="Institutional military + sensor"
                  examples="Tehran 1976, Belgian Wave, USPER 2025, Lake Huron"
                  conf="75–88%"
                  color="text-tierS"
                />
                <TierRow
                  tier="2"
                  es="Institucional civil / multi-witness"
                  en="Institutional civil / multi-witness"
                  examples="Ariel School, JAL 1628, Manises, Westall, Roswell"
                  conf="65–85%"
                  color="text-tierS"
                />
                <TierRow
                  tier="3"
                  es="Folklórico / recurrente local"
                  en="Folkloric / local recurring"
                  examples="Hessdalen, Popocatépetl, Marfa"
                  conf="50–65%"
                  color="text-tierA"
                />
                <TierRow
                  tier="4"
                  es="Contactee / individual"
                  en="Contactee / individual"
                  examples="Meier, Sixto Paz, Adamski, Parkes"
                  conf="40% exp. / <5% cosmología"
                  color="text-tierB"
                />
              </tbody>
            </table>
          </div>
          <PullQuote>
            <T
              es={`Una "evidencia" Tier 4 no debería usarse para soportar conclusiones que requieren Tier 1. El sistema deriva de las Close Encounter Categories de Hynek.`}
              en={`A Tier 4 "evidence" should not be used to support conclusions that require Tier 1. The system derives from Hynek's Close Encounter Categories.`}
            />
          </PullQuote>
        </section>

        {/* CAP 2 */}
        <section id="bayes" className="scroll-mt-20 space-y-6">
          <div className="space-y-3">
            <Eyebrow>
              <T es={CHAPTERS[1].es.eyebrow} en={CHAPTERS[1].en.eyebrow} />
            </Eyebrow>
            <H2>
              <T es={CHAPTERS[1].es.h2} en={CHAPTERS[1].en.h2} />
            </H2>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              <T es="TL;DR · " en="TL;DR · " />
              <span className="normal-case tracking-normal text-muted">
                <T es={CHAPTERS[1].es.tldr} en={CHAPTERS[1].en.tldr} />
              </span>
            </p>
          </div>
          <Body className="text-muted">
            <T
              es="No todos los casos añaden evidencia igualmente. Algunos mueven la aguja; otros tienen retorno marginal nulo por repetición."
              en="Not all cases add evidence equally. Some move the needle; others have zero marginal return through repetition."
            />
          </Body>
          <div className="grid gap-4 sm:grid-cols-2">
            <MoveList
              es="Mueve mucho"
              en="Moves a lot"
              items={[
                "Tier 1/2 con multi-sensor (Tehran +5%)",
                "Categoría nueva (Hessdalen +categoría)",
                "Caso que contradice patrón establecido",
                "Sensores oficiales + video (Lake Huron +2%)",
              ]}
              itemsEn={[
                "Tier 1/2 with multi-sensor (Tehran +5%)",
                "New category (Hessdalen +category)",
                "Case that contradicts established pattern",
                "Official sensors + video (Lake Huron +2%)",
              ]}
              accent
            />
            <MoveList
              es="Mueve poco o nada"
              en="Barely moves"
              items={[
                "Tier 4 contactee aislado (Meier 1-2%)",
                "Caso #50 del mismo patrón (~0%)",
                "Nueva predicción contactee fallada (baja, no sube)",
              ]}
              itemsEn={[
                "Isolated Tier 4 contactee (Meier 1-2%)",
                "Case #50 of the same pattern (~0%)",
                "New failed contactee prediction (lowers, doesn't raise)",
              ]}
            />
          </div>
          <Caption>
            <T
              es={
                <>
                  <strong className="text-text">Estado:</strong> saturación de
                  retorno marginal para casos contactee. Aún acumulando
                  evidencia útil en casos institucionales Tier 1/2.
                </>
              }
              en={
                <>
                  <strong className="text-text">Status:</strong>{" "}
                  marginal-return saturation for contactee cases. Still
                  accumulating useful evidence in institutional Tier 1/2 cases.
                </>
              }
            />
          </Caption>
        </section>

        {/* CAP 3 — podado (duplica /probabilidades) */}
        <section id="non-exclusive" className="scroll-mt-20 space-y-6">
          <div className="space-y-3">
            <Eyebrow>
              <T es={CHAPTERS[2].es.eyebrow} en={CHAPTERS[2].en.eyebrow} />
            </Eyebrow>
            <H2>
              <T es={CHAPTERS[2].es.h2} en={CHAPTERS[2].en.h2} />
            </H2>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              <T es="TL;DR · " en="TL;DR · " />
              <span className="normal-case tracking-normal text-muted">
                <T es={CHAPTERS[2].es.tldr} en={CHAPTERS[2].en.tldr} />
              </span>
            </p>
          </div>
          <Body className="text-muted">
            <T
              es="Distinción crítica del paradigma estadístico: las 8 hipótesis no compiten entre sí — pueden ser parcialmente verdaderas en simultáneo. Por eso las P suman más de 100%. Esto no es bug; es la estructura real del problema. Negarlo lleva a la falacia del 'tiene que ser una sola explicación'."
              en="Critical distinction of the statistical paradigm: the 8 hypotheses don't compete with each other — they can be partially true simultaneously. That's why P's sum to more than 100%. This isn't a bug; it's the real structure of the problem. Denying it leads to the 'must be one single explanation' fallacy."
            />
          </Body>
          <div className="rounded-lg border-l-4 border-accent bg-surface-2 px-5 py-4">
            <p className="text-sm text-text">
              <T
                es={
                  <>
                    El detalle por hipótesis (con números, bandas ICD-203 y
                    razonamiento expandido) vive en{" "}
                    <Link
                      href="/probabilidades"
                      className="text-accent hover:underline"
                    >
                      /probabilidades →
                    </Link>{" "}
                    para no duplicar el contenido acá.
                  </>
                }
                en={
                  <>
                    The per-hypothesis detail (with numbers, ICD-203 bands,
                    and expanded reasoning) lives in{" "}
                    <Link
                      href="/probabilidades"
                      className="text-accent hover:underline"
                    >
                      /probabilidades →
                    </Link>{" "}
                    to avoid duplicating content here.
                  </>
                }
              />
            </p>
          </div>
        </section>

        {/* CAP 4 — ACTUALIZADO al paradigma 8-hipótesis */}
        <section id="movement" className="scroll-mt-20 space-y-6">
          <div className="space-y-3">
            <Eyebrow>
              <T es={CHAPTERS[3].es.eyebrow} en={CHAPTERS[3].en.eyebrow} />
            </Eyebrow>
            <H2>
              <T es={CHAPTERS[3].es.h2} en={CHAPTERS[3].en.h2} />
            </H2>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              <T es="TL;DR · " en="TL;DR · " />
              <span className="normal-case tracking-normal text-muted">
                <T es={CHAPTERS[3].es.tldr} en={CHAPTERS[3].en.tldr} />
              </span>
            </p>
          </div>
          <Body className="text-muted">
            <T
              es="Tras la reformulación al paradigma independiente, 7 de las 8 hipótesis se ubican en bandas extremas (casi cierto o muy improbable). Esas no van a cambiar mucho — para moverlas necesitarías evidencia que contradiga décadas de consenso. La octava, H5, es la única que está en banda pareja — ahí es donde la evidencia nueva sí puede mover la aguja, y por eso ahí está la pregunta del corpus."
              en="After the reformulation to the independent paradigm, 7 of the 8 hypotheses fall in extreme bands (almost certain or very unlikely). Those won't change much — moving them would require evidence contradicting decades of consensus. The eighth, H5, is the only one in the even band — that's where new evidence can actually move the needle, which is why the corpus question lives there."
            />
          </Body>
          <div className="grid gap-4 sm:grid-cols-3">
            <MoveList
              es="Casi techo (no se mueven)"
              en="Near ceiling (don't move)"
              items={[
                "H1 Misidentificación = 97%",
                "H2 Heterogeneidad = 95%",
                "H3 Programas clasificados = 88%",
              ]}
              itemsEn={[
                "H1 Misidentification = 97%",
                "H2 Heterogeneity = 95%",
                "H3 Classified programs = 88%",
              ]}
            />
            <MoveList
              es="Sitio activo (la frontera)"
              en="Active site (the frontier)"
              items={[
                "H5 Entidades no humanas = 45%",
                "→ única en banda pareja",
                "→ donde la evidencia nueva pesa",
              ]}
              itemsEn={[
                "H5 Non-human entities = 45%",
                "→ only one in even band",
                "→ where new evidence matters",
              ]}
              accent
            />
            <MoveList
              es="Casi piso (no se mueven)"
              en="Near floor (don't move)"
              items={[
                "H6 Interdimensional = 22%",
                "H7 Psicoespiritual = 22%",
                "H8 Tratado Greys = 6%",
              ]}
              itemsEn={[
                "H6 Interdimensional = 22%",
                "H7 Psychospiritual = 22%",
                "H8 Greys treaty = 6%",
              ]}
            />
          </div>
        </section>

        {/* CAP 5 */}
        <section id="movers" className="scroll-mt-20 space-y-6">
          <div className="space-y-3">
            <Eyebrow>
              <T es={CHAPTERS[4].es.eyebrow} en={CHAPTERS[4].en.eyebrow} />
            </Eyebrow>
            <H2>
              <T es={CHAPTERS[4].es.h2} en={CHAPTERS[4].en.h2} />
            </H2>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              <T es="TL;DR · " en="TL;DR · " />
              <span className="normal-case tracking-normal text-muted">
                <T es={CHAPTERS[4].es.tldr} en={CHAPTERS[4].en.tldr} />
              </span>
            </p>
          </div>
          <ul className="space-y-3">
            {[
              {
                weight: "+++",
                color: "text-tierS",
                es: "Análisis isotópico independiente de residuos físicos publicado",
                en: "Independent isotopic analysis of physical residues published",
              },
              {
                weight: "+++",
                color: "text-tierS",
                es: "Material recuperado con fotos verificables",
                en: "Recovered material with verifiable photos",
              },
              {
                weight: "+++",
                color: "text-tierS",
                es: "Lake Huron fragmentos análisis publicado",
                en: "Lake Huron fragment analysis published",
              },
              {
                weight: "+",
                color: "text-tierA",
                es: "Nuevo país que acknowledged formalmente",
                en: "New country formally acknowledging",
              },
              {
                weight: "+",
                color: "text-tierA",
                es: "Otro Tehran-equivalente con sensor data",
                en: "Another Tehran-equivalent with sensor data",
              },
              {
                weight: "~0",
                color: "text-muted",
                es: "Nuevo contactee con cosmología detallada",
                en: "New contactee with detailed cosmology",
              },
            ].map((item, i) => (
              <li
                key={i}
                className="grid grid-cols-[3rem_1fr] items-baseline gap-3"
              >
                <span className={`text-right font-mono text-xs ${item.color}`}>
                  {item.weight}
                </span>
                <span className="text-text">
                  <T es={item.es} en={item.en} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* BRIDGE FINAL — CTAs */}
        <section className="space-y-6 border-t-4 border-text bg-surface-2 px-6 py-10 md:px-10 md:py-14">
          <Eyebrow>
            <T es="Ya entendés el método" en="You now understand the method" />
          </Eyebrow>
          <h2 className="font-display text-2xl font-medium leading-snug text-text md:text-3xl">
            <T
              es="Ahora mirá el resultado: 8 hipótesis con probabilidad calibrada"
              en="Now see the result: 8 hypotheses with calibrated probability"
            />
          </h2>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/probabilidades"
              className="inline-flex min-h-[48px] items-center bg-accent px-6 py-2 text-base font-medium text-bg hover:bg-text"
            >
              <T
                es="Ver las 8 hipótesis →"
                en="See the 8 hypotheses →"
              />
            </Link>
            <Link
              href="/cases"
              className="inline-flex min-h-[48px] items-center border-2 border-text px-6 py-2 text-base font-medium text-text hover:bg-text hover:text-bg"
            >
              <T
                es="Ver los 52 casos →"
                en="See the 52 cases →"
              />
            </Link>
            <Link
              href="/fuentes"
              className="inline-flex min-h-[48px] items-center border-2 border-text px-6 py-2 text-base font-medium text-text hover:bg-text hover:text-bg"
            >
              <T
                es="Ver las fuentes (186) →"
                en="See the sources (186) →"
              />
            </Link>
          </div>
        </section>

        <Caption className="border-t border-border pt-6">
          <T
            es={
              <>
                Source completo en{" "}
                <a
                  href="https://github.com/dgonzamat/UAP-analysys-/blob/main/METHODOLOGY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  METHODOLOGY.md ↗
                </a>{" "}
                del corpus.
              </>
            }
            en={
              <>
                Full source at{" "}
                <a
                  href="https://github.com/dgonzamat/UAP-analysys-/blob/main/METHODOLOGY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  METHODOLOGY.md ↗
                </a>
                .
              </>
            }
          />
        </Caption>
      </article>
    </div>
  );
}

function TierRow({
  tier,
  es,
  en,
  examples,
  conf,
  color,
}: {
  tier: string;
  es: string;
  en: string;
  examples: string;
  conf: string;
  color: string;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-3 align-top">
        <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>
          {tier}
        </span>
      </td>
      <td className="px-3 py-3 align-top text-sm text-text">
        <T es={es} en={en} />
      </td>
      <td className="px-3 py-3 align-top text-xs text-muted">{examples}</td>
      <td className="px-3 py-3 align-top font-mono text-xs tabular-nums text-text">
        {conf}
      </td>
    </tr>
  );
}

function MoveList({
  es,
  en,
  items,
  itemsEn,
  accent,
}: {
  es: string;
  en: string;
  items: string[];
  itemsEn: string[];
  accent?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p
        className={`font-mono text-xs uppercase tracking-widest ${
          accent ? "text-accent" : "text-muted"
        }`}
      >
        <T es={es} en={en} />
      </p>
      <ul className="space-y-1.5 text-xs text-text">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted">·</span>
            <span>
              <T es={item} en={itemsEn[i] ?? item} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
