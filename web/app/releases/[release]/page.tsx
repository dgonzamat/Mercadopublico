import { notFound } from "next/navigation";
import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { cases } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

// Releases del PURSUE/AARO presentes en el corpus (deriva del campo
// `pursueReleases`, no se hardcodea el conjunto).
const RELEASES: number[] = Array.from(
  new Set(cases.flatMap((c) => c.pursueReleases ?? [])),
).sort((a, b) => a - b);

const pad = (n: number) => String(n).padStart(2, "0");

// La "más reciente" se DERIVA del conjunto, nunca se escribe en el copy:
// el blurb de la quinta entrega siguió proclamándose la más reciente seis
// semanas después de dejar de serlo (sep 2026).
const LATEST = Math.max(...RELEASES);

const RELEASE_META: Record<
  number,
  {
    es: string;
    en: string;
    blurbEs: string;
    blurbEn: string;
    // Lo que pasó alrededor de la entrega y no es un caso: una reacción
    // oficial o un organismo nuevo. Va con su fuente, porque no tiene ficha.
    context?: { es: string; en: string; source: string; url: string };
  }
> = {
  1: {
    es: "PURSUE · Primera entrega",
    en: "PURSUE · First release",
    blurbEs:
      "El drop histórico fundacional del Departamento de Guerra: expedientes del FBI y de la USAF temprana.",
    blurbEn:
      "The foundational historic drop from the Department of War: FBI and early-USAF files.",
    context: {
      es: "El 11 de mayo de 2026, tres días después de la primera entrega, el secretario jefe del Gabinete de Japón, Minoru Kihara, se refirió a ella en su rueda de prensa ordinaria. La entrega incluía dos vídeos grabados cerca de Japón. Kihara dijo que el Gobierno reúne y analiza de forma constante, con gran interés, la información sobre incidentes que afectan a la seguridad nacional, incluidos los UAP, en estrecha coordinación con Estados Unidos y otros países. Preguntado si Japón publicaría archivos parecidos, respondió que se decidiría caso por caso, sopesando entre otros factores el riesgo de revelar su capacidad de obtener información.",
      en: "On 11 May 2026, three days after the first release, Japan's Chief Cabinet Secretary, Minoru Kihara, addressed it at his regular news conference. The release included two videos recorded near Japan. Kihara said the government is constantly gathering and analyzing information with great interest on incidents related to national security, including UAP, in close coordination with the United States and other countries. Asked whether Japan would disclose similar files, he said decisions would be made case by case, weighing among other factors the risk of exposing its intelligence-gathering capabilities.",
      source: "The Japan Times",
      url: "https://www.japantimes.co.jp/news/2026/05/11/japan/us-pentagon-japan-ufos/",
    },
  },
  2: {
    es: "PURSUE · Segunda entrega",
    en: "PURSUE · Second release",
    blurbEs:
      "Expedientes DOE / DOW / CIA, incluida la correspondencia de Sandia sobre las 'green fireballs'.",
    blurbEn:
      "DOE / DOW / CIA files, including the Sandia correspondence on the 'green fireballs'.",
  },
  3: {
    es: "PURSUE · Tercera entrega",
    en: "PURSUE · Third release",
    blurbEs:
      "El archivo histórico de la CIA: Panel Robertson, programa U-2 e inteligencia exterior.",
    blurbEn:
      "The CIA historical archive: Robertson Panel, the U-2 program and foreign intelligence.",
    context: {
      es: "El 16 de junio de 2026, cuatro días después de la tercera entrega, un funcionario de la Oficina del Director de Inteligencia Nacional (ODNI) dijo a Liberation Times que la ODNI, junto al FBI y al Departamento de Guerra, había creado un UAP Governance Board para dar orientación, recomendaciones y coordinación a organismos militares, policiales, de inteligencia y civiles. Según el funcionario, la junta se había reunido por primera vez el día anterior. Su carta fundacional le encarga coordinar a tiempo la desclasificación de información sobre UAP conforme a la Orden Ejecutiva 13526 y mejorar el apoyo a AARO. Sus miembros no se hicieron públicos.",
      en: "On 16 June 2026, four days after the third release, an official from the Office of the Director of National Intelligence (ODNI) told Liberation Times that ODNI, alongside the FBI and the Department of War, had established a UAP Governance Board to provide guidance, recommendations and coordination across military, law enforcement, intelligence and civilian agencies. The official said the board had met for the first time the day before. Its charter tasks it with the timely coordination of declassification of UAP-related information under Executive Order 13526 and with more effective support to AARO. Its members were not named.",
      source: "Liberation Times",
      url: "https://www.liberationtimes.com/home/us-establishes-new-interagency-uap-governance-board-to-coordinate-investigations-and-declassification",
    },
  },
  4: {
    es: "PURSUE · Cuarta entrega",
    en: "PURSUE · Fourth release",
    blurbEs:
      "El incidente nuclear de Pantex (2015), imágenes de la NASA (STS-80), los formularios Range Fouler de la Marina y los análisis de las eras Sign y Blue Book.",
    blurbEn:
      "The Pantex nuclear incident (2015), NASA imagery (STS-80), the Navy Range Fouler forms and the Sign/Blue Book-era analyses.",
  },
  5: {
    es: "PURSUE · Quinta entrega",
    en: "PURSUE · Fifth release",
    blurbEs:
      "Cables del Departamento de Estado sobre Puerto Rico (1964) y Bahía (1963), y una serie de expedientes FBI/DoW 2011-2026 — el golfo de Omán, triángulos en Colorado Springs y luces recurrentes de un piloto comercial.",
    blurbEn:
      "State Department cables on Puerto Rico (1964) and Bahia (1963), and a series of FBI/DoW files spanning 2011-2026 — the Gulf of Oman, Colorado Springs triangles and a commercial pilot's recurring lights.",
  },
  6: {
    es: "PURSUE · Sexta entrega",
    en: "PURSUE · Sixth release",
    blurbEs:
      "El papeleo contractual completo del programa AAWSAP y sus 37 documentos de referencia (DIRD), el expediente Blue Book del film de Tremonton (1952) y la grabación de Ruppelt en el MIT Lincoln Laboratory, partes de misión de Irak y Oriente Medio, clips de sensor sobre el mar Amarillo y el mar de China Oriental, y el primer material aportado por una policía local (Colorado, 2023).",
    blurbEn:
      "The full contractual paperwork of the AAWSAP program and its 37 reference documents (DIRDs), the Blue Book file on the Tremonton film (1952) and Ruppelt's recording at MIT Lincoln Laboratory, mission reports from Iraq and the Middle East, sensor clips over the Yellow Sea and the East China Sea, and the first material contributed by a local police force (Colorado, 2023).",
  },
};

