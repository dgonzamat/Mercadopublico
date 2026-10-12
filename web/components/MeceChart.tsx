import { T } from "@/components/T";
import { MeceDonut } from "@/components/MeceDonut";
import {
  corpusPosteriors,
  expandedHypotheses,
  modalCounts,
  modalHypothesis,
  PROSAIC_CLASSES,
  INDET_COLOR,
  type ScoredCase,
} from "@/lib/meceModel";
import { MECE_CLASSES, objectDetailDef, prosaicKey, shortLabel } from "@/lib/meceClasses";
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
   *  masa a la fuerza): el centro marca el total de incidentes y los inconclusos
   *  caen en una categoría con sentido. */
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
  // Las clases prosaicas de primer nivel (las de objeto + natural + fraude).
  const PROSAIC = new Set<string>(PROSAIC_CLASSES.map((c) => c.key));
  const NONHUMAN = new Set(["nohumano", "nohumano_encubierto", "nohumano_abierto"]);
  // El eje macro prosaico-vs-anómalo solo tiene sentido sobre los casos
  // CLASIFICABLES: «Indeterminado» no es ni prosaico ni anómalo, así que se
  // excluye del denominador (si no, se contaría como anómalo/secreto, que es falso).
  const indetCount = modalKeys.filter((k) => k === "indet").length;
  const classifiable = N - indetCount;
  const prosaico = modalKeys.filter((k) => PROSAIC.has(k)).length; // clases de objeto + natural + fraude
  const anomalo = classifiable - prosaico;
  const enh = modalKeys.filter((k) => NONHUMAN.has(k)).length;
  const derivedBase = classifiable || 1;
  const ejeMacro = pctParts([prosaico / derivedBase, anomalo / derivedBase]);
  const colorOf = Object.fromEntries(rows.map((r) => [r.key, r.color])) as Record<string, string>;
  // Color del eje «prosaico»: la clase prosaica con más casos (rows viene desc).
  const prosaicoColor = rows.find((r) => PROSAIC.has(r.key))?.color ?? rows[0].color;
  const anomaloColor = colorOf.nohumano ?? colorOf.nohumano_encubierto ?? rows[rows.length - 1].color;

  return (
    <div>
      <MeceDonut
        rows={donutRows.map((c) => ({
          key: c.key,
          color: c.color,
          count: c.count,
          weak: c.weak,
          label: c.label,
          labelEn: c.labelEn,
          href: hrefFor?.(c.key),
        }))}
        N={donutN}
        locale={locale}
        tone={tone}
      />

      <p className="mt-6 font-mono text-[11px] text-muted">
        <T
          locale={locale}
          es={totalLabelEs ?? `Suman 100 % · ${N} incidentes`}
          en={totalLabelEn ?? `Sum to 100% · ${N} incidents`}
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
          <div className="mt-2 flex items-baseline justify-between font-mono text-[11px]">
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
 *  forzada; mundano/natural abierto en su clase prosaica concreta — el objeto,
 *  vía `misidSubtype`, o fenómeno natural / posible fraude). Si el caso trae
 *  `objectDetail` (segundo nivel), se muestra junto a su clase. */
const NO_KNOWN_CAUSE = new Set(["indet", "nohumano_encubierto", "nohumano_abierto"]);

