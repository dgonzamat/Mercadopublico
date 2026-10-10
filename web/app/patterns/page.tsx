import { patterns, cases } from "@/lib/data";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { LocaleLink } from "@/components/LocaleLink";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  ...pageMeta({
    title: "Recurring patterns of the phenomenon",
    description: `${STATS.patterns} recurring patterns identified across institutional UAP cases.`,
    path: "/patterns/",
  }),
  alternates: {
    canonical: "/patterns/",
    languages: hreflangFor("/patterns/"),
  },
};

// La raíz sirve INGLÉS (idioma primario). El espejo /es importa `PatternsView`
// y le pasa `locale="es"`. Así cada URL lleva un solo idioma en el HTML.
export default function PatternsPage() {
  return <PatternsView locale="en" />;
}

// `locale` fija el idioma que emite cada <T> (un idioma por URL → mitad de DOM).
export function PatternsView({ locale }: { locale: "es" | "en" }) {
  // El rango se deriva de los datos: escrito a mano decía «8a–8r» con 19
  // patrones (8a–8s) publicados.
  const range = `${patterns[0].id}–${patterns[patterns.length - 1].id}`;
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es={`El catálogo · ${range}`} en={`The catalog · ${range}`} locale={locale} />
        </Eyebrow>
        <H1>
          <T
            es={`${STATS.patterns} patrones que aparecen una y otra vez`}
            en={`${STATS.patterns} patterns that show up again and again`}
            locale={locale}
          />
        </H1>
        <Lede className="text-muted">
          <T
            es={`${STATS.patterns} patrones que se repiten en casos independientes.`}
            en={`${STATS.patterns} patterns that recur across independent cases.`}
            locale={locale}
          />
        </Lede>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {patterns.map((p) => {
          const count = cases.filter((c) => c.patterns.includes(p.id)).length;
          return (
            <LocaleLink
              key={p.id}
              href={`/patterns/${p.letter}`}
              prefetch={false}
              className="border border-border bg-panel p-4 transition hover:border-accent/50"
              style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-accent">{p.id}</p>
                  <h2 className="mt-1 text-base font-medium text-text">
                    <T es={p.name} en={p.name_en} locale={locale} />
                  </h2>
                </div>
                <span className="bg-bg px-2 py-0.5 font-mono text-[10px] text-muted">
                  <T es={`${count} casos`} en={`${count} cases`} locale={locale} />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                <T es={p.description} en={p.description_en} locale={locale} />
              </p>
            </LocaleLink>
          );
        })}
      </div>
    </div>
  );
}
