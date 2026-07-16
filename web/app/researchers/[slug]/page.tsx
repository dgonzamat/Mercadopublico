import { LocaleLink } from "@/components/LocaleLink";

import { notFound } from "next/navigation";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { researchers, getFramework } from "@/lib/data";
import { breadcrumbJsonLd, researcherJsonLd, serializeJsonLd } from "@/lib/jsonld";
import { casesForResearcher } from "@/lib/researcherCases";
import { CaseRow } from "@/components/CaseRow";
import { T } from "@/components/T";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareButton } from "@/components/ShareButton";
import { PrevNext } from "@/components/PrevNext";
import { ResearcherAvatar } from "@/components/ResearcherAvatar";
import { Eyebrow, H1, Body, Caption } from "@/lib/typography";

export function generateStaticParams() {
  return researchers.map((r) => ({ slug: r.id }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const r = researchers.find((x) => x.id === params.slug);
  if (!r) return { title: "No encontrado" };
  return {
    ...pageMeta({
      title: r.seoTitle ?? r.name,
      description: r.seoDescription ?? r.bio_short.slice(0, 160),
      path: `/researchers/${r.id}/`,
    }),
    ...(r.seoTitle ? { title: { absolute: r.seoTitle } } : {}),
    alternates: {
      canonical: `/researchers/${r.id}/`,
      languages: hreflangFor(`/researchers/${r.id}/`),
    },
  };
}

export default async function ResearcherDetailPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const r = researchers.find((x) => x.id === params.slug);
  if (!r) notFound();

  const fw = r.framework ? getFramework(r.framework) : undefined;
  const lifespan = r.born
    ? r.death
      ? `${r.born}–${r.death}`
      : `${r.born}–`
    : "";
  const relatedCases = casesForResearcher(r.id);

  // Orden secuencial = mismo del índice (secciones A–E, estable dentro de cada una).
  const ordered = [...researchers].sort((a, b) =>
    a.section.localeCompare(b.section),
  );
  const idx = ordered.findIndex((x) => x.id === r.id);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next =
    idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

  return (
    <article className="mx-auto max-w-3xl space-y-12 py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(researcherJsonLd(r)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd([
              { href: "/", label: "Inicio" },
              { href: "/researchers/", label: "Actores" },
              { label: r.name },
            ]),
          ),
        }}
      />
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { href: "/", es: "Inicio", en: "Home" },
            { href: "/researchers", es: "Actores", en: "Actors" },
            { es: r.name, en: r.name },
          ]}
        />
        <ShareButton title={r.name} />
      </div>

      {/* Zone A — Identification · U-2 esquinas vivas (era rounded-lg) */}
      <header className="border border-border bg-surface-2 p-6 md:p-8">
        <div className="flex items-start gap-5">
          <ResearcherAvatar researcher={r} size="lg" />
          <div className="space-y-4">
            <Eyebrow>
              <T es="Sección" en="Section" /> {r.section} ·{" "}
              <T es={r.section_label} en={r.section_label_en} />
              {lifespan ? ` · ${lifespan}` : ""}
            </Eyebrow>
            <H1>{r.name}</H1>
            {fw && (
              <p className="text-sm text-text">
                <span className="text-muted">
                  <T es="Marco teórico principal:" en="Primary framework:" />
                </span>{" "}
                <LocaleLink
                  href={`/frameworks/#${fw.id}`}
                  className="text-accent hover:underline"
                >
                  <T es={fw.name} en={fw.name_en} />
                </LocaleLink>
              </p>
            )}
          </div>
        </div>
        <Caption className="mt-4 border-t border-border pt-4">
          <T es={r.credentials} en={r.credentials_en} />
        </Caption>
        {r.photo && (r.photo_credit || r.photo_license) && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
            {[r.photo_credit, r.photo_license].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      {/* Zone B — Narrative. Bio larga (párrafos \n\n) cuando existe; si no,
          el bio_short de una línea. */}
      <section className="space-y-3">
        <Eyebrow>
          <T es="Biografía" en="Biography" />
        </Eyebrow>
        {r.bio ? (
          <div className="space-y-5">
            <div lang="es" data-lang="es" className="space-y-5">
              {r.bio.split("\n\n").map((para, i) => (
                <Body key={i}>{para}</Body>
              ))}
            </div>
            {r.bio_en && (
              <div lang="en" data-lang="en" className="space-y-5">
                {r.bio_en.split("\n\n").map((para, i) => (
                  <Body key={i}>{para}</Body>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Body>
            <T es={r.bio_short} en={r.bio_short_en} />
          </Body>
        )}
      </section>

      {/* Zone C — Apparatus: works as timeline */}
      {r.works.length > 0 && (
        <section className="space-y-3 border-t border-border pt-10">
          <Eyebrow>
            <T
              es={`Por qué está acá · ${r.works.length} piezas`}
              en={`Why they're here · ${r.works.length} pieces`}
            />
          </Eyebrow>
          <ol className="space-y-3">
            {r.works.map((w) => (
              <li
                key={`${w.year}-${w.title}`}
                className="grid grid-cols-[4rem_1fr] gap-4 border-l border-border pl-4"
              >
                <span className="font-mono text-sm tabular-nums text-accent">
                  {w.year}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text">{w.title}</p>
                  <p className="text-xs text-muted">
                    <T es={w.contribution} en={w.contribution_en} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Zone D — Sources */}
      {r.sources && r.sources.length > 0 && (
        <section className="space-y-3 border-t border-border pt-10">
          <Eyebrow>
            <T es="Fuentes" en="Sources" />
          </Eyebrow>
          <ul className="space-y-2">
            {r.sources.map((s) => (
              <li key={s.name} className="text-sm text-text">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {s.name}
                  </a>
                ) : (
                  <span>{s.name}</span>
                )}
                {(s.note || s.note_en) && (
                  <span className="text-muted">
                    {" — "}
                    <T es={s.note ?? ""} en={s.note_en ?? s.note ?? ""} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedCases.length > 0 ? (
        <section className="space-y-3 border-t border-border pt-10">
          <Eyebrow>
            <T
              es={`Casos asociados (${relatedCases.length})`}
              en={`Associated cases (${relatedCases.length})`}
            />
          </Eyebrow>
          <div>
            {relatedCases.map((c) => (
              <CaseRow key={c.id} caseData={c} />
            ))}
          </div>
        </section>
      ) : (
        <p className="border-t border-border pt-6 font-mono text-xs uppercase tracking-widest text-muted">
          <T
            es="Aporta marco teórico / ontológico — sin caso puntual del corpus."
            en="Contributes a theoretical / ontological framework — no specific corpus case."
          />
        </p>
      )}

      <Caption className="border-t border-border pt-6">
        <T
          es="Bio sintetizada del ecosistema de divulgación UAP — categorizada por sección epistemológica (A-E)."
          en="Synthesized bio from the UAP disclosure ecosystem — categorized by epistemological section (A-E)."
        />
      </Caption>

      <PrevNext
        label="Navegación entre investigadores"
        prev={
          prev
            ? {
                href: `/researchers/${prev.id}`,
                es: "← Anterior",
                en: "← Previous",
                title: prev.name,
              }
            : null
        }
        next={
          next
            ? {
                href: `/researchers/${next.id}`,
                es: "Siguiente →",
                en: "Next →",
                title: next.name,
              }
            : null
        }
      />
    </article>
  );
}
