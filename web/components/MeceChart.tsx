import { T } from "@/components/T";
import { MeceDonut } from "@/components/MeceDonut";
import {
  corpusPosteriors,
  expandedHypotheses,
  modalCounts,
  modalHypothesis,
  MISID_SUBTYPES,
  type ScoredCase,
} from "@/lib/meceModel";
import type { MisidSubtype } from "@/lib/types";
import type { Posterior } from "@/lib/types";

const pct = (x: number) => (x * 100).toFixed(0);

/**
 * Reparte 100 enteros entre `fracciones` (que deben sumar ~1) por el método del
 * **resto mayor**: trunca cada parte hacia abajo y asigna las unidades sobrantes
 * a los mayores restos decimales. Devuelve enteros que suman **exactamente 100**.
 *
 * Redondear cada categoría por separado con `toFixed(0)` no lo garantiza: la
 * partición 50,5/23/19/7/3 imprimía 101% bajo una leyenda que afirma "suma 100%".
 * `test-chart.mjs` no lo detectaba porque valida los valores crudos (suma=1),
 * no el texto ya redondeado.
 */
function pctParts(fracciones: number[]): number[] {
  // Normalizado: la leyenda promete "suma 100%" y esta función debe cumplirlo
  // aunque el input no sume exactamente 1 (error de coma flotante al acumular,
  // o una partición mal formada). El invariante suma=1 lo vigila aparte
  // `audit-consistency.mjs` (M1), así que aquí no se oculta ningún dato malo.
  const suma = fracciones.reduce((s, f) => s + f, 0) || 1;
  const exactos = fracciones.map((f) => (f / suma) * 100);
  const base = exactos.map(Math.floor);
  let sobran = 100 - base.reduce((s, n) => s + n, 0);
  // Índices por resto decimal desc; con empate gana el de mayor valor exacto.
  const orden = exactos
    .map((v, i) => ({ i, resto: v - Math.floor(v), v }))
    .sort((a, b) => b.resto - a.resto || b.v - a.v);
  for (let k = 0; sobran > 0 && k < orden.length; k++, sobran--) {
    base[orden[k].i] += 1;
  }
  return base;
}

/**
 * Partición comparable del corpus: las 6 narrativas reparten el 100%.
 * + vistas derivadas (entidades-no-humanas, heterogeneidad).
 */
