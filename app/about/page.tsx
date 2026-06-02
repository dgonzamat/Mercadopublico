import { Eyebrow, H1, H2, Lede, Body, Caption, PullQuote } from "@/lib/typography";
import { T } from "@/components/T";

export const metadata = {
  title: "Method · UAP Atlas",
  description:
    "Four-tier evidential framework, Bayesian principle, non-mutual hypothesis exclusivity",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-16 py-4">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Metodología" en="Method" />
        </Eyebrow>
        <H1>
          <T
            es="Cómo se construyó este análisis"
            en="How this analysis was built"
          />
        </H1>
        <Lede className="text-muted">
          <T
            es="Principios metodológicos explícitos. Qué cuenta como evidencia, cómo se evalúa, cómo se actualizan las probabilidades."
            en="Explicit methodological principles. What counts as evidence, how it's evaluated, how probabilities are updated."
          />
        </Lede>
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Capítulo 1" en="Chapter 1" />
          </Eyebrow>
          <H2>
            <T
              es="Framework de cuatro tiers evidenciales"
              en="Four-tier evidential framework"
            />
          </H2>
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

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Capítulo 2" en="Chapter 2" />
          </Eyebrow>
          <H2>
            <T
              es="Principio Bayesiano — qué casos mueven probabilidades"
              en="Bayesian principle — which cases move probabilities"
            />
          </H2>
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
                retorno marginal para casos contactee. Aún acumulando evidencia
                útil en casos institucionales Tier 1/2.
              </>
            }
            en={
              <>
                <strong className="text-text">Status:</strong> marginal-return
                saturation for contactee cases. Still accumulating useful
                evidence in institutional Tier 1/2 cases.
              </>
            }
          />
        </Caption>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Capítulo 3" en="Chapter 3" />
          </Eyebrow>
          <H2>
            <T
              es="Las hipótesis NO son mutuamente excluyentes"
              en="Hypotheses are NOT mutually exclusive"
            />
          </H2>
        </div>
        <Body className="text-muted">
          <T
            es="Distinción crítica. Las hipótesis sobre UAP pueden ser parcialmente verdaderas simultáneamente. Por eso las probabilidades suman más de 100%. Esto no es error metodológico — es la estructura real del problema."
            en="Critical distinction. UAP hypotheses can be partially true simultaneously. That's why probabilities sum to more than 100%. This is not a methodological error — it's the real structure of the problem."
          />
        </Body>
        <div className="rounded-lg border border-border bg-surface-2 p-5">
          <Eyebrow>
            <T
              es="Ejemplo de probabilidades independientes (suman >100%)"
              en="Example of independent probabilities (sum >100%)"
            />
          </Eyebrow>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                97%
              </span>
              <span className="text-text">
                <T
                  es="Misidentificación (mayoría de reportes generales)"
                  en="Misidentification (most general reports)"
                />
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                95%
              </span>
              <span className="text-text">
                <T
                  es="El corpus contiene causas heterogéneas"
                  en="The corpus contains heterogeneous causes"
                />
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                88%
              </span>
              <span className="text-text">
                <T
                  es="≥1 caso es programa clasificado terrestre"
                  en="≥1 case is a terrestrial classified program"
                />
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                70%
              </span>
              <span className="text-text">
                <T
                  es="≥1 caso es fenómeno natural raro"
                  en="≥1 case is a rare natural phenomenon"
                />
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                45%
              </span>
              <span className="text-text">
                <T
                  es="≥1 caso involucra entidades no humanas"
                  en="≥1 case involves non-human entities"
                />
              </span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-muted tabular-nums">
                Σ &gt; 100%
              </span>
              <span className="text-muted">
                <T
                  es="suma supera 100% — y eso es correcto bajo no-exclusividad"
                  en="sum exceeds 100% — correct under non-exclusivity"
                />
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Capítulo 4" en="Chapter 4" />
          </Eyebrow>
          <H2>
            <T
              es="Probabilidades móviles vs estancadas"
              en="Moving vs stalled probabilities"
            />
          </H2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <MoveList
            es="Casi techo"
            en="Near ceiling"
            items={[
              "P(algo físico existe) = 90%",
              "P(programas clasificados) = 95%",
            ]}
            itemsEn={[
              "P(something physical exists) = 90%",
              "P(classified programs) = 95%",
            ]}
          />
          <MoveList
            es="Sitio activo"
            en="Active site"
            items={["P(pluralidad) = 48%", "P(pluralidad coordinada) ~40%"]}
            itemsEn={["P(plurality) = 48%", "P(coordinated plurality) ~40%"]}
            accent
          />
          <MoveList
            es="Estancadas"
            en="Stalled"
            items={[
              "P(humanos del futuro) = 12-15%",
              "P(tratado formal Greys) = 8%",
            ]}
            itemsEn={[
              "P(future humans) = 12-15%",
              "P(formal Grey treaty) = 8%",
            ]}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Capítulo 5" en="Chapter 5" />
          </Eyebrow>
          <H2>
            <T
              es="Qué movería el análisis ahora"
              en="What would move the analysis now"
            />
          </H2>
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
