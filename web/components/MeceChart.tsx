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
  // «Más probable» solo si esa explicación pasa de la mitad. Debajo de la cifra
  // del grupo (p. ej. 70 %) se leía como si la explicación nombrada tuviera ese
  // 70 %, cuando valía un 32 % (Yellow Sea, 138 fichas; nov 2026). Por debajo
  // de la mitad se nombra con su propio porcentaje.
  const majority = top.pct >= 50;
  const topPct = `${top.pct}%`;
  const topText =
    top.key === "indet"
      ? { es: "La evidencia no alcanza para decidir entre las explicaciones", en: "The evidence is not enough to decide between the explanations" }
      : !majority
        ? top.key === "sin_propuesta"
          ? { es: `La que más pesa: una causa ordinaria que nadie ha identificado\u00a0(${topPct})`, en: `The largest share: an ordinary cause no one has identified\u00a0(${topPct})` }
          : { es: `La que más pesa: ${topName.es.toLowerCase()}\u00a0(${topPct})`, en: `The largest share: ${topName.en.toLowerCase()}\u00a0(${topPct})` }
        // Con su propia cifra también por encima de la mitad: bajo «71 %» se leía
        // que el contagio colectivo valía 71 % cuando valía 68 % (zepelines, nov 2026).
        : top.key === "sin_propuesta"
          ? { es: `Lo más probable es una causa ordinaria que nadie ha identificado\u00a0(${topPct})`, en: `Most likely an ordinary cause that no one has identified\u00a0(${topPct})` }
          : { es: `Explicación más probable: ${topName.es.toLowerCase()}\u00a0(${topPct})`, en: `Most likely explanation: ${topName.en.toLowerCase()}\u00a0(${topPct})` };
  const explanationLeads = majority && top.key !== "indet";
  const leadName =
    top.key === "sin_propuesta"
      ? { es: "causa ordinaria sin identificar", en: "ordinary cause, unidentified" }
      : { es: topName.es.toLowerCase(), en: topName.en.toLowerCase() };
  return (
    <div>
      {/* Cuando una explicación pasa de la mitad, la cifra grande es la suya y el
          grupo baja a la segunda línea: la cifra grande pertenece siempre a lo que
          se nombra a su lado (decisión del dueño, 13 nov 2026; 265 fichas). Por
          debajo de la mitad, o si manda lo indeterminado, sigue mandando el grupo. */}
      {explanationLeads ? (
        <>
          <p className="flex items-baseline gap-2 text-text">
            <span className="text-4xl font-semibold tabular-nums">{top.pct}%</span>
            <span className="text-base"><T es={leadName.es} en={leadName.en} locale={locale} /></span>
          </p>
          <p className="mb-3 mt-1 text-base text-text">
            <T es="La explicación más probable. En total, " en="The most likely explanation. In total, " locale={locale} />
            <span className="tabular-nums" data-lead="">{lead.sub}%</span>{" "}
            <T es={lead.lead.es} en={lead.lead.en} locale={locale} />.
          </p>
        </>
      ) : (
        <>
          <p className="flex items-baseline gap-2 text-text">
            <span className="text-4xl font-semibold tabular-nums" data-lead="">{lead.sub}%</span>
            <span className="text-base"><T es={lead.lead.es} en={lead.lead.en} locale={locale} /></span>
          </p>
          <p className="mb-3 mt-1 text-base text-text"><T es={topText.es} en={topText.en} locale={locale} /></p>
        </>
      )}
      {/* Un tramo por grupo, del color de la explicación que más pesa en él. Con
          un tramo por explicación salían franjas de 1–2 % sin leyenda, que solo
          el color distinguía y que el `title` no mostraba en el móvil (nov 2026);
          el reparto fino queda en el desplegable. */}
      <div
        role="img"
        aria-label={(explanationLeads ? `${top.pct}% ${locale === "es" ? leadName.es : leadName.en}; ` : "") + groups.map((g) => `${g.sub}% ${locale === "es" ? g.lead.es : g.lead.en}`).join(", ")}
        className="flex h-4 w-full gap-1 overflow-hidden"
      >
        {groups.map((g) => {
          const main = g.items.find((r) => !r.zero);
          if (!main) return null;
          const total = g.items.reduce((a, r) => a + r.count, 0);
          // Con la explicación como cifra grande, su tramo se separa del resto del
          // grupo (mismo color, más claro) para que la barra muestre esa cifra.
          const rest = explanationLeads && g === lead ? total - main.count : 0;
          return (
            <div key={g.id} className="flex h-full min-w-0 overflow-hidden rounded-sm" style={{ flex: `${Math.round(total * 1000)} 1 0%` }}>
              <div className="h-full" style={{ flex: `${Math.round((total - rest) * 1000)} 1 0%`, backgroundColor: main.color }} />
              {rest > 0 && <div className="h-full" style={{ flex: `${Math.round(rest * 1000)} 1 0%`, backgroundColor: main.color, opacity: 0.4 }} />}
            </div>
          );
        })}
      </div>
      {/* Leyenda de la barra: la cifra grande de arriba sigue siendo la que manda. El
          grupo menor lleva la suya porque era el único tramo sin cifra visible (el
          29 % había que deducirlo como 100 − 71; nov 2026). */}
      <div className="mt-1 flex w-full gap-1 text-xs text-muted">
        {groups.map((g) => (
          // Rótulo en dos líneas si hace falta: con `truncate` se leía «Sin causa c…» en el móvil.
          <span key={g.id} className="min-w-0 break-words leading-tight" style={{ flex: `${Math.round(g.items.reduce((a, r) => a + r.count, 0) * 1000)} 1 0%` }}>
            {/* El tramo del grupo mayor ya lo nombra el titular («71 % natural or human cause»); rotularlo otra vez era la tercera repetición en pocas líneas. */}
            {g !== lead && g.sub >= 15 && (
              <>
                <span className="tabular-nums">{g.sub}%</span> · <T es={g.es} en={g.en} locale={locale} />
              </>
            )}
          </span>
        ))}
      </div>
      <details className="mt-3">
      <summary className="cursor-pointer text-sm text-accent hover:underline">
        <T es="Ver el reparto entre las seis explicaciones" en="See the split across the six explanations" locale={locale} />
      </summary>
      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {groups.map((g) => {
          return (
            <div key={g.id} className="space-y-2">
              {/* Subtotal en el encabezado: el desglose suma a la vista hacia la cifra grande. */}
              <p className="flex justify-between border-b border-text/15 pb-1 text-[13px] font-semibold text-text">
                <T es={g.es} en={g.en} locale={locale} />
                <span className="tabular-nums">{g.sub}%</span>
              </p>
              {/* Una barrita por fila en lugar del cuadro de color: la barra de arriba
                  ya no tiene un tramo por explicación, así que el cuadro era la leyenda
                  de algo que no se veía. Letra de texto y no mono 11 px; las filas en
                  0 % van en el gris normal (con /70 daban 3,17:1, bajo AA). */}
              {g.items.map((r) => (
                <div key={r.key} className="grid grid-cols-[1fr_4rem_2.5rem] items-center gap-3 text-[13px] leading-snug">
                  <span className={r.zero ? "text-muted" : "text-text"}>
                    <T es={r.label} en={r.labelEn} locale={locale} />
                    {!r.zero && detail && r.key === pk && (
                      <span className="block text-xs text-muted">
                        <T es={shortLabel(detail.label)} en={shortLabel(detail.labelEn)} locale={locale} />
                      </span>
                    )}
                  </span>
                  {/* Pista con contorno y no relleno: el gris de «indeterminado» sobre una
                      pista gris daba 2,82:1. Mínimo de 3 px para que 1–2 % no se lea como 0. */}
                  <span className="h-1.5 w-full overflow-hidden rounded-full ring-1 ring-inset ring-text/25" aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: r.pct > 0 ? `max(3px, ${r.pct}%)` : 0, backgroundColor: r.color }} />
                  </span>
                  {r.zero ? <span className="text-right tabular-nums text-muted">0%</span> : <span className="text-right tabular-nums text-muted" {...(g === lead ? { "data-lead-row": "" } : {})} data-pct="">{r.pct}%</span>}
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