export function MecePartition({
  compact = false,
  items,
  totalLabelEs,
  totalLabelEn,
  showDerived = true,
  consolidateNonHuman = false,
  keepIndet = false,
  hrefFor,
  locale,
  tone = "light",
}: {
  locale: "es" | "en";
  compact?: boolean;
  /** Dataset a graficar; por defecto los incidentes (corpusPosteriors). */
  items?: ScoredCase[];
  /** Pie de gráfico ES/EN; por defecto "Suman 100% · N casos de incidente…". */
  totalLabelEs?: string;
  totalLabelEn?: string;
  /** Conserva «Indeterminado» como narrativa navegable propia (no reparte su
   *  masa a la fuerza). Con el corpus completo esto deja que el centro marque el
   *  total y que los documentos sin lean caigan en una categoría con sentido. */
  keepIndet?: boolean;
  /** Vistas derivadas (solo aplican a la partición de incidentes). */
  showDerived?: boolean;
  /** Fusiona las dos narrativas no-humanas en una sola barra "No-humano".
   *  Solo afecta la VISTA agregada; los datos por caso conservan la distinción. */
  consolidateNonHuman?: boolean;
  /** Si se provee, cada categoría (segmento de la cinta + fila de la leyenda)
   *  se vuelve un enlace a hrefFor(key) — p.ej. el ancla de su detalle. */
  hrefFor?: (key: string) => string | undefined;
  /** Tono del donut (light=crema, dark=texto oscuro); por defecto "light". */
  tone?: "light" | "dark";
}) {
  const scored = items ?? corpusPosteriors();
  const N = scored.length;
  // Clasificación forzada por hipótesis MODAL (argmax): cada caso cuenta 1 en su
  // narrativa más probable, de modo que los conteos son enteros y coinciden con
  // el filtro de /cases y con el CTA «Ver los N casos». (El nº ESPERADO —Σ P—
  // sigue siendo el agregado comparable del modelo; se explica en /probabilidades.)
  const rows = modalCounts(scored, { consolidateNonHuman, keepIndet });
  const donutN = N;
  const donutRows = rows;

  // Vistas derivadas, también por hipótesis modal para no chocar con el gráfico.
  const modalKeys = scored.map((c) => modalHypothesis(c, { consolidateNonHuman, keepIndet }).key);
  const PROSAIC = new Set(["misid", "natural", "fraude"]);
  const NONHUMAN = new Set(["nohumano", "nohumano_encubierto", "nohumano_abierto"]);
  // El eje macro prosaico-vs-anómalo solo tiene sentido sobre los casos
  // CLASIFICABLES: «Indeterminado» no es ni prosaico ni anómalo, así que se
  // excluye del denominador (si no, se contaría como anómalo/secreto, que es falso).
  const indetCount = modalKeys.filter((k) => k === "indet").length;
  const classifiable = N - indetCount;
  const prosaico = modalKeys.filter((k) => PROSAIC.has(k)).length; // misid + natural + fraude
  const anomalo = classifiable - prosaico;
  const enh = modalKeys.filter((k) => NONHUMAN.has(k)).length;
  const derivedBase = classifiable || 1;
  const ejeMacro = pctParts([prosaico / derivedBase, anomalo / derivedBase]);
  const colorOf = Object.fromEntries(rows.map((r) => [r.key, r.color])) as Record<string, string>;
  const prosaicoColor = colorOf.misid ?? rows[0].color;
  const anomaloColor = colorOf.nohumano ?? colorOf.nohumano_encubierto ?? rows[rows.length - 1].color;

  return (
    <div>
      <MeceDonut
        rows={donutRows.map((c) => ({
          key: c.key,
          color: c.color,
          count: c.count,
          label: c.label,
          labelEn: c.labelEn,
          href: hrefFor?.(c.key),
        }))}
        N={donutN}
        locale={locale}
        tone={tone}
      />

      <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted">
        <T
          locale={locale}
          es={totalLabelEs ?? `Suman 100% · ${N} casos de incidente · partición exhaustiva`}
          en={totalLabelEn ?? `Sum to 100% · ${N} incident cases · exhaustive partition`}
        />
      </p>

      {!compact && showDerived && (
        <div className="mt-5 border-t border-border pt-4">
          {/* Eje macro: prosaico vs anómalo/secreto */}
          <div className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-panel">
            <div style={{ width: `${(prosaico / derivedBase) * 100}%`, backgroundColor: prosaicoColor }} />
            <div style={{ width: `${(anomalo / derivedBase) * 100}%`, backgroundColor: anomaloColor }} />
          </div>
          {/* Par complementario (prosaico + anómalo = el total), así que también
              por resto mayor: con toFixed independiente se leía 51% / 50%. */}
          <div className="mt-2 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-wider">
            <span className="text-text">
              <T es="Prosaico" en="Prosaic" locale={locale} /> <span className="tabular-nums text-muted">{ejeMacro[0]}%</span>
            </span>
            <span className="text-text">
              <span className="tabular-nums text-muted">{ejeMacro[1]}%</span> <T es="Anómalo / secreto" en="Anomalous / secret" locale={locale} />
            </span>
          </div>
          {!consolidateNonHuman && (
            <p className="mt-3 font-mono text-[11px] text-muted">
              <T es="Entidades no humanas (encubierto + abierto)" en="Non-human entities (covert + open)" locale={locale} />: {pct(enh / derivedBase)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Posterior de un caso: barra apilada al 100% + hipótesis modal (clasificación
 *  forzada; mundano/natural abierto en su sub-tipo). */
export function CasePosterior({
  posterior,
  mundanoType,
  misidSubtype,
  locale,
}: {
  posterior: Posterior;
  mundanoType?: ScoredCase["mundanoType"];
  misidSubtype?: MisidSubtype;
  locale: "es" | "en";
}) {
  const rows = expandedHypotheses([{ posterior, mundanoType }]);
  const m = rows[0];
  // Porcentajes por resto mayor: la leyenda promete "suma 100%", así que los
  // enteros impresos tienen que sumarlo — redondear cada fila por separado daba
  // 101%. `m` es rows[0] (expandedHypotheses viene ordenado desc).
  const partes = pctParts(rows.map((r) => r.count));
  // Drill-down bajo «Misidentificación»: con qué objeto conocido se confundió.
  // Solo se muestra si la hipótesis modal ES misid y el caso trae el subtipo.
  const sub =
    m.key === "misid" && misidSubtype
      ? MISID_SUBTYPES.find((s) => s.key === misidSubtype)
      : undefined;
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-sm">
        {rows.map((r, i) => (
          <div key={r.key} title={`${r.label}: ${partes[i]}%`} style={{ width: `${r.count * 100}%`, backgroundColor: r.color }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={r.key} className="flex items-baseline justify-between font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-text">
              <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: r.color }} />
              <T es={r.label} en={r.labelEn} locale={locale} />
            </span>
            <span className="text-muted">{partes[i]}%</span>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        <T es="Hipótesis modal" en="Modal hypothesis" locale={locale} />:{" "}
        <span style={{ color: m.color }} className="font-semibold">
          <T es={m.label} en={m.labelEn} locale={locale} />
        </span>{" "}
        {partes[0]}% · <T es="suma 100%" en="sums to 100%" locale={locale} />
      </p>
      {sub && (
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-muted">
          <T es="Se confundió con" en="Confused with" locale={locale} />:{" "}
          <span style={{ color: sub.color }} className="font-semibold">
            <T es={sub.label} en={sub.labelEn} locale={locale} />
          </span>
        </p>
      )}
    </div>
  );
}
