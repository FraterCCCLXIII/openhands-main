import { cn } from "@/src/lib/utils";

type SemanticStatusPillVariant = "default" | "success" | "warning" | "danger";

interface SemanticStatusPillProps {
  children: React.ReactNode;
  variant?: SemanticStatusPillVariant;
  className?: string;
}

const variantClassNames: Record<SemanticStatusPillVariant, string> = {
  default:
    "border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] text-foreground",
  success:
    "border-[color:rgba(165,231,94,0.25)] bg-[color:rgba(165,231,94,0.12)] text-[var(--oh-success)]",
  warning:
    "border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] text-[var(--oh-warning)]",
  danger:
    "border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--oh-danger)]",
};

export function SemanticStatusPill({
  children,
  variant = "default",
  className,
}: SemanticStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium tracking-[0.01em]",
        variantClassNames[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
