import Link from "next/link";
import { TOTAL_CASES } from "@/lib/data";
import {
  Eyebrow,
  H1,
  H2,
  Lede,
  Body,
  Caption,
  PullQuote,
} from "@/lib/typography";

export const metadata = {
  title: "Resumen · UAP Atlas",
  description: "Versión accesible del análisis en lenguaje claro",
};

const FINDINGS = [
  {
    confidence: "~95%",
    title: "El fenómeno es real",
    text: `${TOTAL_CASES} casos institucionales documentados por gobiernos, militares y agencias entre 1947 y 2026, en 12 países. Multi-sensor, multi-witness, fotos, video, radar, daño físico medible.`,
  },
  {
    confidence: "alta",
    title: "No es UNA cosa — son varias",
    text: "9 morfologías distintas, 5 modos de interacción con humanos, casos contradictorios entre sí. La explicación honesta requiere pluralidad.",
  },
  {
    confidence: "~95%",
    title: "Los gobiernos saben más de lo que dicen",
    text: "Secuencia documental verificable: Twining 1947 → Robertson 1953 → Bolender 1969 → Wilson-Davis 2002 → Grusch 2023 → PURSUE 2026.",
  },
  {
    confidence: "alta",
    title: "PURSUE 2026 NO es disclosure real — es ambigüedad estratégica",
    text: "Mano derecha: abre archivos. Mano izquierda: propuesta OPM NDA (26 may) silencia futuros whistleblowers federales.",
  },
  {
    confidence: "verificable",
    title: "El framework de Vallée (1975) predijo PURSUE 2026",
    text: "Vallée propuso un termostato cibernético que regula creencia colectiva. PURSUE encaja exactamente. 51 años de predicción cumplida.",
  },
];

export default function ResumenPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-16 py-4">
      <header className="space-y-4">
        <Eyebrow>Lectura · 10 min</Eyebrow>
        <H1>Resumen del análisis</H1>
        <Lede className="text-muted">
          Versión accesible del análisis completo. Para depth técnico ver el
          corpus en{" "}
          <a
            className="text-accent hover:underline"
            href="https://github.com/dgonzamat/UAP-analysys-"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/dgonzamat/UAP-analysys- ↗
          </a>
          .
        </Lede>
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>La historia</Eyebrow>
          <H2>En 3 frases</H2>
        </div>
        <ol className="space-y-4">
          {[
            "Hay un fenómeno físico real que los gobiernos llevan documentando desde 1947 y que ningún marco interpretativo único explica completamente.",
            "En mayo 2026, Estados Unidos liberó archivos masivos sobre UAP (PURSUE) — pero la liberación fue cuidadosamente curada para no afirmar ni negar nada sustantivo.",
            "La forma en que se está liberando información importa más que el contenido liberado.",
          ].map((para, i) => (
            <li
              key={i}
              className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3"
            >
              <span className="text-right font-display text-2xl leading-none tabular-nums text-accent">
                {i + 1}
              </span>
              <Body>{para}</Body>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-8">
        <div className="space-y-3">
          <Eyebrow>Hallazgos</Eyebrow>
          <H2>Los 5 más importantes</H2>
        </div>
        <div className="space-y-10">
          {FINDINGS.map((f, i) => (
            <article
              key={i}
              className="grid grid-cols-[3rem_1fr] gap-4 border-l border-border pl-4"
            >
              <span className="font-display text-3xl leading-none tabular-nums text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted">
                    Confianza · {f.confidence}
                  </p>
                  <h3 className="text-lg font-semibold leading-snug text-text">
                    {f.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <Eyebrow>Aporte analítico</Eyebrow>
          <H2>La taxonomía de disclosure</H2>
        </div>
        <Body className="text-muted">
          Cualquier evento UAP institucional cae en una de cuatro categorías:
        </Body>
        <ul className="space-y-3">
          {[
            { code: "8m", label: "Cover-up clásico", desc: "no hay nada que ver" },
            {
              code: "8n",
              label: "Ambigüedad estratégica",
              desc: "miren todo, decidan ustedes (PURSUE 2026)",
            },
            {
              code: "8q",
              label: "Ecosystem de disclosure",
              desc: "políticos + periodistas + whistleblowers fuerzan apertura",
            },
            { code: "8r", label: "Leaks", desc: "alguien filtró sin permiso" },
          ].map((item) => (
            <li
              key={item.code}
              className="grid grid-cols-[3rem_1fr] gap-3 text-sm"
            >
              <span className="font-mono text-accent">{item.code}</span>
              <span className="text-text">
                <strong>{item.label}</strong>{" "}
                <span className="text-muted">— {item.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <Eyebrow>Cierre</Eyebrow>
        <PullQuote>
          El corpus documenta 79 años de un fenómeno real que ningún marco
          explica completamente, gestionado institucionalmente con creciente
          sofisticación. PURSUE 2026 es la fase actual de esa gestión — no el
          fin del cover-up, sino su evolución a "transparencia controlada". El
          framework de Vallée predijo este momento en 1975. Lo que decidamos
          hacer con la información ahora es la pregunta política y filosófica
          de nuestra generación.
        </PullQuote>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href="/cases"
          className="inline-flex min-h-[44px] items-center rounded-md bg-accent px-5 py-2 text-sm font-medium text-bg hover:bg-accent/90"
        >
          Explorar {TOTAL_CASES} casos →
        </Link>
        <Link
          href="/probabilidades"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-5 py-2 text-sm font-medium text-text hover:bg-panel"
        >
          Ver razonamiento
        </Link>
        <Link
          href="/atlas"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-5 py-2 text-sm font-medium text-text hover:bg-panel"
        >
          Mapa
        </Link>
      </nav>
    </article>
  );
}
