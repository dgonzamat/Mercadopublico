import Link from "next/link";
import { STATS } from "@/lib/siteStats";
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
  title: "Resumen",
  description: `Versión accesible del análisis: ${STATS.years} años de fenómeno UAP institucional, ${STATS.cases} casos en ${STATS.countries} países, en 10 minutos de lectura.`,
};

const FINDINGS = [
  {
    es: {
      confidence: "Alta",
      title: "El fenómeno es real",
      text: `${STATS.cases} casos institucionales documentados por gobiernos, militares y agencias entre 1947 y 2026, en ${STATS.countries} países. No es un puñado de testigos contando lo mismo: son cámaras térmicas militares, radares en tierra y en el aire, ondas de presión registradas, materiales recuperados, daño físico verificable. Evidencia distribuida en sensores que no se hablan entre sí.`,
    },
    en: {
      confidence: "High",
      title: "The phenomenon is real",
      text: `${STATS.cases} institutional cases documented by governments, militaries and agencies between 1947 and 2026, in ${STATS.countries} countries. It's not a handful of witnesses telling the same story: it's military thermal cameras, ground and airborne radar, recorded pressure waves, recovered materials, verifiable physical damage. Evidence spread across sensors that don't talk to each other.`,
    },
  },
  {
    es: {
      confidence: "Alta",
      title: "No es UNA cosa — son varias",
      text: "Los reportes describen al menos nueve formas distintas — discos, esferas, triángulos, cilindros, 'tic-tacs', anillos — y cinco modos diferentes de interactuar con humanos, desde indiferencia total hasta encuentro físico documentado. Un fenómeno único no produciría esa variedad.",
    },
    en: {
      confidence: "High",
      title: "It's not ONE thing — there are several",
      text: "Reports describe at least nine distinct shapes — discs, spheres, triangles, cylinders, 'tic-tacs', rings — and five different modes of interaction with humans, from total indifference to documented physical encounter. A single phenomenon would not produce that variety.",
    },
  },
  {
    es: {
      confidence: "Alta",
      title: "Los gobiernos saben más de lo que dicen",
      text: "Hay una secuencia documental, papel firmado, que va de un memo del general Twining a la fuerza aérea en 1947 (el fenómeno es 'real, no visionario') a la divulgación presidencial de mayo 2026. En el medio: el panel Robertson lo declara amenaza psicológica (1953), el memo Bolender cierra Project Blue Book pero admite que hay reportes 'que sí afectan la seguridad nacional' (1969), filtraciones Wilson-Davis (2002), y el testimonio bajo juramento de David Grusch ante el Congreso (2023). Cada pieza es auditable. Ninguna es rumor.",
    },
    en: {
      confidence: "High",
      title: "Governments know more than they say",
      text: "There is a documented chain, signed paper, going from a 1947 memo by General Twining to the Air Force ('the phenomenon is real, not visionary') to the May 2026 presidential disclosure. In between: the Robertson panel labels it a psychological threat (1953), the Bolender memo closes Project Blue Book but admits there are reports 'that do affect national security' (1969), the Wilson-Davis leaks (2002), and David Grusch's sworn testimony to Congress (2023). Every piece is auditable. None is rumor.",
    },
  },
  {
    es: {
      confidence: "Media",
      title: "PURSUE 2026 no es divulgación real — es ambigüedad estratégica",
      text: "La liberación PURSUE (Presidential Unified UAP Records Repository and Strategic Engagement) de mayo 2026 abre archivos al público con una mano. Con la otra, una propuesta del 26 de mayo (de la Oficina de Personal Federal, el organismo que regula a los empleados públicos) introduce un acuerdo de confidencialidad mucho más amplio que silencia, hacia adelante, a quien quiera denunciar irregularidades desde dentro del gobierno.",
    },
    en: {
      confidence: "Medium",
      title: "PURSUE 2026 is not real disclosure — it's strategic ambiguity",
      text: "The PURSUE release (Presidential Unified UAP Records Repository and Strategic Engagement) of May 2026 opens archives to the public with one hand. With the other, a May 26 proposal (from the Office of Personnel Management, the agency that regulates federal employees) introduces a much broader non-disclosure agreement that silences, going forward, anyone who wants to report internal wrongdoing.",
    },
  },
  {
    es: {
      confidence: "Media",
      title: "Una teoría de 1975 anticipó este momento",
      text: "El astrofísico Jacques Vallée propuso en 1975 que el manejo institucional del fenómeno funciona como un mecanismo de control — uno que regula cuánto cree la sociedad en el tema, como un termostato. PURSUE encaja exactamente con esa descripción: ni negación total ni admisión total, sino apertura calibrada. 51 años de predicción cumplida.",
    },
    en: {
      confidence: "Medium",
      title: "A 1975 theory anticipated this moment",
      text: "Astrophysicist Jacques Vallée proposed in 1975 that institutional handling of the phenomenon works as a control mechanism — one that regulates how much society believes in the topic, like a thermostat. PURSUE fits that description exactly: neither full denial nor full admission, but calibrated openness. 51 years of fulfilled prediction.",
    },
  },
];

