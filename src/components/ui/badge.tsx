import { cn } from "@/src/lib/utils";

export const Badge = ({
  children,
  tone = "default",
  size = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  size?: "default" | "sm";
}) => {
  const toneClass = {
    default:
      "border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] text-foreground",
    success:
      "border border-[color:rgba(165,231,94,0.25)] bg-[color:rgba(165,231,94,0.12)] text-[var(--oh-color-success)]",
    warning:
      "border border-[color:rgba(217,181,90,0.25)] bg-[color:rgba(217,181,90,0.12)] text-[var(--oh-warning)]",
    danger:
      "border border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--oh-color-danger)]",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex rounded-md font-medium tracking-[0.01em]",
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px] leading-4"
          : "px-2.5 py-1 text-[11px]",
        toneClass,
      )}
    >
      {children}
    </span>
  );
};
