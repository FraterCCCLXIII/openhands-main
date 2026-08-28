"use client";

import React from "react";

import { CirclePlusCheckToggle } from "@/src/components/shared/buttons/circle-plus-check-toggle";
import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import { isRedundantIntegrationCardLabel } from "@/src/components/integrations/integration-card-labels";
import {
  formatIntegrationToolCountLabel,
  getAuthTypeLabel,
  INTEGRATIONS_PAGE_COPY,
} from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import {
  extensionModuleCardInteractiveClassName,
  extensionModuleCardPillClassName,
  extensionModuleCardSurfaceClassName,
} from "@/src/styles/extension-module-card-classes";
import type { IntegrationSpec } from "@/src/types/integrations-hub";

interface InstalledIntegrationCardProps {
  integration: IntegrationSpec;
  logoUrl: string | null;
  visibleToolCount: number;
  totalToolCount: number;
  isActionPending: boolean;
  onOpen: () => void;
  onToggleEnabled: (integration: IntegrationSpec) => void;
}

export function InstalledIntegrationCard({
  integration,
  logoUrl,
  visibleToolCount,
  totalToolCount,
  isActionPending,
  onOpen,
  onToggleEnabled,
}: InstalledIntegrationCardProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const authLabel = getAuthTypeLabel(integration.authStrategy);
  const toolCountLabel = formatIntegrationToolCountLabel(
    visibleToolCount,
    totalToolCount,
  );

  const cardPills = [integration.provider, integration.kind].filter(
    (label, index, labels) =>
      label &&
      !isRedundantIntegrationCardLabel(
        label,
        integration.name,
        integration.key,
        ...labels.slice(0, index),
      ),
  );

  return (
    <article
      data-integration-key={integration.key}
      data-testid={`installed-integration-card-${integration.key}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex min-w-0 cursor-pointer flex-col overflow-hidden p-4 text-left",
        extensionModuleCardSurfaceClassName,
        extensionModuleCardInteractiveClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <IntegrationLogoBadge
          slug={integration.key}
          name={integration.name}
          logoUrl={logoUrl ?? undefined}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                data-testid={`installed-integration-name-${integration.key}`}
                className="truncate text-sm font-semibold text-white"
              >
                {integration.name}
              </h3>
              <p
                data-testid={`installed-integration-meta-${integration.key}`}
                className="mt-0.5 text-xs text-tertiary-alt"
              >
                {authLabel}
              </p>
            </div>
            <CirclePlusCheckToggle
              testId={`installed-integration-toggle-${integration.key}`}
              isSelected={integration.enabled}
              isDisabled={isActionPending}
              onToggle={() => onToggleEnabled(integration)}
              enableLabel={INTEGRATIONS_PAGE_COPY.installedEnableLabel}
              disableLabel={INTEGRATIONS_PAGE_COPY.installedDisableLabel}
              enableTooltip={INTEGRATIONS_PAGE_COPY.installedEnableTooltip}
              disableTooltip={INTEGRATIONS_PAGE_COPY.installedDisableTooltip}
              removeTooltip={INTEGRATIONS_PAGE_COPY.installedDisableTooltip}
            />
          </header>

          <div
            data-testid={`installed-integration-pills-${integration.key}`}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className={extensionModuleCardPillClassName}>{toolCountLabel}</span>
            {cardPills.map((label) => (
              <span key={label} className={extensionModuleCardPillClassName}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
