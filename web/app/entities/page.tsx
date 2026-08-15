import { entityMorphologies, cases, getFramework } from "@/lib/data";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { T } from "@/components/T";
import { LocaleLink } from "@/components/LocaleLink";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  ...pageMeta({
    title: "Non-human entity hypotheses",
    description:
      "Catalog of the physical forms attributed to non-human entities across the corpus, with the origin framework each form reads toward.",
    path: "/entities/",
  }),
  alternates: {
    canonical: "/entities/",
    languages: hreflangFor("/entities/"),
  },
};

// La raíz sirve INGLÉS (idioma primario). El espejo /es importa `EntitiesView`
// y le pasa `locale="es"`. Así cada URL lleva un solo idioma en el HTML.
export default function EntitiesPage() {
  return <EntitiesView locale="en" />;
}

// `locale` fija el idioma que emite cada <T> (un idioma por URL → mitad de DOM).
export function EntitiesView({ locale }: { locale: "es" | "en" }) {
  const present = entityMorphologies.filter((f) => f.present);
  const absent = entityMorphologies.filter((f) => !f.present);
  const withForm = cases.filter((c) => (c.entityMorphology?.length ?? 0) > 0).length;
  const total = cases.length;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Eyebrow>
          <T
            es="Material de afirmación, no taxonomía establecida"
            en="Claims material, not an established taxonomy"
            locale={locale}
          />
        </Eyebrow>
        <H1>
          <T
            es="Hipótesis de entidades no humanas"
            en="Non-human entity hypotheses"
            locale={locale}
          />
        </H1>
        <Lede className="text-muted">
          <T
            locale={locale}
            es={
              <>
                Qué forma describió el testigo primario — incluidas las
                formas que ningún caso del corpus llega a cumplir. De{" "}
                {total} casos, {withForm} describen (o afirman sin describir)
                una entidad. El resto documenta solo un objeto.
              </>
            }
            en={
              <>
                What form the primary witness described — including the
                forms no case in the corpus manages to satisfy. Of {total}{" "}
                cases, {withForm} describe (or claim without describing) an
                entity. The rest document only an object.
              </>
            }
          />
        </Lede>
      </header>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          <T es="Formas presentes" en="Present forms" locale={locale} />
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {present.map((f) => {
            const count = cases.filter((c) =>
              c.entityMorphology?.includes(f.slug),
            ).length;
            const origins = f.readsToward
              .map((id) => getFramework(id))
              .filter((fw): fw is NonNullable<typeof fw> => fw !== undefined);
            return (
              <LocaleLink
                key={f.slug}
                href={`/entities/${f.slug}`}
                prefetch={false}
                className="border border-border bg-panel p-4 transition hover:border-accent/50"
                style={{ borderLeftColor: f.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-accent">{f.slug}</p>
                    <h3 className="mt-1 text-base font-medium text-text">
                      <T es={f.name} en={f.name_en} locale={locale} />
                    </h3>
                  </div>
                  <span className="bg-bg px-2 py-0.5 font-mono text-[10px] text-muted">
                    <T es={`${count} casos`} en={`${count} cases`} locale={locale} />
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  <T es={f.description} en={f.description_en} locale={locale} />
                </p>
                <p className="mt-2 font-mono text-[10px] text-tierB">
                  {origins.length === 0 ? (
                    <T
                      es="sin lectura de origen"
                      en="no origin reading"
                      locale={locale}
                    />
                  ) : (
                    <>
                      <T es="origen → " en="origin → " locale={locale} />
                      {origins
                        .map((fw) => (locale === "es" ? fw.name : fw.name_en))
                        .join(" · ")}
                    </>
                  )}
                </p>
              </LocaleLink>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es="Arquetipos conocidos, sin caso en el corpus"
            en="Known archetypes, no case in the corpus"
            locale={locale}
          />
        </h2>
        <p className="text-xs text-muted">
          <T
            es="Existen en la literatura ufológica amplia. Ningún caso cumple el estándar editorial — se documentan por eso, no por falta de búsqueda."
            en="They exist in the broader UFO literature. No case meets the editorial standard — they are documented for that reason, not for lack of searching."
            locale={locale}
          />
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {absent.map((f) => (
            <div
              key={f.slug}
              className="border border-dashed border-border bg-bg p-4 opacity-80"
              style={{ borderLeftColor: f.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-medium text-muted">
                  <T es={f.name} en={f.name_en} locale={locale} />
                </h3>
                <span className="bg-panel px-2 py-0.5 font-mono text-[10px] text-accent">
                  <T es="0 casos" en="0 cases" locale={locale} />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                <T es={f.description} en={f.description_en} locale={locale} />
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
