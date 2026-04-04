import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import type { BuiltInConnectorOption } from "@/src/types/context-layer";

export const dashboardInputClassName =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--color-accent)]";

interface CompactPanelProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}

export const CompactPanel = ({
  title,
  icon: Icon,
  children,
  action,
}: CompactPanelProps) => (
  <Card className="overflow-hidden p-0">
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-accent)]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </Card>
);

interface KeyValueRowProps {
  label: string;
  value: ReactNode;
}

export const KeyValueRow = ({ label, value }: KeyValueRowProps) => (
  <div className="grid gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-base)]">
      {label}
    </p>
    <div className="text-sm text-white">{value}</div>
  </div>
);

export const getConnectorLogoUrl = (connector: {
  appUrl?: string;
}): string | null => {
  const appUrl = connector.appUrl?.trim();
  if (!appUrl) {
    return null;
  }

  try {
    const url = new URL(appUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return null;
  }
};

interface ConnectorLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

export const ConnectorLogo = ({
  name,
  logoUrl,
  className,
}: ConnectorLogoProps) => {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm font-semibold text-white",
        className,
      )}
      aria-hidden="true"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          onError={(event) => {
            const target = event.currentTarget;
            target.style.display = "none";
          }}
        />
      ) : null}
      <span className={logoUrl ? "hidden" : undefined}>{initial}</span>
    </div>
  );
};

interface IntegrationMarketplaceCardProps {
  connector: BuiltInConnectorOption;
  onClick: () => void;
}

export const IntegrationMarketplaceCard = ({
  connector,
  onClick,
}: IntegrationMarketplaceCardProps) => {
  const logoUrl = getConnectorLogoUrl(connector);

  return (
    <button
      type="button"
      onClick={onClick}
      data-built-in-slug={connector.slug}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-active)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <ConnectorLogo name={connector.name} logoUrl={logoUrl} className="h-10 w-10" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{connector.name}</p>
            <Badge>{connector.slug}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-6 text-[var(--color-text-base)]">
            {connector.description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--color-text-base)]">
        <Badge>{connector.authStrategy}</Badge>
        <Badge>{connector.toolCount} tools</Badge>
        <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-xs text-white">
          Connect
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
};
