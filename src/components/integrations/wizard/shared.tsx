import { PlugZap } from "lucide-react";
import type { ReactNode } from "react";

import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";

interface WizardHeaderProps {
  title?: string | null;
  description?: string | null;
  logoSlug?: string | null;
  logoUrl?: string | null;
  authLabel?: string | null;
  isConnected?: boolean;
}

export const WizardHeader = ({
  title,
  description,
  logoSlug,
  logoUrl,
  authLabel,
  isConnected = false,
}: WizardHeaderProps = {}) => (
  <header
    className="flex items-start gap-3"
    data-testid="integration-wizard-header"
  >
    {logoSlug ? (
      <IntegrationLogoBadge
        slug={logoSlug}
        name={title?.trim() || logoSlug}
        logoUrl={logoUrl ?? undefined}
        className="mt-0.5"
      />
    ) : (
      <PlugZap className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
    )}
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-white">
          {title?.trim() || "Connect an integration"}
        </h2>
        {authLabel ? <Badge>{authLabel}</Badge> : null}
        {isConnected ? <Badge tone="success">Connected</Badge> : null}
      </div>
      <p className="text-sm leading-6 text-[var(--color-text-base)]">
        {description?.trim() ||
          "Pick a connector, connect your account or paste credentials, then review the tools the agent can use."}
      </p>
    </div>
  </header>
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
