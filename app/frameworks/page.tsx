import { frameworks } from "@/lib/data";

export const metadata = {
  title: "Frameworks · UAP Atlas",
  description: "11 frameworks teóricos serios comparados",
};

const verdictColor: Record<string, string> = {
  neutral: "text-tierB",
  hostile: "text-tierS",
  positive: "text-tierA",
  variable: "text-muted",
};

const verdictLabel: Record<string, string> = {
  neutral: "Neutral",
  hostile: "Hostil",
  positive: "Positivo",
  variable: "Variable",
};

export default function FrameworksPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text">Frameworks teóricos</h1>
        <p className="mt-2 text-muted">{frameworks.length} marcos interpretativos serios en competencia. El corpus adopta <strong className="text-text">Plurality</strong> — posición epistémicamente honesta que evita la unificación prematura que cada framework comete en distinta dirección.</p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-panel">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">Framework</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Autor principal</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Verdict moral</th>
            </tr>
          </thead>
          <tbody>
            {frameworks.map((f) => (
              <tr key={f.id} className={`border-t border-border ${f.id === "plurality" ? "bg-accent/5" : ""}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{f.name}</p>
                  <p className="mt-1 text-xs text-muted">{f.one_sentence_es}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{f.author}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs ${verdictColor[f.verdict_moral]}`}>{verdictLabel[f.verdict_moral]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
