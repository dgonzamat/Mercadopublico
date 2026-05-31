import { Eyebrow, H1, H2, Lede, Body, Caption, PullQuote } from "@/lib/typography";

export const metadata = {
  title: "Metodología · UAP Atlas",
  description:
    "Framework de cuatro tiers evidenciales, principio Bayesiano, no-exclusividad mutua de hipótesis",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-16 py-4">
      <header className="space-y-4">
        <Eyebrow>Metodología</Eyebrow>
        <H1>Cómo se construyó este análisis</H1>
        <Lede className="text-muted">
          Principios metodológicos explícitos. Qué cuenta como evidencia, cómo
          se evalúa, cómo se actualizan las probabilidades.
        </Lede>
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>Capítulo 1</Eyebrow>
          <H2>Framework de cuatro tiers evidenciales</H2>
        </div>
        <Body className="text-muted">
          No todos los casos UAP son equivalentes en valor evidencial. Mezclar
          tiers opaca el análisis e infla artificialmente la apariencia de
          evidencia. El público y la prensa frecuentemente conflactan tiers —
          esa es una fuente principal de confusión.
        </Body>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                  Tier
                </th>
                <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                  Categoría
                </th>
                <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                  Ejemplos
                </th>
                <th className="px-3 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted">
                  Confiabilidad
                </th>
              </tr>
            </thead>
            <tbody>
              <TierRow
                tier="1"
                cat="Institucional militar + sensor"
                examples="Tehran 1976, Belgian Wave, USPER 2025, Lake Huron"
                conf="75–88%"
                color="text-tierS"
              />
              <TierRow
                tier="2"
                cat="Institucional civil / multi-witness"
                examples="Ariel School, JAL 1628, Manises, Westall, Roswell"
                conf="65–85%"
                color="text-tierS"
              />
              <TierRow
                tier="3"
                cat="Folklórico / recurrente local"
                examples="Hessdalen, Popocatépetl, Marfa"
                conf="50–65%"
                color="text-tierA"
              />
              <TierRow
                tier="4"
                cat="Contactee / individual"
                examples="Meier, Sixto Paz, Adamski, Parkes"
                conf="40% exp. / <5% cosmología"
                color="text-tierB"
              />
            </tbody>
          </table>
        </div>
        <PullQuote>
          Una "evidencia" Tier 4 no debería usarse para soportar conclusiones
          que requieren Tier 1. El sistema deriva de las Close Encounter
          Categories de Hynek.
        </PullQuote>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>Capítulo 2</Eyebrow>
          <H2>Principio Bayesiano — qué casos mueven probabilidades</H2>
        </div>
        <Body className="text-muted">
          No todos los casos añaden evidencia igualmente. Algunos mueven la
          aguja; otros tienen retorno marginal nulo por repetición.
        </Body>
        <div className="grid gap-4 sm:grid-cols-2">
          <MoveList
            label="Mueve mucho"
            items={[
              "Tier 1/2 con multi-sensor (Tehran +5%)",
              "Categoría nueva (Hessdalen +categoría)",
              "Caso que contradice patrón establecido",
              "Sensores oficiales + video (Lake Huron +2%)",
            ]}
            accent
          />
          <MoveList
            label="Mueve poco o nada"
            items={[
              "Tier 4 contactee aislado (Meier 1-2%)",
              "Caso #50 del mismo patrón (~0%)",
              "Nueva predicción contactee fallada (baja, no sube)",
            ]}
          />
        </div>
        <Caption>
          <strong className="text-text">Estado:</strong> saturación de retorno
          marginal para casos contactee. Aún acumulando evidencia útil en casos
          institucionales Tier 1/2.
        </Caption>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>Capítulo 3</Eyebrow>
          <H2>Las hipótesis NO son mutuamente excluyentes</H2>
        </div>
        <Body className="text-muted">
          Distinción crítica. Las hipótesis sobre UAP pueden ser parcialmente
          verdaderas simultáneamente. Por eso las probabilidades suman más de
          100%. Esto no es error metodológico — es la estructura real del
          problema.
        </Body>
        <div className="rounded-lg border border-border bg-surface-2 p-5">
          <Eyebrow>Ejemplo de probabilidades coexistentes</Eyebrow>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                48%
              </span>
              <span className="text-text">Pluralidad de inteligencias</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                15%
              </span>
              <span className="text-text">Interdimensional</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                12%
              </span>
              <span className="text-text">Fenómeno natural no catalogado</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-accent tabular-nums">
                11%
              </span>
              <span className="text-text">Programa clasificado EE.UU.</span>
            </li>
            <li className="flex items-baseline gap-3">
              <span className="w-10 text-right font-mono text-muted tabular-nums">
                14%
              </span>
              <span className="text-muted">otras hipótesis</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>Capítulo 4</Eyebrow>
          <H2>Probabilidades móviles vs estancadas</H2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <MoveList
            label="Casi techo"
            items={[
              "P(algo físico existe) = 90%",
              "P(programas clasificados) = 95%",
            ]}
          />
          <MoveList
            label="Sitio activo"
            items={[
              "P(pluralidad) = 48%",
              "P(pluralidad coordinada) ~40%",
            ]}
            accent
          />
          <MoveList
            label="Estancadas"
            items={[
              "P(humanos del futuro) = 12-15%",
              "P(tratado formal Greys) = 8%",
            ]}
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>Capítulo 5</Eyebrow>
          <H2>Qué movería el análisis ahora</H2>
        </div>
        <ul className="space-y-3">
          {[
            { weight: "+++", color: "text-tierS", text: "Análisis isotópico independiente de residuos físicos publicado" },
            { weight: "+++", color: "text-tierS", text: "Material recuperado con fotos verificables" },
            { weight: "+++", color: "text-tierS", text: "Lake Huron fragmentos análisis publicado" },
            { weight: "+", color: "text-tierA", text: "Nuevo país que acknowledged formalmente" },
            { weight: "+", color: "text-tierA", text: "Otro Tehran-equivalente con sensor data" },
            { weight: "~0", color: "text-muted", text: "Nuevo contactee con cosmología detallada" },
          ].map((item, i) => (
            <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-3">
              <span className={`text-right font-mono text-xs ${item.color}`}>
                {item.weight}
              </span>
              <span className="text-text">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <Caption className="border-t border-border pt-6">
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
      </Caption>
    </article>
  );
}

function TierRow({
  tier,
  cat,
  examples,
  conf,
  color,
}: {
  tier: string;
  cat: string;
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
      <td className="px-3 py-3 align-top text-sm text-text">{cat}</td>
      <td className="px-3 py-3 align-top text-xs text-muted">{examples}</td>
      <td className="px-3 py-3 align-top font-mono text-xs tabular-nums text-text">
        {conf}
      </td>
    </tr>
  );
}

function MoveList({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p
        className={`font-mono text-xs uppercase tracking-widest ${
          accent ? "text-accent" : "text-muted"
        }`}
      >
        {label}
      </p>
      <ul className="space-y-1.5 text-xs text-text">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted">·</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
