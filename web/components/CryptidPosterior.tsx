import { T } from "@/components/T";
import { LocaleLink } from "@/components/LocaleLink";
import { Eyebrow } from "@/lib/typography";
import { CRYPTID_CLASSES, cryptidPctParts } from "@/lib/cryptidClasses";

// Color de «indeterminado» para el tramo del otro grupo si no tiene ninguna fila
// con peso: el mismo de la paleta de lib/cryptidClasses.ts, sin escribir el hex.
const INDET = CRYPTID_CLASSES.find((k) => k.id === "indet")!.color;
import type { UAPCase } from "@/lib/types";

/**
 * Bloque «Qué fue» de un críptido. Mismo diseño que el de los casos UAP
 * (`CasePosterior` en components/MeceChart.tsx, decisión del dueño del 25 nov
 * 2026): una cifra grande con la explicación que más pesa dentro del grupo
 * mayor, una frase corta sin cifras, una barra de hasta tres tramos con su
 * leyenda, el reparto entre las seis explicaciones plegado en dos grupos y el
 * porqué de la clase plegado tras una línea que la nombra. Los grupos son
 * «causa conocida» (causa ordinaria y fraude) y «sin explicar» (especie no
 * catalogada, extraterrestre, interdimensional e indeterminado), los mismos que
 * forman la cifra «sin explicar» que exige E43c. Server component.
 */
