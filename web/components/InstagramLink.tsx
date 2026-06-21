// Enlace-icono a Instagram (@uapcodex2026), reutilizado en el footer y en el
// hero de la home. La tarjeta de contacto (/contact) usa otro tratamiento
// visual y NO pasa por aquí.
//
// `tone`: "light" sobre fondo claro (footer), "dark" sobre el hero oscuro.
// Ambas variantes son clases literales completas para que el JIT de Tailwind
// las compile (no interpolar fragmentos tipo `text-${x}`). Touch target 44px
// (recomendado WCAG, regla D4 de audit-design).

type Props = {
  tone?: "light" | "dark";
  className?: string;
};

const TONE = {
  light: "text-muted hover:text-accent",
  dark: "text-bg/70 hover:text-accent-bright",
} as const;

export function InstagramLink({ tone = "light", className }: Props) {
  return (
    <a
      href="https://www.instagram.com/uapcodex2026"
      target="_blank"
      rel="me noopener noreferrer"
      aria-label="UAP Codex en Instagram (@uapcodex2026)"
      title="Instagram · @uapcodex2026"
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors ${TONE[tone]}${
        className ? ` ${className}` : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    </a>
  );
}
