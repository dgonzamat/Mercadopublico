import { T } from "@/components/T";
import { Breadcrumb } from "@/components/Breadcrumb";
import { pageMeta } from "@/lib/seo";
import { Eyebrow, H1, Lede } from "@/lib/typography";

// Canal de contacto. El email se expone como mailto — cambialo por un alias
// del dominio (p. ej. contacto@uapcodex.org) si preferís no exponer el gmail.
// Cuenta del PROYECTO, no personal: es la dirección desde la que se responde
// a investigadores y medios, así que la web y el correo saliente tienen que
// decir lo mismo. Con la personal, quien recibía respuesta veía una dirección
// y quien entraba al sitio otra.
const CONTACT_EMAIL = "uapcodex2026@gmail.com";

export const metadata = pageMeta({
  title: "Contact — corrections and sources",
  description:
    "Corrections, primary sources and missing cases. How to contribute to the UAP Codex notebook.",
  path: "/contact/",
});

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
            es="¿Una corrección, una fuente primaria, un caso que falta? Este proyecto mejora bajo escrutinio. Escribe directo por email."
            en="A correction, a primary source, a missing case? This project improves under scrutiny. Write directly by email."
          />
        </Lede>
      </header>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="group flex min-h-[160px] flex-col justify-between border-2 border-text p-6 hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          <T es="Email" en="Email" />
        </span>
        <span className="font-display text-2xl font-medium leading-tight text-text group-hover:text-bg md:text-3xl">
          {CONTACT_EMAIL}
        </span>
        <span className="text-sm text-muted">
          <T
            es="Correcciones, casos, fuentes o contactos sensibles."
            en="Corrections, cases, sources or sensitive contacts."
          />
        </span>
      </a>

      <a
        href="https://www.instagram.com/uapcodex2026"
        target="_blank"
        rel="me noopener noreferrer"
        className="group flex min-h-[160px] flex-col justify-between border-2 border-text p-6 hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          Instagram
        </span>
        <span className="font-display text-2xl font-medium leading-tight text-text group-hover:text-bg md:text-3xl">
          @uapcodex2026
        </span>
        <span className="text-sm text-muted">
          <T
            es="Casos y probabilidades del corpus, en formato visual."
            en="Cases and probabilities from the corpus, in visual form."
          />
        </span>
      </a>

      <a
        href="https://www.pinterest.com/uapcodex2026"
        target="_blank"
        rel="me noopener noreferrer"
        className="group flex min-h-[160px] flex-col justify-between border-2 border-text p-6 hover:bg-text hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          Pinterest
        </span>
        <span className="font-display text-2xl font-medium leading-tight text-text group-hover:text-bg md:text-3xl">
          @uapcodex2026
        </span>
        <span className="text-sm text-muted">
          <T
            es="Tableros visuales de casos, mapas y patrones del corpus."
            en="Visual boards of cases, maps and patterns from the corpus."
          />
        </span>
      </a>

      <p className="border-t border-text/15 pt-6 font-mono text-xs uppercase tracking-widest text-muted">
        <T
          es="No se recopilan datos de quien escribe — no hay formulario, ni tracking, ni base de datos."
          en="No data is collected from senders — no form, no tracking, no database."
        />
      </p>
    </div>
  );
}
