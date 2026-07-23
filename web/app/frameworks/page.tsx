import { frameworks } from "@/lib/data";
import { pageMeta, hreflangFor } from "@/lib/seo";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";

export const metadata = {
  ...pageMeta({
  title: "Theoretical frameworks compared",
  description: `${STATS.frameworks} serious theoretical frameworks on the UAP phenomenon, compared by explanatory power and evidence.`,
  path: "/frameworks/",
}),
  alternates: { canonical: "/frameworks/", languages: hreflangFor("/frameworks/") },
};

const verdictColor: Record<string, string> = {
  neutral: "text-tierB",
  hostile: "text-tierS",
  positive: "text-tierA",
  variable: "text-muted",
};

const verdictLabel: Record<string, { es: string; en: string }> = {
  neutral: { es: "Neutral", en: "Neutral" },
  hostile: { es: "Hostil", en: "Hostile" },
  positive: { es: "Positivo", en: "Positive" },
  variable: { es: "Variable", en: "Variable" },
};

export default function FrameworksPage() {
  return <FrameworksView locale="en" />;
}

export function FrameworksView({ locale }: { locale: "es" | "en" }) {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="El debate · marcos en competencia" en="The debate · competing frameworks" locale={locale} />
        </Eyebrow>
        <H1>
          <T
            es={`${STATS.frameworks} teorías serias en competencia`}
            en={`${STATS.frameworks} serious competing theories`}
            locale={locale}
          />
        </H1>
        <Lede className="text-muted">
          <T
            locale={locale}
            es={
              <>
                {frameworks.length} marcos interpretativos serios en competencia.
                El corpus adopta{" "}
                <strong className="text-text">Pluralidad</strong> — posición
                epistémicamente honesta que evita la unificación prematura que
                cada marco comete en distinta dirección.
              </>
            }
            en={
              <>
                {frameworks.length} serious interpretive frameworks in
                competition. The corpus adopts{" "}
                <strong className="text-text">Plurality</strong> — an
                epistemically honest position that avoids the premature
                unification each framework commits in a different direction.
              </>
            }
          />
        </Lede>
      </header>

      <div className="border border-border">
        <table className="w-full text-sm">
          <thead className="bg-panel">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">
                <T es="Marco teórico" en="Framework" locale={locale} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                <T es="Autor principal" en="Main author" locale={locale} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                <T es="Veredicto moral" en="Moral verdict" locale={locale} />
              </th>
            </tr>
          </thead>
          <tbody>
            {frameworks.map((f) => (
              <tr
                key={f.id}
                id={f.id}
                className={`scroll-mt-20 border-t border-border ${
                  f.id === "plurality" ? "bg-accent/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-text">
                    <T es={f.name} en={f.name_en} locale={locale} />
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    <T es={f.one_sentence_es} en={f.one_sentence_en} locale={locale} />
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{f.author}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-mono text-xs ${verdictColor[f.verdict_moral]}`}
                  >
                    <T
                      es={verdictLabel[f.verdict_moral].es}
                      en={verdictLabel[f.verdict_moral].en}
                      locale={locale}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
