import { cryptids } from "@/lib/data";
import { CaseRow } from "@/components/CaseRow";
import { LocaleLink } from "@/components/LocaleLink";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { pageMeta } from "@/lib/seo";
import { CRYPTID_GROUPS, CREATURES } from "@/lib/cryptidTaxonomy";

/**
 * Archivo de críptidos (/cryptids/): colección aparte dentro del sitio (25 nov
 * 2026, decisión del dueño). Mismo formato de ficha, guía de redacción y
 * reglas de evidencia y tier que los casos UAP, pero con su propio modelo de
 * seis explicaciones y fuera de todo total UAP (el contador de casos,
 * /probabilidades, la portada, el laboratorio).
 */
export const metadata = {
  ...pageMeta({
    title: "Cryptid files",
    description: "Bigfoot, the yeti, sea monsters and \"nonhuman\" mummies: what laboratories, prosecutors and government agencies found when they examined them, case by case, from official documents and scientific studies.",
    path: "/cryptids/",
  }),
  alternates: {
    canonical: "/cryptids/",
    languages: { en: "/cryptids/", es: "/es/cryptids/", "x-default": "/cryptids/" },
  },
};

export default function CryptidsPage() {
  return <CryptidsView locale="en" />;
}

export function CryptidsView({ locale }: { locale: "es" | "en" }) {
  const list = [...cryptids].sort((a, b) => a.year_start - b.year_start || a.num - b.num);
  return (
    <div className="space-y-12 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T locale={locale} es="Críptidos" en="Cryptids" />
        </Eyebrow>
        <H1>
          <T locale={locale} es="Archivo de críptidos" en="Cryptid files" />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            locale={locale}
            es="Bigfoot, el yeti, monstruos marinos y momias presentadas como no humanas: qué encontraron los laboratorios, las fiscalías y las agencias del Estado cuando tuvieron que examinarlos. Cada ficha cuenta un caso a partir de sus documentos oficiales o de estudios científicos, y dice qué explicación sostiene la evidencia."
            en="Bigfoot, the yeti, sea monsters and mummies presented as nonhuman: what laboratories, prosecutors and government agencies found when they had to examine them. Each entry tells one case from its official documents or scientific studies, and says which explanation the evidence supports."
          />
        </Lede>
        <p className="text-sm">
          <LocaleLink href="/about#criptidos" className="text-accent underline-offset-4 hover:underline">
            <T locale={locale} es="Cómo se clasifican →" en="How they are classified →" />
          </LocaleLink>
        </p>
      </header>

      {list.length > 0 ? (
        // Agrupado por categoría (términos establecidos de la criptozoología) y,
        // dentro, por criatura, en el orden de data/cryptid-taxonomy.json; solo
        // aparecen las categorías con fichas.
        <div className="space-y-12">
          {CRYPTID_GROUPS.map((g) => {
            const kinds = CREATURES.filter((k) => k.group === g.id)
              .map((k) => ({ k, items: list.filter((c) => c.cryptid === k.id) }))
              .filter((x) => x.items.length > 0);
            if (!kinds.length) return null;
            return (
              <section key={g.id} id={g.id} className="scroll-mt-24 space-y-4">
                <h2 className="flex items-baseline justify-between border-b-2 border-text pb-2 font-display text-2xl text-text">
                  <T locale={locale} es={g.es} en={g.en} />
                  <span className="text-sm font-normal tabular-nums text-muted">
                    {kinds.reduce((a, x) => a + x.items.length, 0)}
                  </span>
                </h2>
                {kinds.map(({ k, items }) => (
                  <div key={k.id} id={k.id} className="scroll-mt-24">
                    <Eyebrow>
                      <T locale={locale} es={k.es} en={k.en} />
                    </Eyebrow>
                    <div className="mt-1">
                      {items.map((c) => (
                        <CaseRow key={c.id} caseData={c} locale={locale} section="cryptids" />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="text-muted">
          <T locale={locale} es="Todavía no hay expedientes publicados." en="No files have been published yet." />
        </p>
      )}
    </div>
  );
}
