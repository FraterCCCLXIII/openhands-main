import { PlugZap } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/src/lib/utils";

export const WizardHeader = () => (
  <div className="mb-5 flex items-start gap-3">
    <PlugZap className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-white">Connect an integration</h2>
      <p className="text-sm leading-6 text-[var(--color-text-base)]">
        Pick a connector, connect your account or paste credentials, then review
        the tools the agent can use.
      </p>
    </div>
  </div>
);

export interface OAuthReturnStatus {
  tone: "success" | "error";
  message: string;
}

export const OAuthReturnBanner = ({ status }: { status: OAuthReturnStatus }) => (
  <div
    className={cn(
      "mb-5 rounded-lg border px-4 py-3 text-sm leading-6",
      status.tone === "success"
        ? "border-[color:rgba(165,231,94,0.3)] bg-[color:rgba(165,231,94,0.1)] text-[var(--color-success)]"
        : "border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.1)] text-[var(--color-danger)]",
    )}
    data-testid="oauth-return-banner"
    role="status"
  >
    {status.message}
  </div>
);

export const WizardFeedback = ({
  children,
  tone,
  testId,
}: {
  children: ReactNode;
  tone: "error" | "success" | "info";
  testId?: string;
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
    data-testid={testId}
  >
    {children}
  </div>
);
