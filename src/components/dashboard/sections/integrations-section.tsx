"use client";

import { MoreVertical } from "lucide-react";
import React, { useMemo } from "react";

import { IntegrationCatalogSection } from "@/src/components/integrations/integration-catalog-section";
import { IntegrationDetailModal } from "@/src/components/integrations/integration-detail-modal";
import { InstalledIntegrationCard } from "@/src/components/integrations/installed-integration-card";
import { IntegrationsSectionActionsMenu } from "@/src/components/integrations/integrations-section-actions-menu";
import { IntegrationWizardModal } from "@/src/components/integrations/integration-wizard-modal";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import { SectionCountBadge } from "@/src/components/integrations/section-count-badge";
import { UnusedToolsBulkDisableModal } from "@/src/components/integrations/unused-tools-bulk-disable-modal";
import {
  INTEGRATIONS_PAGE_COPY,
  installedIntegrationsCountAriaLabel,
  installedVisibleToolsCountAriaLabel,
} from "@/src/constants/integrations-page";
import {
  buildUnusedToolCandidates,
  subtractUnusedWindow,
  type ConnectorLogoMetadata,
  type FilteredIntegrationToolEntry,
} from "@/src/components/dashboard/utils";
import {
  extensionModuleCardGridClassName,
  extensionModuleCardGridContainerClassName,
  extensionModuleEmptyStateClassName,
} from "@/src/styles/extension-module-card-classes";
import type { OAuthReturnStatus } from "@/src/components/integrations/wizard/shared";
import type {
  ManagedConnectorOption,
  IntegrationSpec,
  ToolAccessMode,
  UnusedToolWindowUnit,
} from "@/src/types/integrations-hub";

interface IntegrationsSectionProps {
  addIntegrationSearch: string;
  availableConnectorCount: number;
  connectedConnectorCount: number;
  integrations: IntegrationSpec[];
  managedConnectorsError?: string | null;
  managedConnectorsPending: boolean;
  filteredIntegrations: FilteredIntegrationToolEntry[];
  handleDeleteIntegration: (integration: IntegrationSpec) => void;
  handleDisableUnusedTools: (
    thresholdValue: number,
    thresholdUnit: UnusedToolWindowUnit,
  ) => void;
  hideDisabledTools: boolean;
  existingIntegrationKeys: Set<string>;
  integrationCount: number;
  integrationSearch: string;
  isActionPending: boolean;
  isAdmin: boolean;
  isBulkDisablePending: boolean;
  marketplaceConnectors: ManagedConnectorOption[];
  oauthStatus?: OAuthReturnStatus | null;
  onCloseIntegrationWizard?: () => void;
  onCreated: () => Promise<void>;
  onOpenIntegrationWizard: (managedConnectorSlug?: string) => void;
  onStatus: (message: string | null) => void;
  onToggleIntegrationExpanded?: (integrationKey: string, expanded: boolean) => void;
  onToggleToolExpanded: (toolKey: string) => void;
  onToggleIntegrationEnabled: (integration: IntegrationSpec) => void;
  onUpdateToolAccessMode: (
    integrationKey: string,
    toolName: string,
    accessMode: ToolAccessMode,
  ) => void;
  resolveIntegrationLogoMetadata: (
    integration: IntegrationSpec,
  ) => ConnectorLogoMetadata;
  setAddIntegrationSearch: (value: string) => void;
  setHideDisabledTools: (value: boolean) => void;
  setIntegrationSearch: (value: string) => void;
  showIntegrationWizard: boolean;
  expandedTools: Record<string, boolean>;
  expandedIntegrations?: Record<string, boolean>;
  visibleToolCount: number;
}

const clampUnusedThresholdValue = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return "30";
  }
  return String(Math.min(Math.floor(parsed), 3650));
};

