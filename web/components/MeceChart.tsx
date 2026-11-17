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
  // `validate-schema.mjs` (antigua M1), así que aquí no se oculta ningún dato malo.
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
  // Dos grupos con subtotal: origen terrestre (natural, humano o de otro Estado) y lo
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
    { id: "known", es: "Origen terrestre (humano o natural)", en: "Earthly origin (human or natural)", lead: { es: "origen terrestre", en: "earthly origin" }, items: known, sub: sub(known) },
    { id: "unknown", es: "Sin causa conocida", en: "No known cause", lead: { es: "sin causa conocida", en: "no known cause" }, items: unknown, sub: sub(unknown) },
  ].sort((a, b) => b.sub - a.sub);
  const lead = groups[0];
  // Respuesta primero, un solo número a la vista: el % del grupo mayor y,
  // sin cifra, la explicación que más pesa dentro de él. El reparto completo
  // (seis filas con su %) queda plegado como respaldo (oct 2026).
  const top = lead.items[0];
  const majority = top.pct >= 50;
  // La cifra grande es SIEMPRE la de la explicación que más pesa en el grupo
  // mayor, pase o no de la mitad (decisión del dueño, 15 nov 2026): con la del
  // grupo arriba, Skinwalker se leía «54 % causa natural o humana» cuando lo
  // que más pesaba era la tecnología clasificada (32 %). Solo si manda lo
  // indeterminado, que no es una explicación, la cifra grande es la del grupo.
  const explanationLeads = top.key !== "indet";
  // Solo baja la inicial («ocultado por un Estado» conserva la mayúscula) y
  // los adjetivos sueltos pasan a sustantivo: «52 % óptico» no se entendía.
  const lc = (t: string) => t[0].toLowerCase() + t.slice(1);
  const NOUN: Record<string, string> = { "óptico": "fenómeno óptico", "atmosférico": "fenómeno atmosférico", optical: "optical phenomenon", atmospheric: "atmospheric phenomenon" };
  const noun = (t: string) => NOUN[lc(t)] ?? lc(t);
  const nameOf = (r: (typeof all)[number]) =>
    r.key === "sin_propuesta"
      ? { es: "causa ordinaria sin identificar", en: "ordinary cause, unidentified" }
      : detail && r.key === pk
        ? { es: noun(shortLabel(detail.label)), en: noun(shortLabel(detail.labelEn)) }
        : { es: noun(r.label), en: noun(r.labelEn) };
  const leadName = nameOf(top);
  // Diseño limpio (16 nov 2026, decisión del dueño): una cifra, una frase corta
  // sin cifras y una barra de hasta tres tramos con su leyenda. Las cifras viven
  // en la barra, no en la prosa: el párrafo «De ese 65 %, un 35 %…» sumaba seis
  // cifras, dos repetidas con distinto sentido (35 % sin decidir y 35 % origen
  // terrestre), y llamaba «causa conocida» a una causa sin identificar (Shag
  // Harbour). Tramos: la explicación que más pesa, el resto de su grupo y el
  // otro grupo; si manda lo indeterminado, sin decidir, no humano y origen
  // terrestre.
  const other = groups[1];
  const restOfLead = lead.items.filter((r) => r.key !== top.key);
  const restPct = sub(restOfLead);
  const restMain = restOfLead.filter((r) => !r.zero).sort((a, b) => b.pct - a.pct)[0];
  const otherMain = other.items.filter((r) => !r.zero).sort((a, b) => b.pct - a.pct)[0];
  const segs = [
    { key: "top", pct: top.pct, color: top.color, opacity: 1, es: explanationLeads ? leadName.es : "sin decidir", en: explanationLeads ? leadName.en : "undecided" },
    {
      key: "rest", pct: restPct, color: restMain?.color ?? top.color, opacity: explanationLeads ? 0.45 : 1,
      es: !explanationLeads ? "no humano" : lead.id === "known" ? "otras causas terrestres" : "resto sin causa conocida",
      en: !explanationLeads ? "non-human" : lead.id === "known" ? "other earthly causes" : "rest with no known cause",
    },
    { key: "other", pct: other.sub, color: otherMain?.color ?? INDET_COLOR, opacity: 1, es: lc(other.lead.es), en: lc(other.lead.en) },
  ].filter((g) => g.pct > 0);
  const verdict = !explanationLeads
    ? { es: "La evidencia no alcanza para decidir.", en: "The evidence does not settle it." }
    : majority
      ? { es: "La explicación más probable.", en: "The most likely explanation." }
      : { es: "Ninguna explicación llega a la mitad.", en: "No explanation reaches half." };
  return (
    <div>
      <p className="flex items-baseline gap-2 text-text">
        <span className="text-4xl font-semibold tabular-nums" {...(explanationLeads ? {} : { "data-lead": "" })}>{explanationLeads ? top.pct : lead.sub}%</span>
        <span className="text-base">
          {explanationLeads ? <T es={leadName.es} en={leadName.en} locale={locale} /> : <T es={lead.lead.es} en={lead.lead.en} locale={locale} />}
        </span>
      </p>
      <p className="mb-3 mt-1 text-sm text-muted"><T es={verdict.es} en={verdict.en} locale={locale} /></p>
      <div role="img" aria-label={segs.map((g) => `${g.pct}% ${locale === "es" ? g.es : g.en}`).join(", ")} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm">
        {segs.map((g) => (
          <div key={g.key} className="h-full" style={{ flex: `${g.pct} 1 0%`, backgroundColor: g.color, opacity: g.opacity }} />
        ))}
      </div>
      {/* Leyenda en línea, con su muestra de color: un rótulo bajo cada tramo no
          cabe en el móvil cuando el tramo es estrecho. */}
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
        {groups.map((g) => {
          return (
            <div key={g.id} className="space-y-2">
              {/* Subtotal en el encabezado: el desglose suma a la vista hacia la cifra grande. */}
              <p className="flex justify-between border-b border-text/15 pb-1 text-[13px] font-semibold text-text">
                <T es={g.es} en={g.en} locale={locale} />
                <span className="tabular-nums" {...(explanationLeads && g === lead ? { "data-lead": "" } : {})}>{g.sub}%</span>
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
