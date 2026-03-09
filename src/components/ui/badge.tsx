import { cn } from "@/src/lib/utils";

export const Badge = ({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) => {
  const toneClass = {
    default:
      "border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-active)]",
    success:
      "border border-[color:rgba(165,231,94,0.25)] bg-[color:rgba(165,231,94,0.12)] text-[var(--color-success)]",
    warning:
      "border border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] text-[var(--color-warning)]",
    danger:
      "border border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--color-danger)]",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium tracking-[0.01em]",
        toneClass,
      )}
    >
      {children}
    </span>
  );
};
