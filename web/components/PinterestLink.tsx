// Enlace-icono a Pinterest (@uapcodex2026), espejo de InstagramLink: se coloca
// junto a Instagram en el footer, el hero de la home y el menú mobile. La
// tarjeta de /contact usa otro tratamiento visual y NO pasa por aquí.
//
// `tone`: "light" sobre fondo claro (footer), "dark" sobre el hero oscuro.
// Clases literales completas (JIT de Tailwind). Touch target 44px (regla D4).

type Props = {
  tone?: "light" | "dark";
  className?: string;
};

const TONE = {
  light: "text-muted hover:text-accent",
  dark: "text-bg/70 hover:text-accent-bright",
} as const;

export function PinterestLink({ tone = "light", className }: Props) {
  return (
    <a
      href="https://www.pinterest.com/uapcodex2026"
      target="_blank"
      rel="me noopener noreferrer"
      aria-label="UAP Codex en Pinterest (@uapcodex2026)"
      title="Pinterest · @uapcodex2026"
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors ${TONE[tone]}${
        className ? ` ${className}` : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.02 0C5.4 0 .03 5.37.03 11.99c0 5.08 3.16 9.42 7.62 11.16-.11-.95-.2-2.4.04-3.44.22-.94 1.41-5.96 1.41-5.96s-.36-.72-.36-1.78c0-1.66.97-2.91 2.17-2.91 1.02 0 1.52.77 1.52 1.69 0 1.03-.65 2.57-.99 3.99-.29 1.19.6 2.17 1.77 2.17 2.13 0 3.77-2.25 3.77-5.49 0-2.86-2.06-4.87-5.01-4.87-3.41 0-5.41 2.56-5.41 5.2 0 1.03.39 2.14.89 2.74.1.12.11.22.08.34-.09.38-.29 1.2-.33 1.36-.05.23-.17.27-.4.16-1.5-.69-2.43-2.88-2.43-4.65 0-3.78 2.75-7.25 7.92-7.25 4.16 0 7.39 2.97 7.39 6.92 0 4.14-2.61 7.46-6.23 7.46-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15 1.12.35 2.31.53 3.55.53 6.62 0 11.99-5.37 11.99-11.99C24.01 5.37 18.64 0 12.02 0z" />
      </svg>
    </a>
  );
}
