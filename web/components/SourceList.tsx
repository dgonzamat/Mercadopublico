import Link from "next/link";
import { T } from "@/components/T";
import type { AggregatedSource } from "@/lib/sources";

/** Lista de fuentes de una categoría (cada categoría tiene su propia página:
 *  las 1.910 fuentes juntas hacían de /fuentes una página de 5,3 MB). */

// Una fuente citada por decenas de fichas (el informe FY2024 de AARO, 48)
// llenaba media página con sus apariciones; se muestran las primeras y se
// cuenta el resto (oct 2026).
const MAX_APPEARANCES = 12;
export function SourceList({ items }: { items: AggregatedSource[] }) {
  return (
            <ol className="divide-y divide-text/10 border-y border-text/15">
              {items.map((s, i) => (
                <li
                  key={`${i}-${s.name.slice(0, 30)}`}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 text-sm"
                >
                  <span
                    aria-hidden
                    className="font-mono text-xs tabular-nums text-muted"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 space-y-2">
                    <p className="text-base leading-snug text-text md:text-lg">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text underline decoration-text/30 underline-offset-4 hover:text-accent hover:decoration-accent"
                        >
                          {s.name} <span aria-hidden>↗</span>
                        </a>
                      ) : (
                        <span className="text-text">{s.name}</span>
                      )}
                    </p>
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1 text-xs text-muted">
                      <span>
                        <T es="Aparece en" en="Appears in" />
                      </span>
                      {s.appearances.slice(0, MAX_APPEARANCES).map((a, idx) => (
                        <span key={`${a.label}-${idx}`}>
                          {idx > 0 && (
                            <span className="text-text/30"> · </span>
                          )}
                          {a.href ? (
                            <Link
                              href={a.href}
                              className="text-text hover:text-accent hover:underline"
                            >
                              <T es={a.label} en={a.labelEn ?? a.label} />
                            </Link>
                          ) : (
                            <span className="text-text"><T es={a.label} en={a.labelEn ?? a.label} /></span>
                          )}
                        </span>
                      ))}
                      {s.appearances.length > MAX_APPEARANCES && (
                        <span>
                          <span className="text-text/30"> · </span>
                          <T
                            es={`y ${s.appearances.length - MAX_APPEARANCES} fichas más`}
                            en={`and ${s.appearances.length - MAX_APPEARANCES} more`}
                          />
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
  );
}
