"use client";

import React from "react";

import {
  formatTrackedUsage,
  type FilteredIntegrationToolEntry,
} from "@/src/components/dashboard/utils";
import { DeleteIntegrationModal } from "@/src/components/integrations/delete-integration-modal";
import { DetailsRevealCaret } from "@/src/components/integrations/details-reveal-caret";
import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import { isRedundantIntegrationCardLabel } from "@/src/components/integrations/integration-card-labels";
import {
  AccessModeSlider,
  getToolAccessMode,
} from "@/src/components/integrations/tool-access-controls";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { Button } from "@/src/components/ui/button";
import {
  formatIntegrationToolCountLabel,
  getAuthTypeLabel,
  installedDetailModalAriaLabel,
  INTEGRATIONS_PAGE_COPY,
} from "@/src/constants/integrations-page";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalShellClassName } from "@/src/components/ui/modal-shell";
import {
  extensionModuleCardDisabledPillClassName,
  extensionModuleCardPillClassName,
} from "@/src/styles/extension-module-card-classes";
import type { IntegrationSpec, ToolAccessMode } from "@/src/types/integrations-hub";

interface IntegrationDetailModalProps {
  entry: FilteredIntegrationToolEntry;
  logoUrl: string | null;
  isActionPending: boolean;
  expandedTools: Record<string, boolean>;
  onClose: () => void;
  onDelete: (integration: IntegrationSpec) => boolean;
  onToggleToolExpanded: (toolKey: string) => void;
  onUpdateToolAccessMode: (
    integrationKey: string,
    toolName: string,
    accessMode: ToolAccessMode,
  ) => void;
}

export function IntegrationDetailModal({
  entry,
  logoUrl,
  isActionPending,
  expandedTools,
  onClose,
  onDelete,
  onToggleToolExpanded,
  onUpdateToolAccessMode,
}: IntegrationDetailModalProps) {
  const { integration, tools, visibleTools } = entry;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const authLabel = getAuthTypeLabel(integration.authStrategy);
  const toolCountLabel = formatIntegrationToolCountLabel(
    visibleTools.length,
    tools.length,
  );

  const detailBadges = [integration.provider, integration.kind].filter(
    (label, index, labels) =>
      label &&
      !isRedundantIntegrationCardLabel(
        label,
        integration.name,
        integration.key,
        ...labels.slice(0, index),
      ),
  );

  const handleConfirmDelete = () => {
    if (onDelete(integration)) {
      onClose();
    }
  };

  return (
    <ModalBackdrop
      ariaLabel={installedDetailModalAriaLabel(integration.name)}
      onClose={onClose}
    >
      <section
        data-testid={`integration-detail-modal-${integration.key}`}
        data-integration-key={integration.key}
        className={modalShellClassName("xl")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId={`integration-detail-modal-close-${integration.key}`}
        />

        <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-7 pt-7">
          <div className="flex items-start gap-3 pr-6">
            <IntegrationLogoBadge
              slug={integration.key}
              name={integration.name}
              logoUrl={logoUrl ?? undefined}
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h2
                  data-testid={`integration-detail-modal-name-${integration.key}`}
                  className="min-w-0 truncate text-base font-semibold text-white"
                >
                  {integration.name}
                </h2>
                {!integration.enabled ? (
                  <span
                    data-testid={`integration-detail-modal-disabled-${integration.key}`}
                    className={extensionModuleCardDisabledPillClassName}
                  >
                    {INTEGRATIONS_PAGE_COPY.installedStatusDisabled}
                  </span>
                ) : null}
              </div>
              <p
                data-testid={`integration-detail-modal-meta-${integration.key}`}
                className="mt-0.5 text-xs text-tertiary-alt"
              >
                {authLabel}
              </p>
              <div
                data-testid={`integration-detail-modal-pills-${integration.key}`}
                className="mt-2 flex flex-wrap items-center gap-1.5"
              >
                <span className={extensionModuleCardPillClassName}>
                  {toolCountLabel}
                </span>
                {detailBadges.map((label) => (
                  <span key={label} className={extensionModuleCardPillClassName}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-[var(--oh-border)] bg-[var(--oh-bg-input)]">
            {tools.length === 0 ? (
              <p className="px-4 py-4 text-sm text-[var(--oh-text-secondary)]">
                {INTEGRATIONS_PAGE_COPY.installedNoTools}
              </p>
            ) : visibleTools.length === 0 ? (
              <p className="px-4 py-4 text-sm text-[var(--oh-text-secondary)]">
                {INTEGRATIONS_PAGE_COPY.installedNoVisibleTools}
              </p>
            ) : (
              <div className="divide-y divide-[var(--oh-border)]">
                {visibleTools.map((toolSpec) => {
                  const toolKey = `${integration.key}:${toolSpec.name}`;
                  const accessMode = getToolAccessMode(toolSpec);
                  const isToolExpanded = expandedTools[toolKey] ?? false;

                  return (
                    <div
                      key={toolKey}
                      className="px-4 py-4"
                      data-tool-key={toolKey}
                      data-tool-name={toolSpec.name}
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">
                            {toolSpec.name}
                          </p>
                          <p className="mt-1 truncate text-xs leading-5 text-[var(--oh-text-secondary)]">
                            {toolSpec.description ||
                              INTEGRATIONS_PAGE_COPY.installedToolNoDescription}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-[var(--oh-text-secondary)]">
                            {formatTrackedUsage(toolSpec)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                          <AccessModeSlider
                            toolName={toolSpec.name}
                            mode={accessMode}
                            maxMode={toolSpec.maxAccessMode}
                            onChange={(nextMode) =>
                              onUpdateToolAccessMode(
                                integration.key,
                                toolSpec.name,
                                nextMode,
                              )
                            }
                          />
                          <DetailsRevealCaret
                            expanded={isToolExpanded}
                            controlsId={`tool-details-${toolKey}`}
                            showLabel={INTEGRATIONS_PAGE_COPY.installedShowToolDetails}
                            hideLabel={INTEGRATIONS_PAGE_COPY.installedHideToolDetails}
                            onToggle={() => onToggleToolExpanded(toolKey)}
                          />
                        </div>
                      </div>

                      {isToolExpanded ? (
                        <div
                          id={`tool-details-${toolKey}`}
                          className="mt-3 rounded-xl border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] p-4"
                        >
                          <p className="text-sm leading-5 text-[var(--oh-text-secondary)]">
                            {toolSpec.description ||
                              INTEGRATIONS_PAGE_COPY.installedToolNoDescription}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[var(--oh-text-secondary)]">
                            {INTEGRATIONS_PAGE_COPY.installedDefaultScopesLabel}{" "}
                            {toolSpec.defaultScopes.join(", ") ||
                              INTEGRATIONS_PAGE_COPY.installedNoneLabel}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--oh-border)] px-7 py-4">
          <Button
            type="button"
            variant="danger"
            disabled={isActionPending}
            data-testid={`integration-detail-modal-delete-${integration.key}`}
            onClick={() => setIsDeleteModalOpen(true)}
            title={INTEGRATIONS_PAGE_COPY.installedDeleteTooltip}
          >
            {INTEGRATIONS_PAGE_COPY.installedDeleteLabel}
          </Button>
          <BrandButton type="button" variant="secondary" onClick={onClose}>
            {INTEGRATIONS_PAGE_COPY.installedCloseLabel}
          </BrandButton>
        </div>
      </section>

      {isDeleteModalOpen ? (
        <DeleteIntegrationModal
          integration={integration}
          actionPending={isActionPending}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </ModalBackdrop>
  );
}
