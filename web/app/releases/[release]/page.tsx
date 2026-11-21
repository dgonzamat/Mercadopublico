import { notFound } from "next/navigation";
import { LocaleLink } from "@/components/LocaleLink";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PrevNext } from "@/components/PrevNext";
import { ShareButton } from "@/components/ShareButton";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { cases } from "@/lib/data";
import releaseVideos from "@/data/release-videos.json";
import releaseDocuments from "@/data/release-documents.json";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import { CaseRow } from "@/components/CaseRow";
import { T } from "@/components/T";
import DvidsVideo from "@/components/DvidsVideo";
import { Eyebrow, H1, Lede } from "@/lib/typography";

// Releases del PURSUE/AARO presentes en el corpus (deriva del campo
// `pursueReleases`, no se hardcodea el conjunto).
const RELEASES: number[] = Array.from(
  new Set(cases.flatMap((c) => c.pursueReleases ?? [])),
).sort((a, b) => a - b);

const pad = (n: number) => String(n).padStart(2, "0");

// Videos de DVIDS de cada entrega que no sostienen un caso propio. Vivían en
// fichas de catálogo que se retiraron el 15 oct 2026 (ningún documento tiene
// ficha propia) y quedaron fuera del sitio; aquí se listan con el título, la
// fecha y la procedencia que da DVIDS (nov 2026).
type ReleaseVideo = {
  release: number;
  code: string;
  dvidsId: string;
  title: string;
  // El título sin el código; en la 02 es el del uploader, sin comillas (DVIDS
  // deja abierta la de 18 de ellos), y las pone la página.
  label: string;
  date: string;
  submittedBy: string | null;
  reports: string[] | null;
};

// Informes de la entrega que no respaldan ningún caso del corpus (los PDF de la
// ficha retirada dow-centcom-2020, nov 2026). `videos` son los vídeos de DVIDS
// con los que forman pareja; los que no tienen pareja se listan aparte.
type ReleaseDocument = {
  release: number;
  code: string;
  src: string;
  date: string | null;
  type: string;
  type_en: string;
  place: string;
  place_en: string;
  videos: string[] | null;
};

