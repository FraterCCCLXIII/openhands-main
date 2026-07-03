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
  extensionModuleCardDisabledPillClassName,
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
  onDelete?: (integration: IntegrationSpec) => void;
  onToggleEnabled: (integration: IntegrationSpec) => void;
}

export function InstalledIntegrationCard({
  integration,
  logoUrl,
  visibleToolCount,
  totalToolCount,
  isActionPending,
  onOpen,
  onDelete,
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
        <img
          src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
          alt={`${integration.name} logo`}
          className="sr-only"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h3
                  data-testid={`installed-integration-name-${integration.key}`}
                  className="min-w-0 truncate text-sm font-semibold text-white"
                >
                  {integration.name}
                </h3>
                {!integration.enabled ? (
                  <span
                    data-testid={`installed-integration-disabled-${integration.key}`}
                    className={extensionModuleCardDisabledPillClassName}
                  >
                    {INTEGRATIONS_PAGE_COPY.installedStatusDisabled}
                  </span>
                ) : null}
              </div>
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

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <button
              type="button"
              className="rounded-md border border-[var(--oh-border)] px-2.5 py-1 text-tertiary-light transition-colors hover:bg-[var(--oh-interactive-hover)] hover:text-white"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              Show tools
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--oh-border)] px-2.5 py-1 text-tertiary-light transition-colors hover:bg-[var(--oh-interactive-hover)] hover:text-white"
              disabled={isActionPending}
              onClick={(event) => {
                event.stopPropagation();
                onToggleEnabled(integration);
              }}
            >
              {integration.enabled ? "Disable" : "Enable"}
            </button>
            {onDelete ? (
              <button
                type="button"
                className="rounded-md border border-red-400/35 px-2.5 py-1 text-red-200 transition-colors hover:bg-red-500/10 hover:text-red-100"
                disabled={isActionPending}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(integration);
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
