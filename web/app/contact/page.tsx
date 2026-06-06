import { T } from "@/components/T";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Eyebrow, H1, Lede } from "@/lib/typography";

// Canal de contacto. El email se expone como mailto — cambialo por un alias
// del dominio (p. ej. contacto@uapcodex.org) si preferís no exponer el gmail.
const CONTACT_EMAIL = "dgonzamat@gmail.com";
const ISSUES_URL = "https://github.com/dgonzamat/Mercadopublico/issues/new";

export const metadata = {
  title: "Contacto · UAP Codex",
  description:
    "Correcciones, fuentes primarias y casos faltantes. Cómo contribuir al cuaderno UAP Codex.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 py-8">
      <Breadcrumb
        items={[
          { href: "/", es: "Inicio", en: "Home" },
          { es: "Contacto", en: "Contact" },
        ]}
      />

      <header className="space-y-4">
        <Eyebrow>
          <T es="Hablemos" en="Get in touch" />
        </Eyebrow>
        <H1>
          <T es="Contacto" en="Contact" />
        </H1>
        <Lede className="text-muted">
          <T
            es="¿Una corrección, una fuente primaria, un caso que falta? Este proyecto mejora bajo escrutinio — la vía preferida es pública y deja rastro auditable."
            en="A correction, a primary source, a missing case? This project improves under scrutiny — the preferred channel is public and leaves an auditable trail."
          />
        </Lede>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Canal primario: issue público en GitHub */}
        <a
          href={ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-[160px] flex-col justify-between border-2 border-text bg-accent p-6 hover:bg-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-bg/70 group-hover:text-muted">
            <T es="Preferido · público" en="Preferred · public" />
          </span>
          <span className="font-display text-2xl font-medium leading-tight text-bg">
            <T es="Abrir un issue en GitHub →" en="Open a GitHub issue →" />
          </span>
          <span className="text-sm text-bg/80 group-hover:text-muted">
            <T
              es="Correcciones, casos o fuentes. Queda registrado y cualquiera puede verificarlo."
              en="Corrections, cases or sources. It is on the record and anyone can verify it."
            />
          </span>
        </a>

        {/* Canal secundario: email directo */}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="group flex min-h-[160px] flex-col justify-between border-2 border-text p-6 hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            <T es="Privado · email" en="Private · email" />
          </span>
          <span className="font-display text-2xl font-medium leading-tight text-text group-hover:text-bg">
            {CONTACT_EMAIL}
          </span>
          <span className="text-sm text-muted">
            <T
              es="Para lo que no va en público: filtraciones, contactos sensibles."
              en="For what shouldn't be public: leaks, sensitive contacts."
            />
          </span>
        </a>
      </div>

      <p className="border-t border-text/15 pt-6 font-mono text-xs uppercase tracking-widest text-muted">
        <T
          es="No se recopilan datos de quien escribe — no hay formulario, ni tracking, ni base de datos."
          en="No data is collected from senders — no form, no tracking, no database."
        />
      </p>
    </div>
  );
}
