import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { Cta } from "@/components/Cta";
import { CorpusStats } from "@/components/CorpusStats";
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
  ...pageMeta({
  title: "10-minute summary",
  description: `The accessible version of the analysis: ${STATS.years} years of institutional UAP phenomenon, ${STATS.cases} cases across ${STATS.countries} countries, in a 10-minute read.`,
  path: "/resumen/",
}),
  alternates: { canonical: "/resumen/", languages: hreflangFor("/resumen/") },
};

const FINDINGS = [
  {
    es: {
      confidence: "Alta",
      title: "El fenómeno es real",
      text: `${STATS.cases} casos documentados por gobiernos, militares, agencias y prensa entre 1947 y 2026, en ${STATS.countries} países. Los reportes existen y muchos están en papel oficial; en una parte hay registros de sensores (cámaras térmicas, radares en tierra y en el aire) y en otra solo testigos. Muchos tienen explicación ordinaria; el resto es lo que el corpus intenta medir, caso por caso.`,
    },
    en: {
      confidence: "High",
      title: "The phenomenon is real",
      text: `${STATS.cases} cases documented by governments, militaries, agencies and the press between 1947 and 2026, in ${STATS.countries} countries. The reports exist and many are on official paper; some have sensor records (thermal cameras, ground and airborne radar) and others rest only on witnesses. Many have an ordinary explanation; the rest is what the corpus tries to measure, case by case.`,
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
      text: "La liberación PURSUE (Presidential Unsealing and Reporting System for UAP Encounters) de mayo 2026 abre archivos al público con una mano. Con la otra, una propuesta del 26 de mayo (de la Oficina de Personal Federal, el organismo que regula a los empleados públicos) introduce un acuerdo de confidencialidad mucho más amplio que silencia, hacia adelante, a quien quiera denunciar irregularidades desde dentro del gobierno.",
    },
    en: {
      confidence: "Medium",
      title: "PURSUE 2026 is not real disclosure — it's strategic ambiguity",
      text: "The PURSUE release (Presidential Unsealing and Reporting System for UAP Encounters) of May 2026 opens archives to the public with one hand. With the other, a May 26 proposal (from the Office of Personnel Management, the agency that regulates federal employees) introduces a much broader non-disclosure agreement that silences, going forward, anyone who wants to report internal wrongdoing.",
    },
  },
  {
    es: {
      confidence: "Media",
      title: "Una teoría de 1975 que ayuda a leer este momento",
      text: "El astrofísico Jacques Vallée propuso en 1975 que la inteligencia detrás del fenómeno funciona como un sistema de control, uno que regula cuánto cree la sociedad en el tema, como un termostato. Vallée hablaba del fenómeno, no de los gobiernos; pero la forma en que PURSUE abre archivos, sin negar ni admitir del todo, recuerda a esa idea de apertura calibrada.",
    },
    en: {
      confidence: "Medium",
      title: "A 1975 theory that helps read this moment",
      text: "Astrophysicist Jacques Vallée proposed in 1975 that the intelligence behind the phenomenon works as a control system, one that regulates how much society believes in the topic, like a thermostat. Vallée was talking about the phenomenon, not about governments; but the way PURSUE opens archives, neither fully denying nor fully admitting, is reminiscent of that idea of calibrated openness.",
    },
  },
];

