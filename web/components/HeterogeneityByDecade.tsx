import { meceByDecade } from "@/lib/meceModel";
import { T } from "@/components/T";
import { Caption } from "@/lib/typography";

/**
 * Heterogeneidad del corpus a lo largo del tiempo: por década, 1 − el share
 * medio de la narrativa mundana (cuánto del corpus resiste explicación
 * convencional). Añade el eje temporal a la vista derivada `heterogeneidad`
 * que el donut resume como snapshot.
 *
 * Una sola serie (no una partición categórica): el skill dataviz descartó
 * apilar las 6 narrativas —la paleta MECE muteada no separa colores adyacentes
 * (ΔE < 15 en visión normal)—, así que la forma correcta es una serie única
 * en accent, sin problema de paleta. SSR completo: área + línea + puntos son
 * SVG estático; el hover es `<title>` nativo por punto (sin JS, sin coste de
 * client-component). Los colores van en hex porque el SVG no lee tokens JIT.
 */
const ACCENT = "#c41e3a";
const INK = "#1a1a1a";
const MUTED = "#615a4d";

// Plano de dibujo (viewBox de aspecto fijo → escala uniforme, sin distorsión).
const W = 360;
const H = 150;
const X0 = 22;
const X1 = 340;
const Y_TOP = 12; // heterogeneidad = 1.0
const Y_BOT = 120; // heterogeneidad = 0.0
const yFor = (h: number) => Y_BOT - h * (Y_BOT - Y_TOP);

export function HeterogeneityByDecade() {
  const rows = meceByDecade();
  const step = rows.length > 1 ? (X1 - X0) / (rows.length - 1) : 0;
  const pts = rows.map((r, i) => ({ ...r, x: X0 + i * step, y: yFor(r.heterogeneity) }));

  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${X0},${Y_BOT} ${line} ${X1},${Y_BOT}`;

  // Labels directos selectivos (nunca uno por punto): extremos globales + puntas.
  const maxH = Math.max(...pts.map((p) => p.heterogeneity));
  const minH = Math.min(...pts.map((p) => p.heterogeneity));
  const labeled = new Set([
    pts[0],
    pts[pts.length - 1],
    pts.find((p) => p.heterogeneity === maxH),
    pts.find((p) => p.heterogeneity === minH),
  ]);

  return (
    <figure className="space-y-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-w-2xl"
        role="img"
        aria-label={`Heterogeneidad del corpus por década, ${rows[0]?.decade}s a ${rows[rows.length - 1]?.decade}s: la fracción de cada década que resiste explicación mundana, de ${(minH * 100).toFixed(0)}% a ${(maxH * 100).toFixed(0)}%.`}
      >
        {/* Referencias horizontales: 0, 50%, 100% */}
        {[0, 0.5, 1].map((h) => (
          <g key={h}>
            <line
              x1={X0}
              x2={X1}
              y1={yFor(h)}
              y2={yFor(h)}
              stroke={INK}
              strokeOpacity={h === 0.5 ? 0.18 : 0.08}
              strokeDasharray={h === 0.5 ? "3 3" : undefined}
            />
            <text x={0} y={yFor(h) + 3} fontSize={8} fill={MUTED} className="font-mono">
              {h * 100}
            </text>
          </g>
        ))}

        {/* Área + línea de tendencia */}
        <polygon points={area} fill={ACCENT} fillOpacity={0.1} />
        <polyline points={line} fill="none" stroke={ACCENT} strokeWidth={2} vectorEffect="non-scaling-stroke" />

        {/* Puntos + tooltip nativo por década */}
        {pts.map((p) => (
          <g key={p.decade}>
            <circle cx={p.x} cy={p.y} r={3.2} fill={ACCENT}>
              <title>{`${p.decade}s · ${p.n} casos · heterogeneidad ${(p.heterogeneity * 100).toFixed(0)}%`}</title>
            </circle>
            {labeled.has(p) && (
              <text
                x={p.x}
                y={p.y - 7}
                fontSize={9}
                fill={INK}
                textAnchor="middle"
                className="font-mono tabular-nums"
              >
                {(p.heterogeneity * 100).toFixed(0)}
              </text>
            )}
            <text x={p.x} y={H - 4} fontSize={8} fill={MUTED} textAnchor="middle" className="font-mono">
              {`${String(p.decade).slice(2)}s`}
            </text>
          </g>
        ))}
      </svg>

      <Caption>
        <T
          es="Heterogeneidad = 1 − el share medio de la narrativa mundana/natural, por década (incidentes con posterior MECE). Mide cuánto del corpus resiste explicación convencional. El donut da el snapshot agregado; esto le añade el eje temporal. Pasa el cursor por cada punto para el n de la década."
          en="Heterogeneity = 1 − the mean share of the mundane/natural narrative, by decade (incidents with a MECE posterior). It measures how much of the corpus resists a conventional explanation. The donut gives the aggregate snapshot; this adds the time axis. Hover each point for the decade's n."
        />
      </Caption>
    </figure>
  );
}
