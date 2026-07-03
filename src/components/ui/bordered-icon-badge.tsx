import type { LucideIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";

export const borderedIconBadgeClassName =
  "rounded-md border border-[var(--oh-border)] bg-base-secondary p-2";

interface BorderedIconBadgeProps {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}

export function BorderedIconBadge({
  icon: Icon,
  className,
  iconClassName,
}: BorderedIconBadgeProps) {
  return (
    <span className={cn(borderedIconBadgeClassName, className)}>
      <Icon className={cn("h-4 w-4 shrink-0 text-primary", iconClassName)} aria-hidden />
    </span>
  );
}
