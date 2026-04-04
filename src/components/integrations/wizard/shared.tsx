import { CheckCircle2, PlugZap } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/src/lib/utils";

interface StepBadgeProps {
  step: number;
  label: string;
  active?: boolean;
  complete?: boolean;
}

export const StepBadge = ({
  step,
  label,
  active = false,
  complete = false,
}: StepBadgeProps) => (
  <div
    className={cn(
      "flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-sm",
      active
        ? "border-[var(--color-accent)] bg-[var(--color-bg-active)] text-white"
        : complete
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-base)]",
    )}
  >
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-bg-primary)]"
          : complete
            ? "bg-emerald-500/20 text-emerald-100"
            : "bg-[var(--color-bg-input)] text-white",
      )}
    >
      {complete ? <CheckCircle2 className="h-4 w-4" /> : step}
    </span>
    <span>{label}</span>
  </div>
);

export const IntegrationWizardIntro = () => (
  <div className="mb-4 space-y-2">
    <div className="flex items-center gap-3">
      <PlugZap className="h-5 w-5 text-[var(--color-accent)]" />
      <h2 className="text-xl font-semibold text-white">
        Step-by-step integration setup
      </h2>
    </div>
    <p className="text-sm leading-7 text-[var(--color-text-base)]">
      Choose a Built-in connector hosted in this deployment or a remote MCP server,
      let the dashboard discover the available functions, then keep each function
      enabled, disable it, or mark it as case-by-case approval.
    </p>
  </div>
);

export const IntegrationWizardFeedback = ({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "error" | "success" | "info";
}) => (
  <div
    className={cn(
      "rounded-xl border px-4 py-3 text-sm leading-6",
      tone === "error"
        ? "border-red-500/40 bg-red-500/10 text-red-100"
        : tone === "success"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
          : "border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-base)]",
    )}
    data-testid="discover-feedback"
  >
    {children}
  </div>
);
