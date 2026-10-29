import type React from "react";
import { cn } from "#/utils/utils";

export type ChipTone = "neutral" | "success" | "danger" | "warning";

const TONES: Record<ChipTone, string> = {
  neutral: "border-border bg-surface-raised text-muted",
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

/** A small rounded pill: icon, label, and a tone for semantic states. */
export function Chip({
  icon,
  tone = "neutral",
  mono = false,
  title,
  children,
  testId,
}: {
  icon?: React.ReactNode;
  tone?: ChipTone;
  mono?: boolean;
  title?: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      title={title}
      className={cn(
        "inline-flex h-6 max-w-full items-center gap-1 rounded-full border px-2 text-xs leading-none",
        mono && "font-mono",
        TONES[tone],
      )}
    >
      {icon ? (
        <span className="flex flex-shrink-0 items-center [&>svg]:h-3 [&>svg]:w-3">
          {icon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
