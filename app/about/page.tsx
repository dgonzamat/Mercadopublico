export const metadata = {
  title: "Metodología · UAP Atlas",
  description: "Framework de cuatro tiers evidenciales, principio Bayesiano, no-exclusividad mutua de hipótesis",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Metodología</p>
        <h1 className="mt-2 text-3xl font-bold text-text">Cómo se construyó este análisis</h1>
        <p className="mt-3 text-muted">Principios metodológicos explícitos. Qué cuenta como evidencia, cómo se evalúa, cómo se actualizan las probabilidades.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">1. Framework de cuatro tiers evidenciales</h2>
        <p className="text-muted">No todos los casos UAP son equivalentes en valor evidencial. Mezclar tiers opaca el análisis e infla artificialmente la apariencia de evidencia. El público y la prensa frecuentemente conflactan tiers — esa es una fuente principal de confusión.</p>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-panel">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted">Tier</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted">Categoría</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted">Ejemplos</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted">Confiabilidad</th>
              </tr>
            </thead>
            <tbody>
              <TierRow tier="1" cat="Institucional militar + sensor" examples="Tehran 1976, Belgian Wave, USPER 2025, Lake Huron" conf="75–88%" color="text-tierS" />
              <TierRow tier="2" cat="Institucional civil / multi-witness" examples="Ariel School, JAL 1628, Manises, Westall, Roswell" conf="65–85%" color="text-tierS" />
              <TierRow tier="3" cat="Folklórico / recurrente local" examples="Hessdalen, Popocatépetl, Marfa" conf="50–65%" color="text-tierA" />
              <TierRow tier="4" cat="Contactee / individual" examples="Meier, Sixto Paz, Adamski, Parkes" conf="40% experiencia / <5% cosmología" color="text-tierB" />
            </tbody>
          </table>
        </div>
        <p className="rounded-md border-l-4 border-accent bg-panel p-3 text-sm text-text">
          <strong>Aplicación práctica:</strong> una "evidencia" Tier 4 (Meier) no debería usarse para soportar conclusiones que requieren Tier 1 (Tehran). El sistema Tier de este corpus deriva de las Close Encounter Categories de Hynek.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">2. Principio Bayesiano — qué casos mueven probabilidades</h2>
        <p className="text-muted">No todos los casos añaden evidencia igualmente. Algunos mueven la aguja; otros tienen retorno marginal nulo por repetición.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Card title="Mueve mucho" items={[
            "Tier 1/2 con multi-sensor (Tehran +5%)",
            "Categoría nueva (Hessdalen +categoría)",
            "Caso que contradice patrón establecido",
            "Sensores oficiales + video (Lake Huron +2%)",
          ]} accent />
          <Card title="Mueve poco o nada" items={[
            "Tier 4 contactee aislado (Meier 1-2%)",
            "Caso #50 del mismo patrón (~0%)",
            "Nueva predicción contactee fallada (baja, no sube)",
          ]} />
        </div>
        <p className="text-sm text-muted">
          <strong className="text-text">Estado:</strong> saturación de retorno marginal para casos contactee. Aún acumulando evidencia útil en casos institucionales Tier 1/2.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">3. Las hipótesis NO son mutuamente excluyentes</h2>
        <p className="text-muted">Distinción crítica. Las hipótesis sobre UAP pueden ser parcialmente verdaderas simultáneamente. Por eso las probabilidades suman más de 100%. Esto no es error metodológico — es la estructura real del problema.</p>
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="font-mono text-xs text-muted">Ejemplo de probabilidades coexistentes:</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><span className="font-mono text-accent">48%</span> Pluralidad de inteligencias</li>
            <li><span className="font-mono text-accent">12%</span> Fenómeno natural no catalogado</li>
            <li><span className="font-mono text-accent">15%</span> Interdimensional</li>
            <li><span className="font-mono text-accent">11%</span> Programa clasificado EE.UU.</li>
            <li className="text-muted">+ 14% otras hipótesis</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">4. Probabilidades móviles vs estancadas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card title="Casi techo (difícil mover)" items={[
            "P(algo físico existe) = 90%",
            "P(programas clasificados gobierno) = 95%",
          ]} />
          <Card title="Sitio activo (móvil)" items={[
            "P(pluralidad) = 48%",
            "P(pluralidad coordinada) ~40%",
          ]} accent />
          <Card title="Estancadas (sin evidencia nueva)" items={[
            "P(humanos del futuro / interdimensional) = 12-15%",
            "P(tratado formal Greys) = 8%",
          ]} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">5. Qué movería el análisis ahora</h2>
        <ul className="space-y-2 text-text">
          <li className="flex items-start gap-3"><span className="mt-1 font-mono text-xs text-tierS">+++</span><span>Análisis isotópico independiente de residuos físicos publicado</span></li>
          <li className="flex items-start gap-3"><span className="mt-1 font-mono text-xs text-tierS">+++</span><span>Material recuperado con fotos verificables</span></li>
          <li className="flex items-start gap-3"><span className="mt-1 font-mono text-xs text-tierS">+++</span><span>Lake Huron fragmentos análisis publicado</span></li>
          <li className="flex items-start gap-3"><span className="mt-1 font-mono text-xs text-tierA">+</span><span>Nuevo país que acknowledged formalmente</span></li>
          <li className="flex items-start gap-3"><span className="mt-1 font-mono text-xs text-tierA">+</span><span>Otro Tehran-equivalente con sensor data</span></li>
          <li className="flex items-start gap-3"><span className="mt-1 font-mono text-xs text-muted">~0</span><span>Nuevo contactee con cosmología detallada</span></li>
        </ul>
      </section>
    </article>
  );
}

function TierRow({ tier, cat, examples, conf, color }: { tier: string; cat: string; examples: string; conf: string; color: string }) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-3 align-top"><span className={`font-mono text-sm font-bold ${color}`}>Tier {tier}</span></td>
      <td className="px-3 py-3 align-top text-sm text-text">{cat}</td>
      <td className="px-3 py-3 align-top text-xs text-muted">{examples}</td>
      <td className="px-3 py-3 align-top font-mono text-xs text-text">{conf}</td>
    </tr>
  );
}

function Card({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "border-accent/40 bg-accent/5" : "border-border bg-panel"}`}>
      <h3 className="text-sm font-medium text-text">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs text-muted">
        {items.map((i) => (<li key={i}>· {i}</li>))}
      </ul>
    </div>
  );
}
