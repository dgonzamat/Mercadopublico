import Link from "next/link";
import { notFound } from "next/navigation";
import { cases, getPattern } from "@/lib/data";

// Static class strings — Tailwind JIT can't tokenize template-interpolated classes.
// Without this, `border-${tierColor}/40` produces no CSS and the tier badge renders unstyled.
const TIER_BADGE: Record<"S" | "A" | "B", string> = {
  S: "border-tierS/40 bg-tierS/10 text-tierS",
  A: "border-tierA/40 bg-tierA/10 text-tierA",
  B: "border-tierB/40 bg-tierB/10 text-tierB",
};

const TIER_DESCRIPTION: Record<"S" | "A" | "B", string> = {
  S: "Militar + sensor + multi-witness (75–88% confianza)",
  A: "Institucional civil o multi-witness verificable (65–85%)",
  B: "Folklórico, persistencia local, recurrente (50–65%)",
};

const CATEGORY_LABEL: Record<string, { icon: string; label: string }> = {
  document: { icon: "📄", label: "Documento" },
  incident: { icon: "👁", label: "Incidente" },
  contactee: { icon: "🧑", label: "Contactee" },
  crop_circle: { icon: "🌾", label: "Crop circle" },
};

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) return { title: "Caso no encontrado" };
  return { title: `${c.name} · UAP Atlas`, description: c.summary };
}

export default function CaseDetailPage({ params }: { params: { slug: string } }) {
  const c = cases.find((x) => x.id === params.slug);
  if (!c) notFound();

  const year = c.year_end ? `${c.year_start}–${c.year_end}` : c.year_start.toString();
  const cat = CATEGORY_LABEL[c.category];

  const casePatterns = c.patterns
    .map((id) => getPattern(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const similar = cases
    .filter((x) => x.id !== c.id)
    .map((x) => {
      const sharedPatterns = x.patterns.filter((p) => c.patterns.includes(p));
      const sameCountry = x.country === c.country;
      return {
        caseData: x,
        sharedPatterns,
        sameCountry,
        score: (sameCountry ? 1 : 0) + sharedPatterns.length * 2,
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/cases" className="text-sm text-muted hover:text-accent">
        ← Volver a casos
      </Link>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Caso #{c.num} · {year} · {c.country_name}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-text">
          <span aria-hidden className="mr-2">
            {c.flag}
          </span>
          {c.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div
            className={`rounded-md border px-3 py-1 ${TIER_BADGE[c.tier]}`}
            title={TIER_DESCRIPTION[c.tier]}
          >
            <span className="font-mono text-xs uppercase">Tier {c.tier}</span>
          </div>
          <div className="rounded-md border border-border bg-panel px-3 py-1">
            <span className="font-mono text-sm font-bold text-text">{c.probability}%</span>
            <span className="ml-2 text-xs text-muted">probabilidad</span>
          </div>
          {cat && (
            <div className="rounded-md border border-border bg-panel px-3 py-1">
              <span aria-hidden className="mr-1.5">{cat.icon}</span>
              <span className="font-mono text-xs uppercase text-muted">{cat.label}</span>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-muted">{TIER_DESCRIPTION[c.tier]}</p>
      </header>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Resumen</h2>
        <p className="mt-2 text-text">{c.summary}</p>
        {c.summary_en && (<p className="mt-2 text-sm italic text-muted">{c.summary_en}</p>)}
      </section>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Ubicación</h2>
        <p className="mt-2 text-text">{c.location.place || c.country_name}</p>
        <p className="font-mono text-xs text-muted">
          {c.location.lat.toFixed(2)}°, {c.location.lng.toFixed(2)}°
        </p>
      </section>

      {casePatterns.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            Patrones que exhibe
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {casePatterns.map((p) => (
              <Link
                key={p.id}
                href={`/patterns/${p.letter}`}
                className="rounded border border-border bg-panel px-3 py-1.5 text-xs transition hover:border-accent/50"
                style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
              >
                <span className="font-mono text-accent">{p.id}</span>{" "}
                <span className="text-text">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            Casos relacionados
          </h2>
          <div className="mt-3 grid gap-2">
            {similar.map((s) => {
              const reason = [
                s.sameCountry ? "mismo país" : null,
                s.sharedPatterns.length > 0
                  ? `${s.sharedPatterns.length} ${s.sharedPatterns.length === 1 ? "patrón" : "patrones"} en común`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={s.caseData.id}
                  href={`/cases/${s.caseData.id}`}
                  className="block rounded border border-border bg-panel px-3 py-2 text-sm transition hover:border-accent/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      <span aria-hidden className="mr-2">{s.caseData.flag}</span>
                      <span className="text-text">{s.caseData.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted">
                        {s.caseData.year_start}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      Tier {s.caseData.tier} · {s.caseData.probability}%
                    </span>
                  </div>
                  {reason && (
                    <p className="mt-1 text-xs text-muted">→ {reason}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
