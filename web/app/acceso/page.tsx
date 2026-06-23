import { T } from "@/components/T";
import { Eyebrow, H1, Lede } from "@/lib/typography";
import { AccessForm } from "./AccessForm";

export const metadata = {
  title: "Acceso — reporting UAP Codex",
  description: "Regístrate o inicia sesión para usar la herramienta de reporting de UAP Codex.",
  alternates: { canonical: "/acceso/" },
  robots: { index: false, follow: false },
};

export default function AccesoPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <header className="space-y-3">
        <Eyebrow>
          <T es="Acceso · reporting" en="Access · reporting" />
        </Eyebrow>
        <H1 className="text-3xl md:text-4xl">
          <T es="Entra o regístrate" en="Sign in or sign up" />
        </H1>
        <Lede className="text-muted">
          <T
            es="Crea tu cuenta con Google o email para usar la herramienta de reporting."
            en="Create your account with Google or email to use the reporting tool."
          />
        </Lede>
      </header>
      <AccessForm />
    </div>
  );
}
