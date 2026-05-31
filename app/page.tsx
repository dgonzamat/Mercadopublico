import Link from "next/link";
import { cases, patterns, frameworks } from "@/lib/data";

const hypothesisDistribution = [
  {
    id: "pluralidad",
    label: "Pluralidad de inteligencias",
    pct: 48,
    color: "#ff4d4d",
    note: "Múltiples fuentes distintas mezcladas — no es UN solo fenómeno",
  },
  {
    id: "interdimensional",
    label: "Interdimensional / física exótica",
    pct: 15,
    color: "#ff8800",
    note: "Vienen de otras dimensiones, no de otros planetas (Puthoff, Davis)",
  },
  {
    id: "natural",
    label: "Fenómeno natural no catalogado",
    pct: 12,
    color: "#ffb347",
    note: "Plasma, ionización avanzada, sprites — Hessdalen, Popocatépetl",
  },
  {
    id: "clasificado",
    label: "Programa clasificado terrestre",
    pct: 11,
    color: "#7fdbff",
    note: "Breakaway civilization, black budget militar (Jorjani)",
  },
  {
    id: "tratado",
    label: "Tratado formal con Greys",
    pct: 8,
    color: "#aa88ff",
    note: "Hipótesis Cooper, Lazar — sin evidencia primaria verificable",
  },
  {
    id: "psicoespiritual",
    label: "Contacto psicoespiritual / 'Other'",
    pct: 6,
    color: "#00aaff",
    note: "Mack, Strieber, framework ontológico-religioso de Pasulka",
  },
] as const;

