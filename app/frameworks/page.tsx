import { frameworks } from "@/lib/data";
import { STATS } from "@/lib/siteStats";
import { T } from "@/components/T";

export const metadata = {
  title: "Frameworks · UAP Atlas",
  description: `${STATS.frameworks} serious theoretical frameworks compared`,
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
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium text-text md:text-4xl">
          <T
            es={`${STATS.frameworks} teorías serias en competencia`}
            en={`${STATS.frameworks} serious competing theories`}
          />
        </h1>
        <p className="mt-2 text-muted">
          <T
            es={
              <>
                {frameworks.length} marcos interpretativos serios en competencia.
                El corpus adopta{" "}
                <strong className="text-text">Plurality</strong> — posición
                epistémicamente honesta que evita la unificación prematura que
                cada framework comete en distinta dirección.
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
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-panel">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">
                <T es="Framework" en="Framework" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                <T es="Autor principal" en="Main author" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                <T es="Veredicto moral" en="Moral verdict" />
              </th>
            </tr>
          </thead>
          <tbody>
            {frameworks.map((f) => (
              <tr
                key={f.id}
                className={`border-t border-border ${
                  f.id === "plurality" ? "bg-accent/5" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{f.name}</p>
                  <p className="mt-1 text-xs text-muted">{f.one_sentence_es}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{f.author}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-mono text-xs ${verdictColor[f.verdict_moral]}`}
                  >
                    <T
                      es={verdictLabel[f.verdict_moral].es}
                      en={verdictLabel[f.verdict_moral].en}
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
