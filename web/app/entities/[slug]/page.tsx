import { notFound } from "next/navigation";
import { pageMeta, hreflangFor } from "@/lib/seo";
import {
  entityMorphologies,
  getEntityMorphology,
  getCasesByEntityMorphology,
  getFramework,
} from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { PrevNext } from "@/components/PrevNext";
import { T } from "@/components/T";
import { Eyebrow, H1 } from "@/lib/typography";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

// Solo las formas `present: true` generan página — un slug ausente
// (reptiloide, insectoide, felino, espiritual) resuelve en notFound(),
// igual que el mockup marcaba esas tarjetas como "sin página de detalle".
const PRESENT = entityMorphologies.filter((f) => f.present);

export function generateStaticParams() {
  return PRESENT.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const f = getEntityMorphology(params.slug);
  if (!f || !f.present) return { title: "Form not found" };
  return {
    ...pageMeta({
      title: `${f.name_en} · entity form`,
      description: f.description_en,
      path: `/entities/${f.slug}/`,
    }),
    alternates: {
      canonical: `/entities/${f.slug}/`,
      languages: hreflangFor(`/entities/${f.slug}/`),
    },
  };
}

export async function EntityDetailPage(
  props: {
    params: Promise<{ slug: string }>;
    locale?: "es" | "en";
  }
) {
  const locale = props.locale ?? "en";
  const params = await props.params;
  const f = getEntityMorphology(params.slug);
  if (!f || !f.present) notFound();
  const entityCases = getCasesByEntityMorphology(f.slug);
  const origins = f.readsToward
    .map((id) => getFramework(id))
    .filter((fw): fw is NonNullable<typeof fw> => fw !== undefined);

  // Orden secuencial = orden del array (igual que el índice /entities),
  // pero navegando solo entre formas presentes.
  const idx = PRESENT.findIndex((x) => x.slug === f.slug);
  const prev = idx > 0 ? PRESENT[idx - 1] : null;
  const next = idx < PRESENT.length - 1 ? PRESENT[idx + 1] : null;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <BreadcrumbJsonLd
        items={[
          { href: "/", label: locale === "es" ? "Inicio" : "Home" },
          {
            href: "/entities/",
            label: locale === "es" ? "Hipótesis de entidades no humanas" : "Non-human entity hypotheses",
          },
          { label: locale === "es" ? f.name : f.name_en },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/entities", es: "Entidades", en: "Entities" },
            { es: f.name, en: f.name_en },
          ]}
          locale={locale}
        />
        <ShareButton title={locale === "es" ? f.name : f.name_en} locale={locale} />
      </div>

      <header className="space-y-2">
        <Eyebrow>
          <T es="Forma de entidad" en="Entity form" locale={locale} />
        </Eyebrow>
        <div style={{ borderLeftColor: f.color, borderLeftWidth: 4, paddingLeft: 12 }}>
          <H1>
            <T es={f.name} en={f.name_en} locale={locale} />
          </H1>
        </div>
      </header>

      <section>
        <p className="text-text">
          <T es={f.description} en={f.description_en} locale={locale} />
        </p>
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es="Lectura de origen · no es un campo del corpus"
            en="Origin reading · not a corpus field"
            locale={locale}
          />
        </h2>
        <p className="mt-2 text-xs text-muted">
          <T
            es="Construida sobre los textos de cada caso. No mueve el agregado de /probabilidades, que trabaja sobre la narrativa del incidente completo, no sobre la forma del ocupante."
            en="Built from the texts of each case. It does not move the /probabilidades aggregate, which works on the narrative of the whole incident, not the occupant's form."
            locale={locale}
          />
        </p>
        {origins.length === 0 ? (
          <p className="mt-2 font-mono text-xs italic text-muted">
            <T
              es="Ningún marco con lectura defendible."
              en="No framework with a defensible reading."
              locale={locale}
            />
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {origins.map((fw) => (
              <span
                key={fw.id}
                className="inline-flex min-h-[44px] items-center border-2 border-tierB px-3 py-1.5 text-xs"
                title={locale === "es" ? fw.one_sentence_es : fw.one_sentence_en}
              >
                <T es={fw.name} en={fw.name_en} locale={locale} />
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es={`Casos con esta forma (${entityCases.length})`}
            en={`Cases with this form (${entityCases.length})`}
            locale={locale}
          />
        </h2>
        <div className="mt-2">
          {entityCases.map((c) => (
            <CaseRow key={c.id} caseData={c} locale={locale} />
          ))}
        </div>
      </section>

      <PrevNext
        label="Navegación entre formas"
        locale={locale}
        prev={
          prev
            ? {
                href: `/entities/${prev.slug}`,
                es: "← Anterior",
                en: "← Previous",
                title: <T es={prev.name} en={prev.name_en} locale={locale} />,
              }
            : null
        }
        next={
          next
            ? {
                href: `/entities/${next.slug}`,
                es: "Siguiente →",
                en: "Next →",
                title: <T es={next.name} en={next.name_en} locale={locale} />,
              }
            : null
        }
      />
    </article>
  );
}

export default EntityDetailPage;
