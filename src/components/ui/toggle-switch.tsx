import { cn } from "@/src/lib/utils";

interface ToggleSwitchVisualProps {
  enabled: boolean;
  className?: string;
}

export function ToggleSwitchVisual({
  enabled,
  className,
}: ToggleSwitchVisualProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full border",
        "transition-colors duration-200 ease-in-out motion-reduce:transition-none",
        enabled
          ? "border-white bg-white"
          : "border-[var(--oh-border)] bg-surface-raised",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full",
          "transition-transform duration-200 ease-in-out motion-reduce:transition-none",
          enabled
            ? "translate-x-[21px] bg-base-secondary"
            : "translate-x-[2px] bg-[var(--oh-muted)]",
        )}
      />
    </span>
  );
}
