import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { VisitorsTable } from "@/components/VisitorsTable";

export const metadata = {
  title: "Visitantes por país",
  description:
    "Tráfico del corpus UAP Codex desglosado por país, contado en tiempo real con Cloudflare (sin cookies ni datos personales).",
  alternates: { canonical: "/visitantes/" },
};

export default function VisitantesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Tráfico del sitio" en="Site traffic" />
        </Eyebrow>
        <H1>
          <T es="Visitantes por país" en="Visitors by country" />
        </H1>
        <Lede>
          <T
            es="De dónde llega quien lee el corpus. Conteo agregado por país, sin cookies ni datos personales — solo el país que Cloudflare deduce de la IP."
            en="Where the corpus's readers come from. Aggregate per-country count, no cookies or personal data — just the country Cloudflare infers from the IP."
          />
        </Lede>
      </header>

      <VisitorsTable />
    </article>
  );
}
