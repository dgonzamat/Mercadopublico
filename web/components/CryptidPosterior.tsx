import { T } from "@/components/T";
import { Eyebrow } from "@/lib/typography";
import { CRYPTID_CLASSES, cryptidClassDef, cryptidPctParts, cryptidUnexplained } from "@/lib/cryptidClasses";
import type { UAPCase } from "@/lib/types";

/**
 * Bloque de un críptido que sustituye a «Qué fue» de los casos UAP (25 nov
 * 2026, decisión del dueño): la explicación que sostiene la evidencia, su
 * porqué citado de la fuente, una barra con las seis explicaciones y la cifra
 * «sin explicar». Server component: no suma JS ni cuenta en el techo de E16.
 */
export function CryptidPosterior({ c, locale }: { c: UAPCase; locale: "es" | "en" }) {
  const p = c.posteriorCripto;
  if (!p) return null;
  const parts = cryptidPctParts(p);
  const rows = CRYPTID_CLASSES.map((k, i) => ({ ...k, pct: parts[i] }));
  const cls = cryptidClassDef(c.cryptidClass);
  const unexplained = cryptidUnexplained(p);
  const b = c.classBasis;
  const src = b ? (locale === "es" ? b.source : b.source_en ?? b.source) : "";
  const why = cls && (cls.id === "ordinaria" || cls.id === "fraude")
    ? { es: `Por qué las fuentes proponen: ${cls.label.toLowerCase()}`, en: `Why the sources propose: ${cls.labelEn.toLowerCase()}` }
    : { es: "Por qué la evidencia no se explica con una causa ordinaria", en: "Why the evidence is not explained by an ordinary cause" };
  return (
    <section className="space-y-4">
      <Eyebrow>
        <T locale={locale} es="Qué sostiene la evidencia" en="What the evidence supports" />
      </Eyebrow>
      {cls && (
        <div className="space-y-1">
          <p className="font-display text-3xl font-medium leading-tight text-text md:text-4xl">
            <T locale={locale} es={cls.label} en={cls.labelEn} />
          </p>
          <p className="text-sm text-muted">
            <T locale={locale} es={cls.gloss} en={cls.glossEn} />
          </p>
        </div>
      )}
      <div aria-hidden className="flex h-4 w-full overflow-hidden border border-text bg-panel">
        {rows.filter((r) => r.pct > 0).map((r) => (
          <span key={r.id} className="h-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.id} className={`flex items-baseline gap-2 ${r.pct === 0 ? "text-muted" : "text-text"}`}>
            <span aria-hidden className="inline-block h-3 w-3 shrink-0 border border-text/30" style={{ backgroundColor: r.pct === 0 ? "transparent" : r.color }} />
            <span className="flex-1">
              <T locale={locale} es={r.label} en={r.labelEn} />
            </span>
            <span className="font-mono tabular-nums">{r.pct} %</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-border pt-3 text-sm text-text">
        <T locale={locale} es="Sin explicar" en="Unexplained" />:{" "}
        <strong className="font-mono font-semibold tabular-nums">{unexplained} %</strong>
        <span className="text-muted">
          {" · "}
          <T
            locale={locale}
            es="especie no catalogada, extraterrestre, interdimensional o indeterminado."
            en="uncatalogued species, extraterrestrial, interdimensional or indeterminate."
          />
        </span>
      </p>
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
