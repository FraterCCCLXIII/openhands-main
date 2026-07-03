"use client";

import React from "react";

import { CirclePlusCheckToggle } from "@/src/components/shared/buttons/circle-plus-check-toggle";
import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import {
  formatIntegrationToolCountLabel,
  getAuthTypeLabel,
  INTEGRATIONS_PAGE_COPY,
} from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import {
  extensionModuleCardDangerPillClassName,
  extensionModuleCardDisabledPillClassName,
  extensionModuleCardInteractiveClassName,
  extensionModuleCardPillClassName,
  extensionModuleCardSuccessPillClassName,
  extensionModuleCardSurfaceClassName,
  extensionModuleCardWarningPillClassName,
} from "@/src/styles/extension-module-card-classes";
import type { ManagedConnectorDefinition } from "@/src/types/integrations-hub";

import {
  formatUpdatedAt,
  getCredentialStatusLabel,
  getCredentialStatusTone,
  inferProvider,
} from "./managed-connector-shared";

const credentialStatusPillClassName = {
  success: extensionModuleCardSuccessPillClassName,
  warning: extensionModuleCardWarningPillClassName,
  danger: extensionModuleCardDangerPillClassName,
} as const;

interface ManagedConnectorCardProps {
  connector: ManagedConnectorDefinition;
  isActionPending: boolean;
  onOpen: () => void;
  onToggleEnabled: (connector: ManagedConnectorDefinition) => void;
}

export function ManagedConnectorCard({
  connector,
  isActionPending,
  onOpen,
  onToggleEnabled,
}: ManagedConnectorCardProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const provider = inferProvider(connector);
  const authLabel = getAuthTypeLabel(connector.authStrategy);
  const visibleToolCount = connector.tools.filter(
    (tool) => tool.accessMode !== "disabled",
  ).length;
  const toolCountLabel = formatIntegrationToolCountLabel(
    visibleToolCount,
    connector.tools.length,
  );
  const credentialStatusLabel = getCredentialStatusLabel(connector);

  return (
    <article
      data-managed-connector={connector.slug}
      data-testid={`managed-connector-card-${connector.slug}`}
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
          slug={connector.slug}
          name={connector.name}
          logoUrl={connector.logoUrl}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h3
                  data-testid={`managed-connector-name-${connector.slug}`}
                  className="min-w-0 truncate text-sm font-semibold text-white"
                >
                  {connector.name}
                </h3>
                {!connector.enabled ? (
                  <span
                    data-testid={`managed-connector-disabled-${connector.slug}`}
                    className={extensionModuleCardDisabledPillClassName}
                  >
                    Disabled
                  </span>
                ) : null}
              </div>
              <p
                data-testid={`managed-connector-meta-${connector.slug}`}
                className="mt-0.5 text-xs text-tertiary-alt"
              >
                {authLabel}
              </p>
              {connector.description ? (
                <p
                  data-testid={`managed-connector-description-${connector.slug}`}
                  className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--oh-text-secondary)]"
                >
                  {connector.description}
                </p>
              ) : null}
            </div>
            <CirclePlusCheckToggle
              testId={`managed-connector-toggle-${connector.slug}`}
              isSelected={connector.enabled}
              isDisabled={isActionPending}
              onToggle={() => onToggleEnabled(connector)}
              enableLabel={INTEGRATIONS_PAGE_COPY.installedEnableLabel}
              disableLabel={INTEGRATIONS_PAGE_COPY.installedDisableLabel}
              enableTooltip={INTEGRATIONS_PAGE_COPY.installedEnableTooltip}
              disableTooltip={INTEGRATIONS_PAGE_COPY.installedDisableTooltip}
              removeTooltip={INTEGRATIONS_PAGE_COPY.installedDisableTooltip}
            />
          </header>

          <div
            data-testid={`managed-connector-pills-${connector.slug}`}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className={extensionModuleCardPillClassName}>{toolCountLabel}</span>
            <span className={extensionModuleCardPillClassName}>{provider}</span>
            <span className={extensionModuleCardPillClassName}>
              {connector.authStrategy}
            </span>
            <span
              className={
                credentialStatusPillClassName[getCredentialStatusTone(connector)]
              }
            >
              {credentialStatusLabel}
            </span>
          </div>

          <p
            data-testid={`managed-connector-details-${connector.slug}`}
            className="text-[11px] leading-5 text-[var(--oh-text-secondary)]"
          >
            Updated {formatUpdatedAt(connector.updatedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