export default function HomePage() {
  const tierS = cases.filter((c) => c.tier === "S").length;
  const featured = cases
    .filter((c) =>
      ["tehran-1976", "jal1628-1986", "grusch-testimony-2023", "pursue-r03-2026", "lake-huron-2023", "belgian-wave-1989"].includes(c.id)
    )
    .sort((a, b) => b.probability - a.probability);

  return (
    <div className="space-y-16">
      {/* HERO — objetivo claro en 30 seg */}
      <section className="pt-12">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Análisis institucional de UAP — Unidentified Anomalous Phenomena
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-text sm:text-6xl">
          Lo que los gobiernos han documentado
          <br />
          <span className="text-muted">sobre UAP en 79 años</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          <strong className="text-text">{cases.length} casos verificables</strong> · {patterns.length} patrones recurrentes ·{" "}
          {frameworks.length} hipótesis comparadas — con metodología explícita y cero clickbait.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/resumen" className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:bg-accent/90">
            Resumen 10 min →
          </Link>
          <Link href="/cases" className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-panel">
            Explorar {cases.length} casos
          </Link>
        </div>
      </section>

      {/* ¿QUÉ VAS A ENCONTRAR? — objetivo concreto */}
      <section aria-labelledby="que-encontraras">
        <h2 id="que-encontraras" className="text-sm font-mono uppercase tracking-widest text-muted">
          ¿Qué vas a encontrar aquí?
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon="🗂"
            title="Casos verificables"
            desc="Solo documentos institucionales — militar, congreso, agencias de inteligencia. Cada caso con tier, ubicación, fuente."
          />
          <FeatureCard
            icon="🧭"
            title="Patrones que se repiten"
            desc="18 convergencias documentadas a través de 79 años y 12 países. No coincidencias aisladas — estructura."
          />
          <FeatureCard
            icon="🧪"
            title="Hipótesis con probabilidades"
            desc="11 marcos teóricos comparados. Probabilidades Bayesianas explícitas sobre qué son los UAP."
          />
        </div>
      </section>

      {/* QUÉ TE LLEVAS — valor concreto para el lector */}
      <section aria-labelledby="que-te-llevas">
        <h2 id="que-te-llevas" className="text-sm font-mono uppercase tracking-widest text-muted">
          Qué te llevas
        </h2>
        <ul className="mt-4 space-y-3">
          <ValueBullet>
            Saber cuáles <strong className="text-text">{tierS} casos</strong> tienen mayor confianza
            <span className="text-muted"> — Tier S = militar + sensor + multi-witness, 75-88% confianza</span>
          </ValueBullet>
          <ValueBullet>
            Identificar <strong className="text-text">los {patterns.length} patrones</strong> que se repiten — incluyendo el cover-up institucional de 79 años
          </ValueBullet>
          <ValueBullet>
            Comparar <strong className="text-text">las {frameworks.length} hipótesis serias</strong>
            <span className="text-muted"> — ETH, Control System, Multidimensional, Predatory, Plurality (posición del corpus)</span>
          </ValueBullet>
          <ValueBullet>
            Acceder a fuentes primarias: documentos DIA, testimonios congresionales bajo juramento, FOIA releases
          </ValueBullet>
        </ul>
      </section>

      {/* ¿QUÉ SON LOS UAP? — chart de probabilidades */}
      <HypothesisChart />

      {/* ¿POR DÓNDE EMPEZAR? — navegación por perfil */}
      <section aria-labelledby="por-donde-empezar">
        <h2 id="por-donde-empezar" className="text-sm font-mono uppercase tracking-widest text-muted">
          ¿Por dónde empezar?
        </h2>
        <p className="mt-2 text-muted">Tres caminos según qué necesitas.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <PathCard
            href="/resumen"
            icon="🆕"
            label="Soy nuevo al tema"
            title="Empieza por el resumen"
            desc="10 min. Los 5 hallazgos clave, la taxonomía de disclosure, la conclusión en una sola idea."
          />
          <PathCard
            href="/cases"
            icon="🔍"
            label="Quiero ver casos"
            title="51 casos cronológicos"
            desc="Ordenados por era 1947-2026. Cada uno con tier, fuente, patrones, casos relacionados."
          />
          <PathCard
            href="/about"
            icon="🧪"
            label="Cómo se hizo el análisis"
            title="Metodología"
            desc="Sistema de 4 tiers evidenciales, principio Bayesiano, qué casos mueven la aguja y cuáles no."
          />
        </div>
      </section>

      {/* MÓDULOS — relabel por valor */}
      <section aria-labelledby="modulos">
        <h2 id="modulos" className="text-sm font-mono uppercase tracking-widest text-muted">
          Herramientas
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ModuleCard
            href="/atlas"
            badge="En vivo"
            title="Mapa de casos"
            desc="Mapa mundial con los 51 casos UAP geolocalizados por país y época. Click un marcador para abrir el caso."
          />
          <ModuleCard
            badge="Roadmap"
            title="Calculadora Bayesiana"
            desc="Ajustas tus priors sobre las hipótesis y la calculadora muestra tu probabilidad posterior. Compara con la del corpus."
            soon
          />
          <ModuleCard
            badge="Roadmap"
            title="Buscador semántico"
            desc="Selecciona un caso y encuentra los estructuralmente más similares — mismo patrón, misma era, misma morfología."
            soon
          />
        </div>
      </section>

      {/* CASOS DESTACADOS */}
      <section aria-labelledby="destacados">
        <h2 id="destacados" className="text-sm font-mono uppercase tracking-widest text-muted">
          Casos destacados
        </h2>
        <p className="mt-2 text-sm text-muted">
          Los 6 casos con mayor probabilidad — todos Tier S. ¿Quieres ver los otros 45?{" "}
          <Link href="/cases" className="text-accent hover:underline">Lista completa</Link>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (<FeaturedCase key={c.id} caseData={c} />))}
        </div>
      </section>

      {/* TAXONOMÍA 2x2 */}
      <section aria-labelledby="taxonomia">
        <h2 id="taxonomia" className="text-sm font-mono uppercase tracking-widest text-muted">
          La taxonomía de disclosure 8m/8n/8q/8r
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          El aporte analítico central. Cualquier evento UAP institucional cae en una de cuatro categorías
          según quién controla el contenido vs quién libera la información.
        </p>
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-panel">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted"></th>
                <th className="px-4 py-3 text-left font-medium">Estado controla</th>
                <th className="px-4 py-3 text-left font-medium">Nadie controla</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="bg-panel px-4 py-3 font-medium text-muted">Info viene del estado</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8m</span> Cover-up clásico<br />
                  <span className="text-xs text-muted">“no hay nada que ver” · 1947-2016</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8r</span> Leaks/WikiLeaks<br />
                  <span className="text-xs text-muted">Cablegate · Podesta · 2010+</span>
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="bg-panel px-4 py-3 font-medium text-muted">Estado + sociedad</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8n</span> Ambigüedad estratégica<br />
                  <span className="text-xs text-muted">PURSUE 2026</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-accent">8q</span> Ecosystem disclosure<br />
                  <span className="text-xs text-muted">Luna · Burchett · Coulthart · Grusch</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HypothesisChart() {
  return (
    <section aria-labelledby="hypothesis-chart-title">
      <h2 id="hypothesis-chart-title" className="text-sm font-mono uppercase tracking-widest text-muted">
        ¿Qué son los UAP?
      </h2>
      <p className="mt-3 max-w-2xl text-text">
        Distribución de probabilidad del corpus sobre las hipótesis principales.
        <span className="text-muted"> No suman 100% porque NO son mutuamente excluyentes — pueden ser parcialmente verdaderas al mismo tiempo.</span>
      </p>
      <div className="mt-6 space-y-5 rounded-lg border border-border bg-panel p-5">
        {hypothesisDistribution.map((h) => (
          <div
            key={h.id}
            role="group"
            aria-label={`${h.label}: ${h.pct}%`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-text">{h.label}</p>
              <span className="font-mono text-base font-bold text-text">
                {h.pct}%
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg"
              role="progressbar"
              aria-valuenow={h.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${h.label}: ${h.pct} por ciento de probabilidad`}
            >
              <div className="h-full rounded-full" style={{ width: `${h.pct}%`, backgroundColor: h.color }} />
            </div>
            <p className="mt-1 text-xs text-muted">{h.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Probabilidades móviles con evidencia nueva. Lectura completa en{" "}
        <Link href="/about" className="text-accent hover:underline">metodología</Link>.
      </p>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <span aria-hidden className="text-2xl">{icon}</span>
      <h3 className="mt-3 text-base font-medium text-text">{title}</h3>
      <p className="mt-2 text-sm text-muted">{desc}</p>
    </div>
  );
}

function ValueBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-panel px-4 py-3 text-sm">
      <span aria-hidden className="mt-0.5 font-mono text-accent">✓</span>
      <span className="flex-1 text-text">{children}</span>
    </li>
  );
}

function PathCard({ href, icon, label, title, desc }: { href: string; icon: string; label: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-border bg-panel p-5 transition hover:border-accent/50"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl">{icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      </div>
      <h3 className="mt-3 text-base font-medium text-text group-hover:text-accent">{title}</h3>
      <p className="mt-2 text-sm text-muted">{desc}</p>
      <p className="mt-3 text-xs text-accent">Ir →</p>
    </Link>
  );
}

function ModuleCard({ href, badge, title, desc, soon }: { href?: string; badge: string; title: string; desc: string; soon?: boolean }) {
  const inner = (
    <div className={`rounded-lg border p-5 transition ${soon ? "border-border bg-panel opacity-70" : "group border-border bg-panel hover:border-accent/50"}`}>
      <div className="flex items-center gap-2">
        <span className="rounded bg-bg px-2 py-0.5 font-mono text-xs uppercase tracking-widest text-muted">{badge}</span>
        {soon && (<span className="rounded bg-border/60 px-2 py-0.5 font-mono text-xs uppercase text-muted">próximamente</span>)}
      </div>
      <h3 className={`mt-3 text-lg font-medium ${soon ? "text-muted" : "text-text group-hover:text-accent"}`}>{title}</h3>
      <p className="mt-2 text-sm text-muted">{desc}</p>
    </div>
  );
  return soon || !href ? inner : <Link href={href}>{inner}</Link>;
}

function FeaturedCase({ caseData }: { caseData: import("@/lib/types").UAPCase }) {
  const tierClasses = caseData.tier === "S" ? "border-tierS/40 bg-tierS/5" : caseData.tier === "A" ? "border-tierA/40 bg-tierA/5" : "border-tierB/40 bg-tierB/5";
  return (
    <Link href={`/cases/${caseData.id}`} className={`block rounded-lg border ${tierClasses} p-4 transition hover:border-accent/50`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text">{caseData.flag} {caseData.name}</p>
        <span className="font-mono text-xs text-muted">{caseData.year_start}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-2xl font-bold text-text">{caseData.probability}%</span>
        <span className="rounded bg-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">Tier {caseData.tier}</span>
      </div>
    </Link>
  );
}
