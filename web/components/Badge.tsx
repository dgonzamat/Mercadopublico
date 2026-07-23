import { cn, TIER_META, CATEGORY_META, type TierKey } from "@/lib/ui";
import { T } from "@/components/T";

type BadgeVariant = "neutral" | "outline" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

/**
 * Single source of truth for the small label chips used across the site
 * (tier, category, badge for "En vivo" / "Roadmap" / "próximamente", year, etc.).
 * Replaces the repeated `rounded bg-bg px-2 py-0.5 font-mono text-xs uppercase`
 * pattern scattered through pages.
 */
export function Badge({ variant = "neutral", className, title, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    neutral: "border border-transparent bg-bg text-muted",
    outline: "border border-border bg-panel text-muted",
    accent: "border border-accent/30 bg-accent/10 text-accent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 font-mono text-xs uppercase tracking-widest",
        variants[variant],
        className,
      )}
      title={title}
    >
      {children}
    </span>
  );
}

export function TierBadge({ tier, withDescription = false }: { tier: TierKey; withDescription?: boolean }) {
  const meta = TIER_META[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-none border-2 px-3 py-1 text-xs",
        meta.bg,
        meta.border,
        meta.color,
      )}
      title={withDescription ? undefined : meta.description}
    >
      <span className="font-display font-medium">{meta.plain}</span>
      <span className="font-mono uppercase tracking-widest text-muted">
        {tier}
      </span>
    </span>
  );
}

// Epistemic-status chips. "documented" is the default and renders nothing;
// only recent/in-progress ("developing") and near-future corpus content
// ("projected") get a visible marker so speculative entries read honestly.
const EPISTEMIC: Record<
  "developing" | "projected",
  { icon: string; es: string; en: string; cls: string }
> = {
  developing: {
    icon: "●",
    es: "En desarrollo",
    en: "Developing",
    cls: "border-accent/30 bg-accent/10 text-accent",
  },
  projected: {
    icon: "◷",
    es: "Proyectado",
    en: "Projected",
    cls: "border-dashed border-muted/60 bg-bg text-muted",
  },
};

export function EpistemicBadge({
  status,
  compact = false,
  locale,
}: {
  status?: string;
  compact?: boolean;
  locale?: "es" | "en";
}) {
  if (status !== "developing" && status !== "projected") return null;
  const m = EPISTEMIC[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 border px-2 py-0.5 font-mono text-xs uppercase tracking-widest",
        m.cls,
      )}
      title={compact ? m.es : undefined}
    >
      <span aria-hidden>{m.icon}</span>
      {!compact && <T es={m.es} en={m.en} locale={locale} />}
    </span>
  );
}

export function CategoryBadge({
  category,
  locale,
}: {
  category: string;
  locale?: "es" | "en";
}) {
  const meta = CATEGORY_META[category];
  if (!meta) return null;
  return (
    <Badge variant="outline">
      <span aria-hidden>{meta.icon}</span>
      <span>
        <T es={meta.label} en={meta.label_en} locale={locale} />
      </span>
    </Badge>
  );
}
