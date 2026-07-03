import { cn } from "@/src/lib/utils";

interface StatusPillProps {
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({ children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] px-2.5 py-1 text-[11px] font-medium tracking-[0.01em] text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