export function CasePosterior({
  posterior,
  mundanoType,
  misidSubtype,
  objectDetail,
  locale,
}: {
  posterior: Posterior;
  mundanoType?: ScoredCase["mundanoType"];
  misidSubtype?: MisidSubtype;
  objectDetail?: string;
  locale: "es" | "en";
}) {
  // keepIndet: el «indeterminado» se muestra como tal. Repartirlo entre las
  // demás narrativas inflaba la clase prosaica (Min Min: 97 % aquí frente al
  // 85 % del encabezado y el 15 % «sin explicar» de la misma ficha).
  const rows = expandedHypotheses([{ posterior, mundanoType, misidSubtype }], { keepIndet: true });
  const pk = prosaicKey(mundanoType, misidSubtype);
  const detail = objectDetailDef(pk, objectDetail);
  const withDetail = (r: { key: string; label: string; labelEn: string }) =>
    detail && r.key === pk
      ? { es: `${r.label} · ${shortLabel(detail.label)}`, en: `${r.labelEn} · ${shortLabel(detail.labelEn)}` }
      : { es: r.label, en: r.labelEn };
  // Porcentajes por resto mayor: la leyenda promete "suma 100%", así que los
  // enteros impresos tienen que sumarlo — redondear cada fila por separado daba
  // 101%. Las filas vienen ordenadas de mayor a menor: la primera es la más
  // probable, así que no hace falta un pie que la repita.
  const partes = pctParts(rows.map((r) => r.count));
  // Las seis explicaciones se evalúan siempre; las que valen 0 se dibujaban
  // ocultas y la leyenda cambiaba de 3 a 6 filas según la ficha, como si cada
  // una juzgara categorías distintas (55 fichas). Se listan todas, las de 0 %
  // atenuadas al final.
  const present = new Set(rows.map((r) => r.key));
  const prosaic = PROSAIC_CLASSES.find((k) => k.key === pk);
  const zeros = [
    ...(present.has(pk) || !prosaic ? [] : [{ key: pk, label: prosaic.label, labelEn: prosaic.labelEn, color: prosaic.color }]),
    ...(["humana_clasificada", "adversaria", "nohumano_encubierto", "nohumano_abierto"] as const)
      .filter((id) => !present.has(id))
      .map((id) => MECE_CLASSES.find((k) => k.id === id)!)
      .map((k) => ({ key: k.id, label: k.label, labelEn: k.labelEn, color: k.color })),
    ...(present.has("indet") ? [] : [{ key: "indet", label: "Indeterminado", labelEn: "Indeterminate", color: INDET_COLOR }]),
  ];
  // Dos grupos con subtotal: lo que tiene una causa (natural o humana) y lo
  // que no (indeterminado + las dos no humanas). Una sola lista de seis filas
  // obligaba a sumar tres sueltas para llegar a la cifra de la cabecera, y se
  // leía como dos probabilidades que no calzaban (oct 2026).
  const all = [
    ...rows.map((r, i) => ({ key: r.key, label: r.label, labelEn: r.labelEn, color: r.color, count: r.count, pct: partes[i], zero: false })),
    ...zeros.map((z) => ({ ...z, count: 0, pct: 0, zero: true })),
  ];
  const sub = (items: typeof all) => items.reduce((a, r) => a + r.pct, 0);
  const known = all.filter((r) => !NO_KNOWN_CAUSE.has(r.key));
  const unknown = all.filter((r) => NO_KNOWN_CAUSE.has(r.key));
  // Una sola cifra manda, y es la MAYOR: el grupo que pesa más va primero y
  // su porcentaje en grande; debajo, el desglose. Con un subtotal por grupo y
  // otra cifra en la cabecera se leían dos probabilidades del mismo peso, y
  // destacar siempre «sin causa conocida» ponía arriba el 34 % de un caso
  // que es 66 % causa conocida (oct 2026).
  const groups = [
    { id: "known", es: "Causa natural o humana", en: "Natural or human cause", lead: { es: "causa natural o humana", en: "natural or human cause" }, items: known, sub: sub(known) },
    { id: "unknown", es: "Sin causa conocida", en: "No known cause", lead: { es: "sin causa conocida", en: "no known cause" }, items: unknown, sub: sub(unknown) },
  ].sort((a, b) => b.sub - a.sub);
  const lead = groups[0];
  // Respuesta primero, un solo número a la vista: el % del grupo mayor y,
  // sin cifra, la explicación que más pesa dentro de él. El reparto completo
  // (seis filas con su %) queda plegado como respaldo (oct 2026).
  const top = lead.items[0];
  // Con segundo nivel (globo, meteoro…) se nombra solo el objeto concreto.
  const topName =
    detail && top.key === pk
      ? { es: shortLabel(detail.label), en: shortLabel(detail.labelEn) }
      : { es: top.label, en: top.labelEn };
  const topText =
    top.key === "indet"
      ? { es: "La evidencia no alcanza para decidir entre las explicaciones", en: "The evidence is not enough to decide between the explanations" }
      : top.key === "sin_propuesta"
        ? { es: "Lo más probable es una causa ordinaria que nadie ha identificado", en: "Most likely an ordinary cause that no one has identified" }
        : { es: `Explicación más probable: ${topName.es.toLowerCase()}`, en: `Most likely explanation: ${topName.en.toLowerCase()}` };
  return (
    <div>
      <p className="flex items-baseline gap-2 text-text">
        <span className="text-4xl font-semibold tabular-nums" data-lead="">{lead.sub}%</span>
        <span className="text-base"><T es={lead.lead.es} en={lead.lead.en} locale={locale} /></span>
      </p>
      <p className="mb-3 mt-1 text-base text-text"><T es={topText.es} en={topText.en} locale={locale} /></p>
      <div className="flex h-4 w-full gap-1 overflow-hidden">
        {groups.map((g) => (
          <div key={g.id} className="flex h-full min-w-0 overflow-hidden rounded-sm" style={{ flex: `${Math.round(g.items.reduce((a, r) => a + r.count, 0) * 1000)} 1 0%` }}>
            {g.items.filter((r) => !r.zero).map((r) => (
              <div key={r.key} title={`${r.label}: ${r.pct}%`} style={{ flex: `${Math.round(r.count * 1000)} 1 0%`, backgroundColor: r.color }} />
            ))}
          </div>
        ))}
      </div>
      <details className="mt-3">
      <summary className="cursor-pointer text-sm text-accent hover:underline">
        <T es="Ver el reparto entre las seis explicaciones" en="See the split across the six explanations" locale={locale} />
      </summary>
      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {groups.map((g) => {
          return (
            <div key={g.id} className="space-y-1">
              <p className="border-b border-text/15 pb-1 text-xs text-muted">
                <T es={g.es} en={g.en} locale={locale} />
              </p>
              {g.items.map((r) => (
                <div key={r.key} className={`flex items-baseline justify-between pl-3 font-mono text-[11px] ${r.zero ? "text-muted/70" : ""}`}>
                  <span className={`flex items-center gap-1.5 ${r.zero ? "" : "text-text"}`}>
                    <span className={`inline-block h-2 w-2 shrink-0 ${r.zero ? "opacity-30" : ""}`} style={{ backgroundColor: r.color }} />
                    <T es={r.zero ? r.label : withDetail(r).es} en={r.zero ? r.labelEn : withDetail(r).en} locale={locale} />
                  </span>
                  {r.zero ? <span>0%</span> : <span className="text-muted" {...(g === lead ? { "data-lead-row": "" } : {})} data-pct="">{r.pct}%</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      </details>
    </div>
  );
}
