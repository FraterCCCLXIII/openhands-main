import { cn } from "@/src/lib/utils";

interface SectionCountBadgeProps {
  count: number;
  label?: string;
  className?: string;
  ariaLabel?: string;
}

const sectionCountPillClassName =
  "inline-flex items-center justify-center rounded-full bg-surface-raised px-2 py-0.5 text-xs text-foreground";

export function SectionCountBadge({
  count,
  label,
  className,
  ariaLabel,
}: SectionCountBadgeProps) {
  if (label) {
    return (
      <span
        aria-label={ariaLabel}
        className={cn("ml-2 inline-flex items-center gap-1.5", className)}
      >
        <span className={sectionCountPillClassName}>{count}</span>
        <span className="text-xs text-foreground">{label}</span>
      </span>
    );
  }

  return (
    <span
      aria-label={ariaLabel}
      className={cn("ml-2", sectionCountPillClassName, className)}
    >
      {count}
    </span>
  );
}
