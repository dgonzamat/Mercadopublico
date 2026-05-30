export const metadata = {
  title: "Resumen · UAP Atlas",
  description: "Versión accesible del análisis en lenguaje claro",
};

export default function ResumenPage() {
  return (
    <article className="prose mx-auto max-w-2xl space-y-8 text-text">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Lectura 10 min</p>
        <h1 className="mt-2 text-4xl font-bold">Resumen del análisis</h1>
        <p className="mt-3 text-muted">Versión accesible del análisis completo. Para depth técnico ver el corpus en <a className="text-accent hover:underline" href="https://github.com/dgonzamat/UAP-analysys-">github.com/dgonzamat/UAP-analysys-</a>.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">La historia en 3 frases</h2>
        <ol className="list-decimal space-y-3 pl-6 text-text">
          <li>Hay un fenómeno físico real que los gobiernos llevan documentando desde 1947 y que ningún marco interpretativo único explica completamente.</li>
          <li>En mayo 2026, Estados Unidos liberó archivos masivos sobre UAP (PURSUE) — pero la liberación fue cuidadosamente curada para no afirmar ni negar nada sustantivo.</li>
          <li>La forma en que se está liberando información importa más que el contenido liberado.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">Los 5 hallazgos más importantes</h2>
        <Finding title="1. El fenómeno es real (~95% confianza)" text="51 casos institucionales documentados por gobiernos, militares y agencias entre 1947 y 2026, en 12 países. Multi-sensor, multi-witness, fotos, video, radar, daño físico medible." />
        <Finding title="2. No es UNA cosa — son varias" text="9 morfologías distintas, 5 modos de interacción con humanos, casos contradictorios entre sí. La explicación honesta requiere pluralidad." />
        <Finding title="3. Los gobiernos saben más de lo que dicen (~95% confianza)" text="Secuencia documental verificable: Twining 1947 → Robertson 1953 → Bolender 1969 → Wilson-Davis 2002 → Grusch 2023 → PURSUE 2026." />
        <Finding title="4. PURSUE 2026 NO es disclosure real — es ambigüedad estratégica" text="Mano derecha: abre archivos. Mano izquierda: propuesta OPM NDA (26 may) silencia futuros whistleblowers federales." />
        <Finding title="5. El framework de Vallée (1975) predijo PURSUE 2026" text="Vallée propuso un termostato cibernético que regula creencia colectiva. PURSUE encaja exactamente. 51 años de predicción cumplida." />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">La taxonomía de disclosure</h2>
        <p>El aporte analítico central del corpus. Cualquier evento UAP institucional cae en una de cuatro categorías:</p>
        <ul className="space-y-2 pl-6 text-sm">
          <li><span className="font-mono text-accent">8m</span> Cover-up clásico — "no hay nada que ver"</li>
          <li><span className="font-mono text-accent">8n</span> Ambigüedad estratégica — "miren todo, decidan ustedes" (PURSUE 2026)</li>
          <li><span className="font-mono text-accent">8q</span> Ecosystem de disclosure — políticos + periodistas + whistleblowers fuerzan apertura</li>
          <li><span className="font-mono text-accent">8r</span> Leaks/WikiLeaks — alguien filtró sin permiso</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-text">En una sola idea</h2>
        <blockquote className="border-l-4 border-accent bg-panel p-4 italic text-text">El corpus documenta 79 años de un fenómeno real que ningún marco explica completamente, gestionado institucionalmente con creciente sofisticación. PURSUE 2026 es la fase actual de esa gestión — no el fin del cover-up, sino su evolución a "transparencia controlada". El framework de Vallée predijo este momento en 1975. Lo que decidamos hacer con la información ahora es la pregunta política y filosófica de nuestra generación.</blockquote>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <a href="/cases" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent/90">Explorar 51 casos →</a>
        <a href="/atlas" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text hover:bg-panel">Ver mapa</a>
        <a href="/patterns" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text hover:bg-panel">Ver patrones</a>
      </div>
    </article>
  );
}

function Finding({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <h3 className="font-medium text-text">{title}</h3>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </div>
  );
}
