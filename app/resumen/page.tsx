import Link from "next/link";
import { TOTAL_CASES } from "@/lib/data";
import { T } from "@/components/T";
import {
  Eyebrow,
  H1,
  H2,
  Lede,
  Body,
  PullQuote,
} from "@/lib/typography";

export const metadata = {
  title: "Summary · UAP Atlas",
  description: "Accessible version of the analysis in plain language",
};

const FINDINGS = [
  {
    es: {
      confidence: "~95%",
      title: "El fenómeno es real",
      text: `${TOTAL_CASES} casos institucionales documentados por gobiernos, militares y agencias entre 1947 y 2026, en 12 países. Multi-sensor, multi-witness, fotos, video, radar, daño físico medible.`,
    },
    en: {
      confidence: "~95%",
      title: "The phenomenon is real",
      text: `${TOTAL_CASES} institutional cases documented by governments, militaries and agencies between 1947 and 2026, in 12 countries. Multi-sensor, multi-witness, photos, video, radar, measurable physical damage.`,
    },
  },
  {
    es: {
      confidence: "alta",
      title: "No es UNA cosa — son varias",
      text: "9 morfologías distintas, 5 modos de interacción con humanos, casos contradictorios entre sí. La explicación honesta requiere pluralidad.",
    },
    en: {
      confidence: "high",
      title: "It's not ONE thing — there are several",
      text: "9 distinct morphologies, 5 modes of interaction with humans, cases that contradict each other. The honest explanation requires plurality.",
    },
  },
  {
    es: {
      confidence: "~95%",
      title: "Los gobiernos saben más de lo que dicen",
      text: "Secuencia documental verificable: Twining 1947 → Robertson 1953 → Bolender 1969 → Wilson-Davis 2002 → Grusch 2023 → PURSUE 2026.",
    },
    en: {
      confidence: "~95%",
      title: "Governments know more than they say",
      text: "Verifiable documentary sequence: Twining 1947 → Robertson 1953 → Bolender 1969 → Wilson-Davis 2002 → Grusch 2023 → PURSUE 2026.",
    },
  },
  {
    es: {
      confidence: "alta",
      title: "PURSUE 2026 NO es disclosure real — es ambigüedad estratégica",
      text: "Mano derecha: abre archivos. Mano izquierda: propuesta OPM NDA (26 may) silencia futuros whistleblowers federales.",
    },
    en: {
      confidence: "high",
      title: "PURSUE 2026 is NOT real disclosure — it's strategic ambiguity",
      text: "Right hand: opens archives. Left hand: OPM NDA proposal (May 26) silences future federal whistleblowers.",
    },
  },
  {
    es: {
      confidence: "verificable",
      title: "El framework de Vallée (1975) predijo PURSUE 2026",
      text: "Vallée propuso un termostato cibernético que regula creencia colectiva. PURSUE encaja exactamente. 51 años de predicción cumplida.",
    },
    en: {
      confidence: "verifiable",
      title: "Vallée's framework (1975) predicted PURSUE 2026",
      text: "Vallée proposed a cybernetic thermostat regulating collective belief. PURSUE fits exactly. 51 years of fulfilled prediction.",
    },
  },
];

const THREE_FRASES = [
  {
    es: "Hay un fenómeno físico real que los gobiernos llevan documentando desde 1947 y que ningún marco interpretativo único explica completamente.",
    en: "There is a real physical phenomenon that governments have been documenting since 1947 and that no single interpretive framework explains completely.",
  },
  {
    es: "En mayo 2026, Estados Unidos liberó archivos masivos sobre UAP (PURSUE) — pero la liberación fue cuidadosamente curada para no afirmar ni negar nada sustantivo.",
    en: "In May 2026, the United States released massive UAP archives (PURSUE) — but the release was carefully curated to neither affirm nor deny anything substantive.",
  },
  {
    es: "La forma en que se está liberando información importa más que el contenido liberado.",
    en: "The way information is being released matters more than the content released.",
  },
];

const TAXONOMY = [
  {
    code: "8m",
    es: { label: "Cover-up clásico", desc: "no hay nada que ver" },
    en: { label: "Classic cover-up", desc: "nothing to see here" },
  },
  {
    code: "8n",
    es: {
      label: "Ambigüedad estratégica",
      desc: "miren todo, decidan ustedes (PURSUE 2026)",
    },
    en: {
      label: "Strategic ambiguity",
      desc: "look at everything, you decide (PURSUE 2026)",
    },
  },
  {
    code: "8q",
    es: {
      label: "Ecosystem de disclosure",
      desc: "políticos + periodistas + whistleblowers fuerzan apertura",
    },
    en: {
      label: "Disclosure ecosystem",
      desc: "politicians + journalists + whistleblowers force openness",
    },
  },
  {
    code: "8r",
    es: { label: "Leaks", desc: "alguien filtró sin permiso" },
    en: { label: "Leaks", desc: "someone leaked without permission" },
  },
];