const THREE_FRASES = [
  {
    es: "Hay un fenómeno que las instituciones llevan documentando desde 1947 y que ninguna explicación única alcanza para cubrir por completo.",
    en: "There is a phenomenon institutions have been documenting since 1947, and no single explanation is enough to cover all of it.",
  },
  {
    es: "En mayo de 2026, Estados Unidos liberó por primera vez archivos masivos sobre el tema — una operación llamada PURSUE, la primera divulgación presidencial de la historia. Pero la liberación fue cuidadosamente curada para no afirmar ni negar nada sustantivo.",
    en: "In May 2026, the United States released massive archives on the topic for the first time — an operation called PURSUE, the first presidential disclosure in history. But the release was carefully curated to neither affirm nor deny anything substantive.",
  },
  {
    es: "Cómo se está liberando la información importa más que el contenido mismo de lo liberado.",
    en: "How information is being released matters more than what is actually released.",
  },
];

const TAXONOMY = [
  {
    code: "8m",
    es: { label: "Encubrimiento clásico", desc: "el mensaje oficial es 'no hay nada que ver'" },
    en: { label: "Classic cover-up", desc: "the official message is 'nothing to see here'" },
  },
  {
    code: "8n",
    es: {
      label: "Ambigüedad estratégica",
      desc: "el estado muestra todo y deja al público decidir (es lo que hace PURSUE 2026)",
    },
    en: {
      label: "Strategic ambiguity",
      desc: "the state shows everything and lets the public decide (this is what PURSUE 2026 does)",
    },
  },
  {
    code: "8q",
    es: {
      label: "Ecosistema de presión",
      desc: "políticos, periodistas y denunciantes empujan en simultáneo para forzar la apertura",
    },
    en: {
      label: "Pressure ecosystem",
      desc: "politicians, journalists and whistleblowers push together to force openness",
    },
  },
  {
    code: "8r",
    es: { label: "Filtraciones", desc: "alguien decidió por su cuenta liberar información clasificada" },
    en: { label: "Leaks", desc: "someone decided on their own to release classified information" },
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
          <T
            es={`${STATS.years} años en 10 minutos`}
            en={`${STATS.years} years in 10 minutes`}
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={
              <>
                Versión accesible del análisis completo. Para profundidad
                técnica, ver{" "}
                <Link href="/probabilidades" className="text-accent hover:underline">
                  /probabilidades
                </Link>{" "}
                y{" "}
                <Link href="/about" className="text-accent hover:underline">
                  /about
                </Link>
                .
              </>
            }
            en={
              <>
                Accessible version of the full analysis. For technical depth,
                see{" "}
                <Link href="/probabilidades" className="text-accent hover:underline">
                  /probabilidades
                </Link>{" "}
                and{" "}
                <Link href="/about" className="text-accent hover:underline">
                  /about
                </Link>
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
            <T
              es="Los 5 hechos que cambian la conversación"
              en="The 5 facts that change the conversation"
            />
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
              es="La taxonomía de divulgación"
              en="The taxonomy of disclosure"
            />
          </H2>
        </div>
        <Body className="text-muted">
          <T
            es="Cuando una institución se enfrenta al fenómeno UAP, el corpus identifica cuatro maneras distintas de manejarlo:"
            en="When an institution faces the UAP phenomenon, the corpus identifies four distinct ways of handling it:"
          />
        </Body>
        <ol className="space-y-3">
          {TAXONOMY.map((item, i) => (
            <li
              key={item.code}
              className="grid grid-cols-[2rem_1fr] gap-3 text-sm"
            >
              <span className="font-display text-lg leading-none tabular-nums text-accent">
                {i + 1}
              </span>
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
        </ol>
      </section>

      <section className="space-y-6">
        <Eyebrow>
          <T es="Cierre" en="Closing" />
        </Eyebrow>
        <PullQuote>
          <T
            es={`PURSUE 2026 no es el fin del encubrimiento. Es su evolución a "transparencia controlada".`}
            en={`PURSUE 2026 is not the end of the cover-up. It is its evolution into "controlled transparency".`}
          />
        </PullQuote>
        <Body className="text-muted">
          <T
            es={`${STATS.years} años de un fenómeno que ninguna explicación única resuelve, gestionado por las instituciones con creciente sofisticación. El astrofísico Jacques Vallée describió este patrón en 1975 — ahora lo vemos en directo. Qué se decida hacer con la información es la pregunta política de nuestra generación.`}
            en={`${STATS.years} years of a phenomenon no single explanation resolves, managed institutionally with growing sophistication. Astrophysicist Jacques Vallée described this pattern in 1975 — we now see it in real time. What we decide to do with the information is the political question of our generation.`}
          />
        </Body>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center rounded-md bg-accent px-5 py-2 text-sm font-medium text-bg hover:bg-accent/90"
        >
          <T
            es={`Explorar ${STATS.cases} casos →`}
            en={`Explore ${STATS.cases} cases →`}
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
