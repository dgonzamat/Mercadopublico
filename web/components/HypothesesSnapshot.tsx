import { corpusPosteriors, modalCounts } from "@/lib/meceModel";
import { MeceDonut } from "@/components/MeceDonut";
import { T } from "@/components/T";
import { STATS } from "@/lib/siteStats";

/**
 * Snapshot de las hipótesis para la Home (fondo oscuro bg-text).
 * El donut representa el CORPUS COMPLETO (STATS.cases): las 6 hipótesis parten
 * solo los casos de INCIDENTE (por la naturaleza del objeto, mundano abierto en
 * 3 sub-tipos y no-humano consolidado), y los casos-documento aparecen como su
 * propia porción «no clasificados por objeto» —no se les asigna hipótesis, pero
 * sí se cuentan— para que el centro del donut marque el total y las porciones
 * sumen el corpus entero. Así el donut cuadra con el contador «STATS.cases» de
 * la home (reportado por el usuario, jul 2026: el centro debe marcar el total).
 * La clasificación por hipótesis en sí sigue siendo solo sobre los 248
 * incidentes (canon CLAUDE.md; sonda E24), igual que /probabilidades y /calidad.
 */
export function HypothesesSnapshot() {
  const scored = corpusPosteriors();
  const incidents = scored.length;
  const docs = STATS.cases - incidents; // casos-documento (no clasificados por objeto)
  // 6 hipótesis sobre los incidentes (argmax) + 1 porción para los documentos,
  // de modo que las porciones sumen STATS.cases y el centro marque el total.
  const hypRows = modalCounts(scored, { consolidateNonHuman: true }).map((r) => ({
    key: r.key,
    color: r.color,
    count: r.count,
    label: r.label,
    labelEn: r.labelEn,
    // Cada hipótesis enlaza a su sección en /probabilidades, donde se listan los
    // casos donde es la explicación más probable.
    href: `/probabilidades/#hyp-${r.key}`,
  }));
  const rows = [
    ...hypRows,
    {
      key: "document",
      color: "#8a8172", // neutro/mudo: los documentos no son una hipótesis
      count: docs,
      label: "Casos-documento",
      labelEn: "Document cases",
      href: "/cases",
    },
  ];

  return (
    <div>
      <p className="border-b border-bg/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es={`Los ${STATS.cases} casos del corpus: ${incidents} incidentes clasificados por hipótesis + ${docs} casos-documento (no clasificados por objeto) — suman 100%`}
          en={`The corpus's ${STATS.cases} cases: ${incidents} incidents classified by hypothesis + ${docs} document cases (not classified by object) — they sum to 100%`}
        />
      </p>
      <div className="mt-8">
        <MeceDonut tone="dark" N={STATS.cases} rows={rows} />
      </div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-bg/50">
        <T
          es="El centro marca el total del corpus. Las hipótesis son una clasificación forzada y navegable de los incidentes (argmax): cada caso cuenta 1 en su explicación más probable; mundano abierto en misid/natural/posible fraude, no-humano consolidado. Los casos-documento se cuentan aparte —no tienen «objeto» que clasificar—. El reparto por valor esperado de los incidentes —que conserva la incertidumbre «indeterminable»— está en /calidad."
          en="The center marks the corpus total. The hypotheses are a forced, navigable classification of the incidents (argmax): each case counts once in its most-likely explanation; mundane opened into misid/natural/possible hoax, non-human consolidated. Document cases are counted separately —they have no 'object' to classify. The expected-value split of the incidents —which keeps the 'indeterminable' uncertainty— is on /calidad."
        />
      </p>
    </div>
  );
}