export function generateStaticParams() {
  return RELEASES.map((r) => ({ release: pad(r) }));
}

function parseRelease(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && RELEASES.includes(n) ? n : null;
}

export async function generateMetadata(props: {
  params: Promise<{ release: string }>;
}) {
  const { release } = await props.params;
  const n = parseRelease(release);
  if (!n) return {};
  const count = cases.filter((c) => c.pursueReleases?.includes(n)).length;
  const enPath = `/releases/${pad(n)}/`;
  return {
    ...pageMeta({
      title: `PURSUE Release ${pad(n)} — ${count} corpus cases`,
      description: `The ${count} UAP Codex cases that cite documents from PURSUE/AARO Release ${pad(n)} (Department of War declassification).`,
      path: enPath,
    }),
    // `/es/releases/[release]/` ya declara su hreflang recíproco vía esMeta; sin
    // esta mitad la anotación es unidireccional y Google la ignora.
    alternates: { canonical: enPath, languages: hreflangFor(enPath) },
  };
}

export async function ReleasePage({
  params,
  locale = "en",
}: {
  params: Promise<{ release: string }>;
  locale?: "es" | "en";
}) {
  const { release } = await params;
  const n = parseRelease(release);
  if (!n) notFound();

  const list = cases
    .filter((c) => c.pursueReleases?.includes(n))
    .sort((a, b) => b.num - a.num);
  const t = { S: 0, A: 0, B: 0 };
  for (const c of list) t[c.tier] += 1;
  const meta = RELEASE_META[n] ?? {
    es: `PURSUE · Release ${pad(n)}`,
    en: `PURSUE · Release ${pad(n)}`,
    blurbEs: "",
    blurbEn: "",
  };

  return (
    <div className="space-y-8 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T
            es={`PURSUE / AARO · Release ${pad(n)}${n === LATEST ? " · la más reciente" : ""}`}
            en={`PURSUE / AARO · Release ${pad(n)}${n === LATEST ? " · the most recent" : ""}`}
            locale={locale}
          />
        </Eyebrow>
        <H1>
          <T es={meta.es} en={meta.en} locale={locale} />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es={`${list.length} casos usan documentos de esta entrega. ${meta.blurbEs}`}
            en={`${list.length} cases use documents from this release. ${meta.blurbEn}`}
            locale={locale}
          />
        </Lede>
        {meta.context && (
          <p className="max-w-3xl text-sm leading-relaxed text-text">
            <T es={meta.context.es} en={meta.context.en} locale={locale} />{" "}
            <a
              href={meta.context.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted underline decoration-dotted hover:text-accent"
            >
              {meta.context.source} ↗
            </a>
          </p>
        )}
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {list.length} <T es="casos" en="cases" locale={locale} /> · Tier S {t.S} · A {t.A} · B {t.B}
        </p>
      </header>

      <section className="border-t border-border">
        {list.map((c) => (
          <CaseRow key={c.id} caseData={c} locale={locale} />
        ))}
      </section>

      <nav className="flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        <LocaleLink
          href="/releases"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="← Todas las releases" en="← All releases" locale={locale} />
        </LocaleLink>
        <LocaleLink
          href="/cases"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="Todos los casos" en="All cases" locale={locale} />
        </LocaleLink>
        <a
          href="https://www.war.gov/UFO/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="Fuente oficial (war.gov) ↗" en="Official source (war.gov) ↗" locale={locale} />
        </a>
      </nav>
    </div>
  );
}

export default ReleasePage;
