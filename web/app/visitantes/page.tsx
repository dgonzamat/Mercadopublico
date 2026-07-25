import { pageMeta } from "@/lib/seo";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { VisitorsPanel } from "@/components/VisitorsPanel";

export const metadata = pageMeta({
  title: "Visitors by country",
  description:
    "UAP Codex corpus traffic broken down by country. Aggregate counts, no cookies and no personal data.",
  path: "/visitantes/",
});

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
            es="De dónde llega quien lee el corpus. Conteo agregado por país — solo guardamos el país, nunca la IP ni datos personales."
            en="Where the corpus's readers come from. Aggregate per-country count — we store only the country, never the IP or personal data."
          />
        </Lede>
      </header>

      <VisitorsPanel />
    </article>
  );
}
