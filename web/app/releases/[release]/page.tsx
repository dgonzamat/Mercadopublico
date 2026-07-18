import { notFound } from "next/navigation";
import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta } from "@/lib/seo";
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

const RELEASE_META: Record<
  number,
  { es: string; en: string; blurbEs: string; blurbEn: string }
> = {
  1: {
    es: "PURSUE · Primera entrega",
    en: "PURSUE · First release",
    blurbEs:
      "El drop histórico fundacional del Departamento de Guerra: expedientes del FBI y de la USAF temprana.",
    blurbEn:
      "The foundational historic drop from the Department of War: FBI and early-USAF files.",
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
  },
  4: {
    es: "PURSUE · Cuarta entrega",
    en: "PURSUE · Fourth release",
    blurbEs:
      "La entrega más reciente: el incidente nuclear de Pantex (2015), imágenes de la NASA (STS-80), los formularios Range Fouler de la Marina y los análisis de las eras Sign y Blue Book.",
    blurbEn:
      "The most recent drop: the Pantex nuclear incident (2015), NASA imagery (STS-80), the Navy Range Fouler forms and the Sign/Blue Book-era analyses.",
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
  return {
    ...pageMeta({
      title: `PURSUE Release ${pad(n)} — ${count} corpus cases`,
      description: `The ${count} UAP Codex cases that cite documents from PURSUE/AARO Release ${pad(n)} (Department of War declassification).`,
      path: `/releases/${pad(n)}/`,
    }),
  };
}

export default async function ReleasePage(props: {
  params: Promise<{ release: string }>;
}) {
  const { release } = await props.params;
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
            es={`PURSUE / AARO · Release ${pad(n)}`}
            en={`PURSUE / AARO · Release ${pad(n)}`}
          />
        </Eyebrow>
        <H1>
          <T es={meta.es} en={meta.en} />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es={`${list.length} casos del corpus extraen documentos de esta release. ${meta.blurbEs}`}
            en={`${list.length} cases in the corpus draw documents from this release. ${meta.blurbEn}`}
          />
        </Lede>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {list.length} casos · Tier S {t.S} · A {t.A} · B {t.B}
        </p>
      </header>

      <section className="border-t border-border">
        {list.map((c) => (
          <CaseRow key={c.id} caseData={c} />
        ))}
      </section>

      <nav className="flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        <LocaleLink
          href="/releases"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="← Todas las releases" en="← All releases" />
        </LocaleLink>
        <LocaleLink
          href="/cases"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="Todos los casos" en="All cases" />
        </LocaleLink>
        <a
          href="https://www.war.gov/UFO/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="Fuente oficial (war.gov) ↗" en="Official source (war.gov) ↗" />
        </a>
      </nav>
    </div>
  );
}
