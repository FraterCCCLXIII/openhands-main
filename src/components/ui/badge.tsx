import { cn } from "@/src/lib/utils";

export const Badge = ({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) => {
  const toneClass = {
    default: "bg-white/5 text-[var(--color-text-active)]",
    success: "bg-[var(--color-success)]/15 text-green-200",
    warning: "bg-[var(--color-warning)]/15 text-amber-200",
    danger: "bg-[var(--color-danger)]/15 text-red-200",
  }[tone];

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", toneClass)}>
      {children}
    </span>
  );
};