const THREE_FRASES = [
  {
    es: "Hay un fenómeno que las instituciones llevan documentando desde 1947 y que ninguna explicación única alcanza para cubrir por completo.",
    en: "There is a phenomenon institutions have been documenting since 1947, and no single explanation is enough to cover all of it.",
  },
  {
    es: "Desde mayo de 2026, el Gobierno de EE. UU. publica por entregas, en el programa PURSUE, archivos UAP antes clasificados. Los documentos salen sin una conclusión oficial: no confirman ni descartan nada.",
    en: "Since May 2026, the U.S. government has been publishing previously classified UAP files in installments, through the PURSUE program. The documents come out with no official conclusion: they neither confirm nor rule out anything.",
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
  return <ResumenView locale="en" />;
}

export function ResumenView({ locale }: { locale: "es" | "en" }) {
  return (
    <article className="mx-auto max-w-2xl space-y-16 py-4">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Lectura · 10 min" en="Read · 10 min" locale={locale} />
        </Eyebrow>
        <H1>
          <T
            es={`${STATS.years} años en 10 minutos`}
            en={`${STATS.years} years in 10 minutes`}
            locale={locale}
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={
              <>
                Versión accesible del análisis completo. Para profundidad
                técnica, ver{" "}
                <LocaleLink href="/probabilidades" className="text-accent hover:underline">
                  las probabilidades por explicación
                </LocaleLink>{" "}
                y{" "}
                <LocaleLink href="/about" className="text-accent hover:underline">
                  la metodología
                </LocaleLink>
                .
              </>
            }
            en={
              <>
                Accessible version of the full analysis. For technical depth,
                see{" "}
                <LocaleLink href="/probabilidades" className="text-accent hover:underline">
                  the per-explanation probabilities
                </LocaleLink>{" "}
                and{" "}
                <LocaleLink href="/about" className="text-accent hover:underline">
                  the methodology
                </LocaleLink>
                .
              </>
            }
            locale={locale}
          />
        </Lede>
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="La historia" en="The story" locale={locale} />
          </Eyebrow>
          <H2>
            <T es="En 3 frases" en="In 3 sentences" locale={locale} />
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
                <T es={para.es} en={para.en} locale={locale} />
              </Body>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-8">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Hallazgos" en="Findings" locale={locale} />
          </Eyebrow>
          <H2>
            <T
              es="Los 5 hechos que cambian la conversación"
              en="The 5 facts that change the conversation"
              locale={locale}
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
                      locale={locale}
                    />
                  </p>
                  <h3 className="text-lg font-semibold leading-snug text-text">
                    <T es={f.es.title} en={f.en.title} locale={locale} />
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  <T es={f.es.text} en={f.en.text} locale={locale} />
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Anclaje cuantitativo: tras los hallazgos cualitativos, lo que el
          corpus permite contar literalmente (tiers, eras, patrones). Reubicado
          desde /cases, donde competía con la navegación del archivo. */}
      <CorpusStats locale={locale} />

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>
            <T es="Aporte analítico" en="Analytical contribution" locale={locale} />
          </Eyebrow>
          <H2>
            <T
              es="La taxonomía de divulgación"
              en="The taxonomy of disclosure"
              locale={locale}
            />
          </H2>
        </div>
        <Body className="text-muted">
          <T
            es="Cuando una institución se enfrenta al fenómeno UAP, los casos muestran cuatro maneras distintas de manejarlo:"
            en="When an institution faces the UAP phenomenon, the cases show four distinct ways of handling it:"
            locale={locale}
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
                  locale={locale}
                />
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-6">
        <Eyebrow>
          <T es="Cierre" en="Closing" locale={locale} />
        </Eyebrow>
        <PullQuote>
          <T
            es={`PURSUE 2026 no es el fin del encubrimiento. Es su evolución a "transparencia controlada".`}
            en={`PURSUE 2026 is not the end of the cover-up. It is its evolution into "controlled transparency".`}
            locale={locale}
          />
        </PullQuote>
        <Body className="text-muted">
          <T
            es={`${STATS.years} años de un fenómeno que ninguna explicación única resuelve, gestionado por las instituciones con creciente sofisticación. El astrofísico Jacques Vallée describió este patrón en 1975 — ahora lo vemos en directo. Qué se decida hacer con la información es la pregunta política de nuestra generación.`}
            en={`${STATS.years} years of a phenomenon no single explanation resolves, managed institutionally with growing sophistication. Astrophysicist Jacques Vallée described this pattern in 1975 — we now see it in real time. What we decide to do with the information is the political question of our generation.`}
            locale={locale}
          />
        </Body>
      </section>

      {/* CE-1/T-1 (extensión de la auditoría a esta página): primitiva Cta,
          esquinas vivas, un solo primary. */}
      <nav className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Cta href="/cases" variant="primary">
          <T
            es={`Explorar los ${STATS.cases} casos →`}
            en={`Explore the ${STATS.cases} cases →`}
            locale={locale}
          />
        </Cta>
        <Cta href="/probabilidades" variant="secondary">
          <T
            es="Cómo se reparte el archivo entre explicaciones"
            en="How the archive splits among the explanations"
            locale={locale}
          />
        </Cta>
        <Cta href="/atlas" variant="secondary">
          <T
            es={`Ver el mapa global · ${STATS.countries} países`}
            en={`See the global map · ${STATS.countries} countries`}
            locale={locale}
          />
        </Cta>
      </nav>
    </article>
  );
}
