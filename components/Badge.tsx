import { cn, TIER_META, CATEGORY_META, type TierKey } from "@/lib/ui";

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
        "inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs uppercase tracking-widest",
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
        "inline-flex items-center rounded-md border px-3 py-1 font-mono text-xs uppercase",
        meta.bg,
        meta.border,
        meta.color,
      )}
      title={withDescription ? undefined : meta.description}
    >
      Tier {tier}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  if (!meta) return null;
  return (
    <Badge variant="outline">
      <span aria-hidden>{meta.icon}</span>
      <span>{meta.label}</span>
    </Badge>
  );
}