// DVIDS pone el día 1 cuando solo se sabe el mes, y el 1 de enero cuando solo
// se sabe el año: los datos guardan AAAA, AAAA-MM o AAAA-MM-DD.
function videoDate(d: string, locale: "es" | "en") {
  if (d.length === 4) return d;
  const [y, m, day] = d.split("-").map(Number);
  const opts: Intl.DateTimeFormatOptions =
    day ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } : { month: "long", year: "numeric", timeZone: "UTC" };
  return new Date(Date.UTC(y, m - 1, day || 1)).toLocaleDateString(locale === "es" ? "es" : "en-US", opts);
}

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
  7: {
    es: "PURSUE · Séptima entrega",
    en: "PURSUE · Seventh release",
    blurbEs:
      "Veintiocho documentos y ningún vídeo: el triángulo negro que tres agentes federales vieron en 2026 en un sitio sensible del oeste de EE. UU. (la declaración del FBI y el memorando de la AARO), papeles del programa BAASS/AAWSAP y de la investigación del rancho de Utah (2008-2010), quince expedientes de la Fuerza Aérea de 1949 a 1957 (Arabia Saudita, Guam, Sassari, Prince George, Berlín, Marruecos, Alaska, Hässleholm, Seymour, la isla Catalina), la hoja de servicio de Howard McCoy y la correspondencia de 1962 a 1964 entre la Casa Blanca, la NASA y Defensa sobre fragmentos de vehículos espaciales.",
    blurbEn:
      "Twenty-eight documents and no video: the black triangle three federal agents saw in 2026 at a sensitive site in the western U.S. (the FBI statement and the AARO memorandum), papers from the BAASS/AAWSAP program and the Utah ranch investigation (2008-2010), fifteen Air Force files from 1949 to 1957 (Saudi Arabia, Guam, Sassari, Prince George, Berlin, Morocco, Alaska, Hässleholm, Seymour, Catalina Island), Howard McCoy's service record, and 1962-1964 White House, NASA and Defense correspondence on space-vehicle fragments.",
  },
  8: {
    es: "PURSUE · Octava entrega",
    en: "PURSUE · Eighth release",
    blurbEs:
      "Cuarenta documentos y tres vídeos: la serie de 1952 de la Oficina de Inteligencia Científica de la CIA que llevó al Panel Robertson, papeles de 2008 a 2010 del programa AAWSAP con la correspondencia del senador Harry Reid, informes de inteligencia aérea de la Fuerza Aérea de 1956 y 1957 (Levelland, White Sands, Kirtland, Perú, Irán, Japón), expedientes de California de 1949 a 1966, una lámina de la AARO sobre una detección de radar de 2023 y tres clips de sensor de CENTCOM.",
    blurbEn:
      "Forty documents and three videos: the CIA Office of Scientific Intelligence's 1952 series that led to the Robertson Panel, 2008-2010 papers from the AAWSAP program with Senator Harry Reid's correspondence, Air Force air intelligence reports from 1956 and 1957 (Levelland, White Sands, Kirtland, Peru, Iran, Japan), California files from 1949 to 1966, an AARO slide on a 2023 radar detection, and three CENTCOM sensor clips.",
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
  const videos = (releaseVideos as ReleaseVideo[]).filter((v) => v.release === n);
  const docs = (releaseDocuments as ReleaseDocument[]).filter((d) => d.release === n);
  const docsFor = (code: string) => docs.filter((d) => d.videos?.includes(code));
  const looseDocs = docs.filter((d) => !d.videos);
  const docLine = (d: ReleaseDocument) => (
    <>
      <a
        href={d.src.startsWith("http") ? d.src : `${basePath}${d.src}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center text-sm leading-snug text-text underline decoration-dotted hover:text-accent"
      >
        {d.code} · <T es={d.type} en={d.type_en} locale={locale} /> {d.src.startsWith("http") ? "(PDF, archive.org)" : "(PDF)"}
      </a>
      <span className="block font-mono text-xs text-muted">
        {d.date ? `${videoDate(d.date, locale)} · ` : ""}
        <T es={d.place} en={d.place_en} locale={locale} />
      </span>
    </>
  );
  const meta = RELEASE_META[n] ?? {
    es: `PURSUE · Release ${pad(n)}`,
    en: `PURSUE · Release ${pad(n)}`,
    blurbEs: "",
    blurbEn: "",
  };

  // Entregas vecinas para la navegación secuencial (mismo patrón que actores,
  // formas y posts; nov 2026).
  const idx = RELEASES.indexOf(n);
  const prevN = idx > 0 ? RELEASES[idx - 1] : null;
  const nextN = idx >= 0 && idx < RELEASES.length - 1 ? RELEASES[idx + 1] : null;
  const neighbor = (m: number, es: string, en: string) => ({
    href: `/releases/${pad(m)}`,
    es,
    en,
    title: <T es={RELEASE_META[m]?.es ?? `Release ${pad(m)}`} en={RELEASE_META[m]?.en ?? `Release ${pad(m)}`} locale={locale} />,
  });

  return (
    <div className="space-y-8 py-8">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/releases", es: "Entregas", en: "Releases" },
            { es: `Release ${pad(n)}`, en: `Release ${pad(n)}` },
          ]}
          locale={locale}
        />
        <ShareButton title={locale === "es" ? meta.es : meta.en} locale={locale} />
      </div>
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

      {(videos.length > 0 || docs.length > 0) && (
        <section className="space-y-3 border-t border-border pt-6">
          <Eyebrow>
            <T
              es={
                videos.length > 0 && docs.length > 0
                  ? "vídeos y documentos sin ficha propia"
                  : videos.length > 0
                    ? "vídeos sin ficha propia"
                    : "documentos sin ficha propia"
              }
              en={
                videos.length > 0 && docs.length > 0
                  ? "videos and documents without a case of their own"
                  : videos.length > 0
                    ? "videos without a case of their own"
                    : "documents without a case of their own"
              }
              locale={locale}
            />
          </Eyebrow>
          {videos.length > 0 && (
            <>
              <p className="max-w-3xl text-sm leading-relaxed text-text">
                <T
                  es={`Estos ${videos.length} vídeos de la entrega no tienen ficha: lo que traen no basta para sostener un caso. Se muestran con el reproductor de DVIDS y con el título, la fecha de grabación y la procedencia que da DVIDS.`}
                  en={`These ${videos.length} videos from the release have no case page: what they contain is not enough to support one. They are shown with the DVIDS player and with the title, recording date and origin given by DVIDS.`}
                  locale={locale}
                />
                {n === 2 && (
                  <>
                    {" "}
                    <T
                      es="Proceden de una red clasificada y, según la AARO, «Many of these materials lack a substantiated chain-of-custody» (muchos carecen de una cadena de custodia demostrada); el título entre comillas lo puso quien subió el archivo."
                      en="They come from a classified network and, according to AARO, “Many of these materials lack a substantiated chain-of-custody”; the title in quotation marks was given by whoever uploaded the file."
                      locale={locale}
                    />
                  </>
                )}
              </p>
              <ul className="grid gap-x-6 gap-y-8 border-t border-border pt-4 md:grid-cols-2">
                {videos.map((v) => (
                  <li key={v.dvidsId} className="space-y-1">
                    <DvidsVideo
                      src={`https://www.dvidshub.net/video/embed/${v.dvidsId}`}
                      title={`${v.code} · ${v.label}`}
                    />
                    <a
                      href={`https://www.dvidshub.net/video/${v.dvidsId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] flex-wrap items-center text-sm text-text hover:text-accent"
                    >
                      <span className="mr-2 font-mono text-xs text-muted">{v.code}</span>
                      {n === 2 ? (locale === "es" ? `«${v.label}»` : `“${v.label}”`) : v.label} ↗
                    </a>
                    <p className="font-mono text-xs text-muted">
                      {videoDate(v.date, locale)}
                      {v.submittedBy ? ` · ${v.submittedBy}` : ""}
                      {v.reports && docsFor(v.code).length === 0 ? ` · ${v.reports.join(", ")}` : ""}
                    </p>
                    {docsFor(v.code).map((d) => (
                      <p key={d.code} className="pl-4">
                        {docLine(d)}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </>
          )}
          {looseDocs.length > 0 && (
            <>
              <p className={`max-w-3xl text-sm leading-relaxed text-text${videos.length > 0 ? " pt-3" : ""}`}>
                <T
                  es={
                    videos.length > 0
                      ? `Y ${looseDocs.length} documentos de la entrega sin vídeo publicado ni ficha, con lo que se lee en el propio documento:`
                      : `Estos ${looseDocs.length} documentos de la entrega no respaldan ningún caso ni perfil del sitio. Se listan con lo que se lee en el propio documento:`
                  }
                  en={
                    videos.length > 0
                      ? `And ${looseDocs.length} documents from the release with no published video or case page, with what the document itself says:`
                      : `These ${looseDocs.length} documents from the release support no case or profile on the site. They are listed with what the document itself says:`
                  }
                  locale={locale}
                />
              </p>
              <ul className="divide-y divide-border border-y border-border">
                {looseDocs.map((d) => (
                  <li key={d.code} className="py-1">
                    {docLine(d)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <PrevNext
        label={locale === "es" ? "Navegación entre entregas" : "Release navigation"}
        locale={locale}
        prev={prevN != null ? neighbor(prevN, "← Entrega anterior", "← Previous release") : null}
        next={nextN != null ? neighbor(nextN, "Entrega siguiente →", "Next release →") : null}
      />

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
