import Link from "next/link";
import { T } from "@/components/T";

/**
 * CTA contextual al Laboratorio (reporting). Se ancla donde la intención de
 * "analizar" es alta — /cases — convirtiendo lector en
 * analista justo donde ya está mirando los datos. Evita depender del nav
 * global (que manda anónimos contra el muro de login sin contexto).
 */
export function AnalyzerCta({ locale }: { locale: "es" | "en" }) {
  return (
    <p className="text-sm">
      <Link href="/laboratorio" className="text-accent underline-offset-4 hover:underline">
        <T
          locale={locale}
          es="Filtra y cruza los datos en el laboratorio (requiere cuenta) →"
          en="Filter and cross the data in the lab (account required) →"
        />
      </Link>
    </p>
  );
}
