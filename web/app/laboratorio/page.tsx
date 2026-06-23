import { TOTAL_CASES } from "@/lib/data";
import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { ExplorerLazy } from "@/components/explorer/ExplorerLazy";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata = {
  title: "Laboratorio de datos — análisis interactivo del corpus UAP",
  description: `Laboratorio interactivo tipo BI sobre los ${TOTAL_CASES} casos UAP: filtra por valor, arma gráficos y KPIs, y analiza la planilla en vivo.`,
  alternates: { canonical: "/laboratorio/" },
};

export default function LaboratorioPage() {
  return (
    <div className="space-y-8 py-8">
      <header className="space-y-4">
        <Eyebrow>
          <T es="Laboratorio · análisis interactivo" en="Data Lab · interactive analysis" />
        </Eyebrow>
        <H1>
          <T es="Arma tu propio tablero" en="Build your own dashboard" />
        </H1>
        <Lede className="max-w-3xl text-muted">
          <T
            es={`Filtra por valor, crea gráficos y KPIs, y trabaja la planilla de los ${TOTAL_CASES} casos en vivo. Tu configuración se guarda en este navegador.`}
            en={`Filter by value, build charts and KPIs, and work the spreadsheet of all ${TOTAL_CASES} cases live. Your setup is saved in this browser.`}
          />
        </Lede>
      </header>

      <RequireAuth>
        <ExplorerLazy />
      </RequireAuth>
    </div>
  );
}
