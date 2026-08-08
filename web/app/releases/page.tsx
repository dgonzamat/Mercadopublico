import { LocaleLink } from "@/components/LocaleLink";

import { pageMeta, hreflangFor } from "@/lib/seo";
import { cases } from "@/lib/data";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  ...pageMeta({
  title: "PURSUE / AARO releases — UAP declassifications",
  description:
    "The batches of UAP files declassified by the Department of War (PURSUE / AARO) and the UAP Codex cases that cite each one.",
  path: "/releases/",
}),
  alternates: { canonical: "/releases/", languages: hreflangFor("/releases/") },
};

const pad = (n: number) => String(n).padStart(2, "0");

const LABELS: Record<number, { es: string; en: string }> = {
  1: { es: "Fundacional · FBI + USAF temprana", en: "Foundational · FBI + early USAF" },
  2: { es: "DOE / DOW / CIA · Sandia green fireballs", en: "DOE / DOW / CIA · Sandia green fireballs" },
  3: { es: "Archivo histórico de la CIA · Robertson, U-2", en: "CIA historical archive · Robertson, U-2" },
  4: { es: "Pantex 2015, STS-80, Range Fouler, Sign/Blue Book", en: "Pantex 2015, STS-80, Range Fouler, Sign/Blue Book" },
  5: { es: "FBI/DoW · Puerto Rico, Bahía, Golfo de Omán, triángulos 2011-2026", en: "FBI/DoW · Puerto Rico, Bahia, Gulf of Oman, 2011-2026 triangles" },
};

export default function ReleasesIndex() {
  return <ReleasesView locale="en" />;
}

export function ReleasesView({ locale }: { locale: "es" | "en" }) {
  const releases = Array.from(
    new Set(cases.flatMap((c) => c.pursueReleases ?? [])),
  ).sort((a, b) => b - a); // más reciente primero

  const rows = releases.map((n) => {
    const list = cases.filter((c) => c.pursueReleases?.includes(n));
    const t = { S: 0, A: 0, B: 0 };
    for (const c of list) t[c.tier] += 1;
    return { n, count: list.length, t };
  });

  return (
    <div className="space-y-8 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Desclasificaciones · PURSUE / AARO" en="Declassifications · PURSUE / AARO" locale={locale} />
        </Eyebrow>
        <H1>
          <T es="Releases del PURSUE" en="PURSUE releases" locale={locale} />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es="Cada entrega de archivos UAP desclasificados por el Department of War alimenta casos del corpus. Aquí se agrupa qué aportó cada release."
            en="Each drop of UAP files declassified by the Department of War feeds cases in the corpus. Here is what each release contributed."
            locale={locale}
          />
        </Lede>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {rows.map(({ n, count, t }) => (
          <LocaleLink
            key={n}
            href={`/releases/${pad(n)}`}
            className="group flex flex-col gap-2 border border-border bg-panel p-5 transition hover:border-accent/50"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Release {pad(n)}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-text group-hover:text-accent">
                {count} <T es="casos" en="cases" locale={locale} />
              </span>
            </div>
            <p className="text-sm text-text">
              <T es={LABELS[n]?.es ?? `Release ${pad(n)}`} en={LABELS[n]?.en ?? `Release ${pad(n)}`} locale={locale} />
            </p>
            <p className="font-mono text-xs text-muted">
              Tier S {t.S} · A {t.A} · B {t.B}
            </p>
          </LocaleLink>
        ))}
      </section>

      <nav className="flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        <a
          href="https://www.war.gov/UFO/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center border border-border bg-panel px-4 py-2 text-text hover:border-accent/50"
        >
          <T es="Portal oficial (war.gov) ↗" en="Official portal (war.gov) ↗" locale={locale} />
        </a>
      </nav>
    </div>
  );
}