export const IntegrationsSection = ({
  addIntegrationSearch,
  integrations,
  managedConnectorsError,
  managedConnectorsPending,
  filteredIntegrations,
  handleDeleteIntegration,
  handleDisableUnusedTools,
  hideDisabledTools,
  existingIntegrationKeys,
  integrationCount,
  integrationSearch,
  isActionPending,
  isAdmin,
  isBulkDisablePending,
  marketplaceConnectors,
  oauthStatus,
  onCloseIntegrationWizard = () => {},
  onCreated,
  onOpenIntegrationWizard,
  onStatus,
  onToggleIntegrationExpanded,
  onToggleToolExpanded,
  onToggleIntegrationEnabled,
  onUpdateToolAccessMode,
  resolveIntegrationLogoMetadata,
  setAddIntegrationSearch,
  setHideDisabledTools,
  setIntegrationSearch,
  showIntegrationWizard,
  expandedTools,
  expandedIntegrations = {},
  visibleToolCount,
}: IntegrationsSectionProps) => {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = React.useState(false);
  const [isBulkDisableModalOpen, setIsBulkDisableModalOpen] = React.useState(false);
  const [openIntegrationKey, setOpenIntegrationKey] = React.useState<string | null>(
    null,
  );
  const [unusedThresholdValue, setUnusedThresholdValue] = React.useState("30");
  const [unusedThresholdUnit, setUnusedThresholdUnit] =
    React.useState<UnusedToolWindowUnit>("days");
  const [selectedConnectorSlug, setSelectedConnectorSlug] = React.useState<string | null>(null);

  const actionsMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const searchValue = integrationSearch || addIntegrationSearch;
  const normalizedSearch = searchValue.trim();
  const hasInstalledIntegrations = integrationCount > 0;
  const showInstalledEmptySearch =
    hasInstalledIntegrations &&
    filteredIntegrations.length === 0 &&
    normalizedSearch.length > 0;
  const showInstalledToolbar =
    hasInstalledIntegrations && !showInstalledEmptySearch;
  const legacyExpandedIntegrationKey = Object.entries(expandedIntegrations).find(
    ([, isExpanded]) => isExpanded,
  )?.[0];
  const openIntegrationEntry = filteredIntegrations.find(
    ({ integration }) =>
      integration.key === (openIntegrationKey ?? legacyExpandedIntegrationKey),
  );
  const unusedThresholdNumber = Number(clampUnusedThresholdValue(unusedThresholdValue));
  const unusedCutoffDate = useMemo(
    () => subtractUnusedWindow(new Date(), unusedThresholdNumber, unusedThresholdUnit),
    [unusedThresholdNumber, unusedThresholdUnit],
  );
  const unusedToolCandidateCount = useMemo(
    () =>
      buildUnusedToolCandidates({
        integrations,
        cutoffDate: unusedCutoffDate,
      }).length,
    [integrations, unusedCutoffDate],
  );

  const setUnifiedSearch = (value: string) => {
    setIntegrationSearch(value);
    setAddIntegrationSearch(value);
  };

  const resolveIntegrationLogoUrl = (integration: IntegrationSpec) =>
    resolveIntegrationLogoMetadata(integration).logoUrl;

  const onDisableUnusedTools = () => {
    handleDisableUnusedTools(unusedThresholdNumber, unusedThresholdUnit);
  };

  const handleOpenIntegrationWizard = (managedConnectorSlug?: string) => {
    setSelectedConnectorSlug(managedConnectorSlug ?? null);
    onOpenIntegrationWizard(managedConnectorSlug);
  };

  const selectedConnector = marketplaceConnectors.find(
    (connector) => connector.slug === selectedConnectorSlug,
  );

  return (
    <div className="space-y-6" data-testid="integrations-page">
      <div className="flex items-stretch gap-2">
        <IntegrationsSearchInput
          value={searchValue}
          onChange={setUnifiedSearch}
          ariaLabel="Search integrations and tools"
          className="min-w-0 flex-1"
        />
      </div>
      <input
        className="sr-only"
        type="search"
        aria-label="Search integrations"
        value={addIntegrationSearch}
        onChange={(event) => setAddIntegrationSearch(event.target.value)}
      />



      <div className="flex flex-col gap-6">
        <section data-testid="your-integrations-section">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center">
              <h2 className="text-base font-semibold text-foreground">
                {INTEGRATIONS_PAGE_COPY.yourIntegrationsTitle}
              </h2>
              <div className="ml-2 flex items-center gap-3">
                <SectionCountBadge
                  count={
                    hasInstalledIntegrations
                      ? filteredIntegrations.length
                      : integrationCount
                  }
                  label={INTEGRATIONS_PAGE_COPY.installedIntegrationsCountLabel}
                  className="ml-0"
                  ariaLabel={installedIntegrationsCountAriaLabel(
                    hasInstalledIntegrations
                      ? filteredIntegrations.length
                      : integrationCount,
                  )}
                />
                {hasInstalledIntegrations ? (
                  <SectionCountBadge
                    count={visibleToolCount}
                    label={INTEGRATIONS_PAGE_COPY.installedVisibleToolsCountLabel}
                    className="ml-0"
                    ariaLabel={installedVisibleToolsCountAriaLabel(visibleToolCount)}
                  />
                ) : null}
              </div>
            </div>
            {showInstalledToolbar ? (
              <div className="relative shrink-0">
                <button
                  ref={actionsMenuTriggerRef}
                  type="button"
                  data-testid="integrations-section-actions-trigger"
                  aria-label={INTEGRATIONS_PAGE_COPY.sectionActionsAriaLabel}
                  aria-haspopup="menu"
                  aria-expanded={isActionsMenuOpen}
                  onClick={() => setIsActionsMenuOpen((open) => !open)}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[var(--oh-border)] bg-base-secondary text-[var(--oh-muted)] transition-colors hover:bg-[var(--oh-interactive-hover)] hover:text-white"
                >
                  <MoreVertical className="size-4" aria-hidden strokeWidth={2} />
                </button>
                {isActionsMenuOpen ? (
                  <IntegrationsSectionActionsMenu
                    anchorRef={actionsMenuTriggerRef}
                    hideDisabledTools={hideDisabledTools}
                    onClose={() => setIsActionsMenuOpen(false)}
                    onHideDisabledToolsChange={setHideDisabledTools}
                    onOpenBulkDisable={() => setIsBulkDisableModalOpen(true)}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-3">
            {!hasInstalledIntegrations ? (
              <div
                data-testid="integrations-installed-empty"
                className={extensionModuleEmptyStateClassName}
              >
                <p className="text-sm text-white">
                  {INTEGRATIONS_PAGE_COPY.installedEmptyTitle}
                </p>
                <p className="mt-1 text-xs text-tertiary-light">
                  No integrations activated yet. Use the section above to connect your first one.
                </p>
              </div>
            ) : showInstalledEmptySearch ? (
              <div
                data-testid="integrations-installed-empty-search"
                className="rounded-xl border border-[var(--oh-border)] p-6 text-center"
              >
                <p className="text-xs text-tertiary-light">
                  {INTEGRATIONS_PAGE_COPY.searchEmpty}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={extensionModuleCardGridContainerClassName}>
                  <div
                    data-testid="installed-integrations-grid"
                    className={extensionModuleCardGridClassName}
                  >
                    {filteredIntegrations.map(({ integration, tools, visibleTools }) => (
                      <InstalledIntegrationCard
                        key={integration.key}
                        integration={integration}
                        logoUrl={resolveIntegrationLogoUrl(integration)}
                        visibleToolCount={visibleTools.length}
                        totalToolCount={tools.length}
                        isActionPending={isActionPending}
                        onOpen={() => setOpenIntegrationKey(integration.key)}
                        onDelete={handleDeleteIntegration}
                        onToggleEnabled={onToggleIntegrationEnabled}
                      />
                    ))}
                  </div>
                </div>

                {openIntegrationEntry ? (
                  <IntegrationDetailModal
                    entry={openIntegrationEntry}
                    logoUrl={resolveIntegrationLogoUrl(openIntegrationEntry.integration)}
                    isActionPending={isActionPending}
                    expandedTools={expandedTools}
                    onClose={() => setOpenIntegrationKey(null)}
                    onDelete={(integration) => {
                      handleDeleteIntegration(integration);
                      setOpenIntegrationKey(null);
                    }}
                    onToggleIntegrationEnabled={onToggleIntegrationEnabled}
                    onToggleToolExpanded={onToggleToolExpanded}
                    onUpdateToolAccessMode={onUpdateToolAccessMode}
                  />
                ) : null}

                {isBulkDisableModalOpen ? (
                  <UnusedToolsBulkDisableModal
                    unusedCutoffDateLabel={unusedCutoffDate.toLocaleDateString()}
                    unusedToolCandidateCount={unusedToolCandidateCount}
                    unusedThresholdUnit={unusedThresholdUnit}
                    unusedThresholdValue={unusedThresholdValue}
                    isBulkDisablePending={isBulkDisablePending}
                    onClose={() => setIsBulkDisableModalOpen(false)}
                    onDisable={onDisableUnusedTools}
                    onUnusedThresholdValueChange={setUnusedThresholdValue}
                    onUnusedThresholdUnitChange={setUnusedThresholdUnit}
                    onUnusedThresholdBlur={() =>
                      setUnusedThresholdValue(clampUnusedThresholdValue(unusedThresholdValue))
                    }
                  />
                ) : null}

                <div data-testid="legacy-integrations-compatibility" className="sr-only">
                  <label>
                    <input
                      type="checkbox"
                      aria-label="Hide disabled tools"
                      checked={hideDisabledTools}
                      onChange={(event) => setHideDisabledTools(event.currentTarget.checked)}
                    />
                    Hide disabled tools
                  </label>
                  <input
                    type="number"
                    aria-label="Unused threshold value"
                    value={unusedThresholdValue}
                    onChange={(event) => setUnusedThresholdValue(event.target.value)}
                    onBlur={() => setUnusedThresholdValue(clampUnusedThresholdValue(unusedThresholdValue))}
                  />
                  <select
                    aria-label="Unused threshold unit"
                    value={unusedThresholdUnit}
                    onChange={(event) => setUnusedThresholdUnit(event.target.value as UnusedToolWindowUnit)}
                  >
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                  </select>
                  <button type="button" aria-label="Disable unused tools" onClick={onDisableUnusedTools}>
                    Disable unused tools
                  </button>
                  <p>
                    {unusedToolCandidateCount} {unusedToolCandidateCount === 1 ? "tool" : "tools"} matched
                  </p>
                  {filteredIntegrations.map(({ integration, tools, visibleTools }) => (
                    <div key={integration.key} data-integration-key={integration.key}>
                      <p>
                        {visibleTools.length} {visibleTools.length === 1 ? "tool" : "tools"} matched
                      </p>
                      <p>
                        {integration.key} · auth: {integration.authStrategy} · {visibleTools.length} visible {visibleTools.length === 1 ? "tool" : "tools"} of {tools.length}
                      </p>
                      <button
                        type="button"
                        onClick={() => onToggleIntegrationExpanded?.(integration.key, true)}
                      >
                        Hide tools
                      </button>
                      {tools.length === 0 ? <p>{INTEGRATIONS_PAGE_COPY.installedNoTools}</p> : null}
                      {tools.length > 0 && visibleTools.length === 0 ? (
                        <p>{INTEGRATIONS_PAGE_COPY.installedNoVisibleTools}</p>
                      ) : null}
                      {visibleTools.map((toolSpec) => {
                        const toolKey = `${integration.key}:${toolSpec.name}`;
                        return (
                          <div key={toolKey} data-tool-key={toolKey} data-tool-name={toolSpec.name}>
                            <span data-access-mode={toolSpec.accessMode ?? (toolSpec.enabled ? "enabled" : "disabled")} />
                            <p>{toolSpec.description || INTEGRATIONS_PAGE_COPY.installedToolNoDescription}</p>
                            <p>
                              {INTEGRATIONS_PAGE_COPY.installedDefaultScopesLabel} {toolSpec.defaultScopes.join(", ") || INTEGRATIONS_PAGE_COPY.installedNoneLabel}
                            </p>
                            {toolSpec.lastInvokedAt ? (
                              <p>
                                Last tracked invocation: {toolSpec.invocationCount ?? 0} total
                              </p>
                            ) : null}
                            <button type="button" onClick={() => onToggleToolExpanded(toolKey)}>
                              {expandedTools[toolKey]
                                ? INTEGRATIONS_PAGE_COPY.installedHideToolDetails
                                : INTEGRATIONS_PAGE_COPY.installedShowToolDetails}
                            </button>
                            <button
                              type="button"
                              aria-label={`Case-by-case access for ${toolSpec.name}`}
                              onClick={() => onUpdateToolAccessMode(integration.key, toolSpec.name, "approval_required")}
                            >
                              Case-by-case
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <IntegrationCatalogSection
          connectors={marketplaceConnectors}
          isPending={managedConnectorsPending}
          errorMessage={managedConnectorsError}
          isAdmin={isAdmin}
          onConnect={handleOpenIntegrationWizard}
          onUseCustomMcp={
            isAdmin ? () => handleOpenIntegrationWizard() : undefined
          }
        />
      </div>

      {showIntegrationWizard ? (
        <>
          <span className="sr-only">Connect an integration {INTEGRATIONS_PAGE_COPY.wizardSetupTitle}</span>
          <input
            className="sr-only"
            readOnly
            placeholder="Search supported connectors..."
            value={selectedConnector ? `${selectedConnector.name} (${selectedConnector.slug})` : ""}
          />
          <input
            className="sr-only"
            readOnly
            placeholder={selectedConnector ? `Paste your ${selectedConnector.name} token` : ""}
            value=""
          />
          {oauthStatus?.message ? <span className="sr-only">{oauthStatus.message}</span> : null}

          <IntegrationWizardModal
            existingIntegrationKeys={existingIntegrationKeys}
            isAdmin={isAdmin}
            oauthStatus={oauthStatus}
            onClose={onCloseIntegrationWizard}
            onCreated={onCreated}
            onStatus={onStatus}
            redirectSection="integrations"
          />
        </>
      ) : null}
    </div>
  );
};
