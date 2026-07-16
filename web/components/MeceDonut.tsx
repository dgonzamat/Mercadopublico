"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import { localizeHref } from "@/components/LocaleLink";
import { T } from "@/components/T";

export type DonutDatum = {
  key: string;
  color: string;
  count: number;
  label: string;
  labelEn: string;
  /** Ancla/URL de la hipótesis; si está, el segmento y la fila son enlaces. */
  href?: string;
};

const share = (x: number) => (x * 100).toFixed(1);
// Conteo modal (argmax) → entero; red de seguridad para un count fraccional.
const fmtCount = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Donut interactivo (componente cliente). El hover/focus sobre un segmento o
 * una fila de la leyenda resalta ambos (estado compartido) y el centro del
 * donut muestra el detalle de esa hipótesis. Sin interacción, el centro
 * muestra el total. El render del servidor (estado inicial) deja el donut
 * completo y el total — la interactividad es progresiva.
 */
export function MeceDonut({ rows, N, tone = "light" }: { rows: DonutDatum[]; N: number; tone?: "light" | "dark" }) {
  // En el árbol /en/ las anclas de hipótesis apuntan a /en/probabilidades/…
  const pathname = usePathname();
  // Tokens de "chrome" según el fondo. Clases literales (no concatenadas) para
  // que el JIT de Tailwind las compile. Los colores de segmento no cambian.
  const dark = tone === "dark";
  const txt = dark ? "text-bg" : "text-text";
  const muted = dark ? "text-bg/60" : "text-muted";
  const track = dark ? "stroke-bg opacity-20" : "stroke-border opacity-40";
  const fill = dark ? "bg-bg/15" : "bg-border/40"; // pista de mini-barra + fila activa
  const rowHover = dark ? "hover:bg-bg/15" : "hover:bg-border/40";

  const [active, setActive] = useState<string | null>(null);
  // Posición del cursor (relativa al donut) para el tooltip flotante.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e: ReactPointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const size = 240;
  const stroke = 38;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const gap = 1.5;
  const c = size / 2;

  // Offset acumulado por segmento, precomputado (sin mutar en el render).
  const offsets = rows.reduce<number[]>((acc, row, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (rows[i - 1].count / N) * C);
    return acc;
  }, []);

  const activeRow = rows.find((x) => x.key === active) ?? null;
  const clear = () => setActive(null);

  const maxFrac = Math.max(...rows.map((row) => row.count / N), 1e-9);

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
      {/* Donut — puntero (mouse) y táctil (tap) */}
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onMouseLeave={clear}
        onClick={clear}
        className="relative h-60 w-60 shrink-0"
      >
        {/* Tooltip flotante: sigue al cursor sobre el gráfico */}
        {activeRow && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap"
            style={{ left: pos.x, top: pos.y }}
          >
            <div className="rounded-md border border-border bg-panel/95 px-3 py-2 shadow-lg backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: activeRow.color }} aria-hidden />
                <span className="font-mono text-xs uppercase tracking-wider text-text">
                  <T es={activeRow.label} en={activeRow.labelEn} />
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted">
                <span className="font-semibold tabular-nums" style={{ color: activeRow.color }}>
                  {share(activeRow.count / N)}%
                </span>{" "}
                · {fmtCount(activeRow.count)} <T es="casos" en="cases" />
              </div>
            </div>
          </div>
        )}
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="donut-in h-60 w-60 overflow-visible"
          role="img"
          aria-label={rows.map((rw) => `${rw.label} ${share(rw.count / N)}%`).join(", ")}
        >
          <defs>
            {/* Lift sutil para el segmento activo (profundidad, no glow chillón) */}
            <filter id="donut-lift" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodOpacity="0.35" />
            </filter>
          </defs>
          {/* La rotación −90° vive en un <g> para no chocar con la animación de
              entrada (que anima el transform del <svg>). */}
          <g transform={`rotate(-90 ${c} ${c})`}>
            {/* Anillo de fondo — da profundidad y rellena los gaps */}
            <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} className={track} />
            {rows.map((row, i) => {
              const frac = row.count / N;
              const len = Math.max(frac * C - gap, 0.5);
              const isActive = active === row.key;
              const dim = active !== null && !isActive;
              const dasharray = `${len} ${C - len}`;
              const dashoffset = -offsets[i];
              return (
                <Segment
                  key={row.key}
                  cx={c}
                  cy={c}
                  r={r}
                  stroke={row.color}
                  baseWidth={stroke}
                  isActive={isActive}
                  dim={dim}
                  dasharray={dasharray}
                  dashoffset={dashoffset}
                  title={`${row.label}: ${share(frac)}%`}
                  onActivate={() => setActive(row.key)}
                  onDeactivate={clear}
                />
              );
            })}
          </g>
          {/* Etiquetas de porcentaje sobre cada segmento — fuera del <g> rotado
              para que el texto quede horizontal. Halo oscuro (paint-order) para
              legibilidad sobre cualquier color de arco. Se omiten los arcos muy
              pequeños (quedan en la leyenda) para no saturar. */}
          {rows.map((row, i) => {
            const frac = row.count / N;
            if (frac * C < 36) return null;
            const mid = offsets[i] / C + frac / 2;
            const a = mid * 2 * Math.PI;
            const lx = c + r * Math.sin(a);
            const ly = c - r * Math.cos(a);
            const dim = active !== null && active !== row.key;
            return (
              <text
                key={row.key}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none font-mono tabular-nums"
                style={{
                  fill: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  opacity: dim ? 0.4 : 1,
                  paintOrder: "stroke",
                  stroke: "rgba(0,0,0,0.4)",
                  strokeWidth: 2.6,
                  transition: "opacity 200ms",
                }}
              >
                {share(frac)}%
              </text>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {activeRow ? (
            <>
              <span className="font-mono text-3xl font-semibold tabular-nums transition-colors" style={{ color: activeRow.color }}>
                {share(activeRow.count / N)}%
              </span>
              <span className={`mt-1 font-mono text-[10px] uppercase leading-tight tracking-wider ${muted}`}>
                <T es={activeRow.label} en={activeRow.labelEn} />
              </span>
            </>
          ) : (
            <>
              <span className={`font-mono text-4xl font-semibold tabular-nums ${txt}`}>{N}</span>
              <span className={`mt-1 font-mono text-[10px] uppercase tracking-widest ${muted}`}>
                <T es="casos" en="cases" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Leyenda — sincronizada con el donut, con mini-barra de proporción */}
      <ol className="w-full flex-1 space-y-1.5">
        {rows.map((row, i) => {
          const isActive = active === row.key;
          const dim = active !== null && !isActive;
          const frac = row.count / N;
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: row.color }} aria-hidden />
                  <span className={`uppercase tracking-wider ${i === 0 || isActive ? `font-semibold ${txt}` : txt}`}>
                    <T es={row.label} en={row.labelEn} />
                  </span>
                </span>
                <span className={`shrink-0 whitespace-nowrap text-right tabular-nums ${muted}`}>
                  <span className={i === 0 || isActive ? txt : ""}>{share(frac)}%</span>
                  {" · "}
                  {fmtCount(row.count)} <T es="casos" en="cases" />
                </span>
              </div>
              {/* Mini-barra: longitud relativa a la hipótesis más grande */}
              <div className={`mt-1 h-[3px] w-full overflow-hidden rounded-full ${fill}`}>
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${(frac / maxFrac) * 100}%`, backgroundColor: row.color }}
                />
              </div>
            </>
          );
          const rowClass = `block rounded-sm px-2 py-1 transition-all ${
            isActive ? fill : dim ? "opacity-50" : ""
          }`;
          return (
            <li key={row.key} className="-mx-2 font-mono text-xs" onMouseEnter={() => setActive(row.key)} onMouseLeave={clear}>
              {row.href ? (
                <a href={localizeHref(row.href, pathname)} className={`${rowClass} ${rowHover}`} onFocus={() => setActive(row.key)} onBlur={clear}>
                  {body}
                </a>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Un segmento del donut: arco principal + halo de color cuando está activo. */
function Segment({
  cx,
  cy,
  r,
  stroke,
  baseWidth,
  isActive,
  dim,
  dasharray,
  dashoffset,
  title,
  onActivate,
  onDeactivate,
}: {
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  baseWidth: number;
  isActive: boolean;
  dim: boolean;
  dasharray: string;
  dashoffset: number;
  title: string;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <g
      className="cursor-pointer"
      // Mouse: hover. Táctil: el tap dispara onClick (sin pointerenter/leave).
      onPointerEnter={(e) => e.pointerType === "mouse" && onActivate()}
      onPointerLeave={(e) => e.pointerType === "mouse" && onDeactivate()}
      onClick={(e) => {
        e.stopPropagation(); // no burbujear al onClick del contenedor (que limpia)
        onActivate();
      }}
    >
      {/* Halo de color difuminado, solo cuando está activo */}
      {isActive && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={baseWidth + 14}
          strokeDasharray={dasharray}
          strokeDashoffset={dashoffset}
          style={{ opacity: 0.4, filter: "blur(5px)" }}
          aria-hidden
        />
      )}
      <circle
        data-segment
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={isActive ? baseWidth + 6 : baseWidth}
        strokeDasharray={dasharray}
        strokeDashoffset={dashoffset}
        className="transition-all duration-200"
        style={{ opacity: dim ? 0.35 : 1, filter: isActive ? "url(#donut-lift)" : undefined }}
      >
        <title>{title}</title>
      </circle>
    </g>
  );
}