export default function ResumenPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-16 py-4">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Lectura · 10 min" en="Read · 10 min" />
        </Eyebrow>
        <H1>
          <T es="Resumen del análisis" en="Analysis summary" />
        </H1>
        <Lede className="text-muted">
          <T
            es={
              <>
                Versión accesible del análisis completo. Para depth técnico ver
                el corpus en{" "}
                <a
                  className="text-accent hover:underline"
                  href="https://github.com/dgonzamat/UAP-analysys-"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/dgonzamat/UAP-analysys- ↗
                </a>
                .
              </>
            }
            en={
              <>
                Accessible version of the full analysis. For technical depth see
                the corpus at{" "}
                <a
                  className="text-accent hover:underline"
                  href="https://github.com/dgonzamat/UAP-analysys-"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/dgonzamat/UAP-analysys- ↗
                </a>
                .
              </>
            }
          />
        </Lede>
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="La historia" en="The story" />
          </Eyebrow>
          <H2>
            <T es="En 3 frases" en="In 3 sentences" />
          </H2>
        </div>
        <ol className="space-y-4">
          {THREE_FRASES.map((para, i) => (
            <li
              key={i}
              className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3"
            >
              <span className="text-right font-display text-2xl leading-none tabular-nums text-accent">
                {i + 1}
              </span>
              <Body>
                <T es={para.es} en={para.en} />
              </Body>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-8">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Hallazgos" en="Findings" />
          </Eyebrow>
          <H2>
            <T es="Los 5 más importantes" en="The 5 most important" />
          </H2>
        </div>
        <div className="space-y-10">
          {FINDINGS.map((f, i) => (
            <article
              key={i}
              className="grid grid-cols-[3rem_1fr] gap-4 border-l border-border pl-4"
            >
              <span className="font-display text-3xl leading-none tabular-nums text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted">
                    <T
                      es={`Confianza · ${f.es.confidence}`}
                      en={`Confidence · ${f.en.confidence}`}
                    />
                  </p>
                  <h3 className="text-lg font-semibold leading-snug text-text">
                    <T es={f.es.title} en={f.en.title} />
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  <T es={f.es.text} en={f.en.text} />
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Aporte analítico" en="Analytical contribution" />
          </Eyebrow>
          <H2>
            <T
              es="La taxonomía de disclosure"
              en="The taxonomy of disclosure"
            />
          </H2>
        </div>
        <Body className="text-muted">
          <T
            es="Cualquier evento UAP institucional cae en una de cuatro categorías:"
            en="Any institutional UAP event falls into one of four categories:"
          />
        </Body>
        <ul className="space-y-3">
          {TAXONOMY.map((item) => (
            <li
              key={item.code}
              className="grid grid-cols-[3rem_1fr] gap-3 text-sm"
            >
              <span className="font-mono text-accent">{item.code}</span>
              <span className="text-text">
                <T
                  es={
                    <>
                      <strong>{item.es.label}</strong>{" "}
                      <span className="text-muted">— {item.es.desc}</span>
                    </>
                  }
                  en={
                    <>
                      <strong>{item.en.label}</strong>{" "}
                      <span className="text-muted">— {item.en.desc}</span>
                    </>
                  }
                />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <Eyebrow>
          <T es="Cierre" en="Closing" />
        </Eyebrow>
        <PullQuote>
          <T
            es={`El corpus documenta 79 años de un fenómeno real que ningún marco explica completamente, gestionado institucionalmente con creciente sofisticación. PURSUE 2026 es la fase actual de esa gestión — no el fin del cover-up, sino su evolución a "transparencia controlada". El framework de Vallée predijo este momento en 1975. Lo que decidamos hacer con la información ahora es la pregunta política y filosófica de nuestra generación.`}
            en={`The corpus documents 79 years of a real phenomenon that no framework explains completely, institutionally managed with growing sophistication. PURSUE 2026 is the current phase of that management — not the end of the cover-up but its evolution into "controlled transparency". Vallée's framework predicted this moment in 1975. What we decide to do with the information now is the political and philosophical question of our generation.`}
          />
        </PullQuote>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center rounded-md bg-accent px-5 py-2 text-sm font-medium text-bg hover:bg-accent/90"
        >
          <T
            es={`Explorar ${TOTAL_CASES} casos →`}
            en={`Explore ${TOTAL_CASES} cases →`}
          />
        </Link>
        <Link
          href="/probabilidades"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-5 py-2 text-sm font-medium text-text hover:bg-panel"
        >
          <T es="Ver razonamiento" en="See reasoning" />
        </Link>
        <Link
          href="/atlas"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-5 py-2 text-sm font-medium text-text hover:bg-panel"
        >
          <T es="Mapa" en="Map" />
        </Link>
      </nav>
    </article>
  );
}
