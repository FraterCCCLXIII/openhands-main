import type React from "react";
import { cn } from "#/utils/utils";

/** A bordered card with an icon and a small uppercase title. */
export function Module({
  icon,
  title,
  wide = false,
  children,
  actions,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <section
      data-testid="turn-details-module"
      aria-label={title}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-xl border bg-surface p-2.5",
        tone === "danger" ? "border-danger/30" : "border-border",
        wide && "@lg:col-span-2",
      )}
    >
      <header className="flex items-center gap-1.5 text-muted">
        <span className="flex flex-shrink-0 items-center [&>svg]:h-3.5 [&>svg]:w-3.5">
          {icon}
        </span>
        <h4 className="flex-1 truncate text-xs font-semibold uppercase tracking-wider">
          {title}
        </h4>
        {actions}
      </header>
      <div className="min-w-0 text-xs text-foreground">{children}</div>
    </section>
  );
}