export function CryptidPosterior({ c, locale }: { c: UAPCase; locale: "es" | "en" }) {
  const p = c.posteriorCripto;
  if (!p) return null;
  const parts = cryptidPctParts(p);
  // Si la especie ya está descrita (el críptido resultó ser un animal real),
  // «especie no catalogada» deja de ser una explicación sin resolver: pasa al
  // grupo de la causa conocida, con su propio rótulo (25 nov 2026, decisión del dueño).
  const described = c.speciesDescribed === true;
  const all = CRYPTID_CLASSES.map((k, i) => {
    const asDescribed = described && k.id === "no_catalogada";
    return {
      ...k,
      ...(asDescribed
        ? {
            label: "Especie real, ya descrita",
            labelEn: "Real species, now described",
            gloss: "Un animal real que la ciencia no conocía y que ya está descrito.",
            glossEn: "A real animal science did not know, now described.",
            unexplained: false,
          }
        : {}),
      pct: parts[i],
      zero: parts[i] === 0,
    };
  });
  const sub = (items: typeof all) => items.reduce((a, r) => a + r.pct, 0);
  const byPct = (items: typeof all) => [...items].sort((a, b) => b.pct - a.pct);
  const known = all.filter((r) => !r.unexplained);
  const unknown = all.filter((r) => r.unexplained);
  const groups = [
    {
      id: "known",
      es: described ? "Causa conocida (ordinaria, fraude o especie ya descrita)" : "Causa conocida (ordinaria o fraude)",
      en: described ? "Known cause (ordinary, hoax or species now described)" : "Known cause (ordinary or hoax)",
      lead: { es: "causa conocida", en: "known cause" }, items: known, sub: sub(known) },
    { id: "unknown", es: "Sin explicar", en: "Unexplained", lead: { es: "sin explicar", en: "unexplained" }, items: unknown, sub: sub(unknown) },
  ].sort((a, b) => b.sub - a.sub);
  const lead = groups[0];
  const other = groups[1];
  const top = byPct(lead.items)[0];
  // Como en los casos UAP: solo si manda lo indeterminado, que no es una
  // explicación, la cifra grande es la del grupo.
  const explanationLeads = top.id !== "indet";
  const lc = (t: string) => t[0].toLowerCase() + t.slice(1);
  const majority = top.pct >= 50;
  const restOfLead = lead.items.filter((r) => r.id !== top.id);
  const restPct = sub(restOfLead);
  const restMain = byPct(restOfLead.filter((r) => !r.zero))[0];
  const otherMain = byPct(other.items.filter((r) => !r.zero))[0];
  const segs = [
    { key: "top", pct: top.pct, color: top.color, opacity: 1, es: explanationLeads ? lc(top.label) : "sin decidir", en: explanationLeads ? lc(top.labelEn) : "undecided" },
    {
      key: "rest", pct: restPct, color: restMain?.color ?? top.color, opacity: explanationLeads ? 0.45 : 1,
      es: !explanationLeads ? "otras hipótesis sin explicar" : lead.id === "known" ? "otra causa conocida" : "resto sin explicar",
      en: !explanationLeads ? "other unexplained hypotheses" : lead.id === "known" ? "other known cause" : "rest unexplained",
    },
    { key: "other", pct: other.sub, color: otherMain?.color ?? INDET, opacity: 1, es: other.lead.es, en: other.lead.en },
  ].filter((g) => g.pct > 0);
  const verdict = !explanationLeads
    ? { es: "La evidencia no alcanza para decidir.", en: "The evidence does not settle it." }
    : majority
      ? { es: "La explicación más probable.", en: "The most likely explanation." }
      : { es: "Ninguna explicación llega a la mitad.", en: "No explanation reaches half." };

  const b = c.classBasis;
  const src = b ? (locale === "es" ? b.source : b.source_en ?? b.source) : "";
  const cls = all.find((k) => k.id === c.cryptidClass);
  const why = cls && !cls.unexplained
    ? { es: `Causa que proponen las fuentes: ${lc(cls.label)}`, en: `Cause the sources propose: ${lc(cls.labelEn)}` }
    : { es: "Por qué no se identifica una causa conocida", en: "Why no known cause is identified" };

  return (
    <section className="space-y-4">
      <Eyebrow>
        <T locale={locale} es="Qué fue" en="What it was" />
      </Eyebrow>
      <div>
        <p className="flex items-baseline gap-2 text-text">
          <span className="text-4xl font-semibold tabular-nums">{explanationLeads ? top.pct : lead.sub}%</span>
          <span className="text-base">
            {explanationLeads ? <T es={lc(top.label)} en={lc(top.labelEn)} locale={locale} /> : <T es={lead.lead.es} en={lead.lead.en} locale={locale} />}
          </span>
        </p>
        <p className="mb-3 mt-1 text-sm text-muted"><T es={verdict.es} en={verdict.en} locale={locale} /></p>
        <div role="img" aria-label={segs.map((g) => `${g.pct}% ${locale === "es" ? g.es : g.en}`).join(", ")} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm">
          {segs.map((g) => (
            <div key={g.key} className="h-full" style={{ flex: `${g.pct} 1 0%`, backgroundColor: g.color, opacity: g.opacity }} />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {segs.map((g) => (
            <li key={g.key} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: g.color, opacity: g.opacity }} />
              <span className="tabular-nums text-text">{g.pct}%</span> <T es={g.es} en={g.en} locale={locale} />
            </li>
          ))}
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-accent hover:underline">
            <T es="Ver el reparto entre las seis explicaciones" en="See the split across the six explanations" locale={locale} />
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="space-y-2">
                <p className="flex justify-between border-b border-text/15 pb-1 text-[13px] font-semibold text-text">
                  <T es={g.es} en={g.en} locale={locale} />
                  <span className="tabular-nums">{g.sub}%</span>
                </p>
                {g.items.map((r) => (
                  <div key={r.id} className="grid grid-cols-[1fr_4rem_2.5rem] items-center gap-3 text-[13px] leading-snug">
                    <span className={r.zero ? "text-muted" : "text-text"}>
                      <T es={r.label} en={r.labelEn} locale={locale} />
                      {!r.zero && (
                        <span className="block text-xs text-muted">
                          <T es={r.gloss} en={r.glossEn} locale={locale} />
                        </span>
                      )}
                    </span>
                    <span className="h-1.5 w-full overflow-hidden rounded-full ring-1 ring-inset ring-text/25" aria-hidden>
                      <span className="block h-full rounded-full" style={{ width: r.pct > 0 ? `max(3px, ${r.pct}%)` : 0, backgroundColor: r.color }} />
                    </span>
                    <span className="text-right tabular-nums text-muted">{r.pct}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            <T
              es="Colección aparte: estas cifras no entran en los totales de los casos UAP."
              en="Separate collection: these figures do not count toward the UAP case totals."
              locale={locale}
            />{" "}
            <LocaleLink href="/about#criptidos" className="text-accent underline-offset-4 hover:underline">
              <T locale={locale} es="Cómo se reparte →" en="How it is split →" />
            </LocaleLink>
          </p>
        </details>
      </div>
      {b && (
        <details className="text-sm text-text">
          <summary className="cursor-pointer text-accent hover:underline">
            <T locale={locale} es={why.es} en={why.en} />
          </summary>
          <div className="mt-2 border-l-2 border-text/30 pl-4">
            {locale === "es" ? b.es : b.en}{" "}
            <span className="text-muted">
              (
              {b.url ? (
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-4 hover:underline">
                  {src} ↗
                </a>
              ) : (
                src
              )}
              )
            </span>
          </div>
        </details>
      )}
    </section>
  );
}
