import { ChevronRight, PlugZap, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

import {
  CompactPanel,
  ConnectorLogo,
  IntegrationMarketplaceCard,
  dashboardInputClassName,
} from "@/src/components/dashboard/shared";
import {
  formatTrackedUsage,
  UNUSED_TOOL_WINDOW_OPTIONS,
  type FilteredIntegrationToolEntry,
} from "@/src/components/dashboard/utils";
import {
  AccessModeSlider,
  getToolAccessMode,
} from "@/src/components/integrations/tool-access-controls";
import { IntegrationWizard } from "@/src/components/integrations/wizard/wizard";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import type {
  BuiltInConnectorOption,
  IntegrationSpec,
  ToolAccessMode,
  UnusedToolWindowUnit,
} from "@/src/types/context-layer";

interface IntegrationsSectionProps {
  addIntegrationSearch: string;
  availableConnectorCount: number;
  builtInConnectorsError?: string | null;
  builtInConnectorsPending: boolean;
  filteredIntegrations: FilteredIntegrationToolEntry[];
  handleDeleteIntegration: (integration: IntegrationSpec) => void;
  handleDisableUnusedTools: () => void;
  hideDisabledTools: boolean;
  integrationCount: number;
  integrationSearch: string;
  isActionPending: boolean;
  isBulkDisablePending: boolean;
  marketplaceConnectors: BuiltInConnectorOption[];
  onCreated: () => Promise<void>;
  onOpenIntegrationWizard: (builtInSlug?: string) => void;
  onStatus: (message: string | null) => void;
  onToggleIntegrationExpanded: (integrationKey: string, expanded: boolean) => void;
  onToggleToolExpanded: (toolKey: string) => void;
  onToggleIntegrationEnabled: (integration: IntegrationSpec) => void;
  onUpdateToolAccessMode: (
    integrationKey: string,
    toolName: string,
    accessMode: ToolAccessMode,
  ) => void;
  resolveIntegrationLogoUrl: (integration: IntegrationSpec) => string | null;
  setAddIntegrationSearch: (value: string) => void;
  setHideDisabledTools: (value: boolean) => void;
  setIntegrationSearch: (value: string) => void;
  showIntegrationWizard: boolean;
  unusedToolCandidateCount: number;
  unusedThresholdUnit: UnusedToolWindowUnit;
  unusedThresholdValue: string;
  unusedCutoffDateLabel: string;
  onUnusedThresholdValueChange: (value: string) => void;
  onUnusedThresholdUnitChange: (value: UnusedToolWindowUnit) => void;
  onUnusedThresholdBlur: () => void;
  expandedTools: Record<string, boolean>;
  expandedIntegrations: Record<string, boolean>;
  visibleToolCount: number;
}

export const IntegrationsSection = ({
  addIntegrationSearch,
  availableConnectorCount,
  builtInConnectorsError,
  builtInConnectorsPending,
  filteredIntegrations,
  handleDeleteIntegration,
  handleDisableUnusedTools,
  hideDisabledTools,
  integrationCount,
  integrationSearch,
  isActionPending,
  isBulkDisablePending,
  marketplaceConnectors,
  onCreated,
  onOpenIntegrationWizard,
  onStatus,
  onToggleToolExpanded,
  onToggleIntegrationEnabled,
  onToggleIntegrationExpanded,
  onUpdateToolAccessMode,
  resolveIntegrationLogoUrl,
  setAddIntegrationSearch,
  setHideDisabledTools,
  setIntegrationSearch,
  showIntegrationWizard,
  unusedToolCandidateCount,
  unusedThresholdUnit,
  unusedThresholdValue,
  unusedCutoffDateLabel,
  onUnusedThresholdValueChange,
  onUnusedThresholdUnitChange,
  onUnusedThresholdBlur,
  expandedTools,
  expandedIntegrations,
  visibleToolCount,
}: IntegrationsSectionProps) => (
  <section className="space-y-4">
    {showIntegrationWizard ? (
      <IntegrationWizard
        onCreated={onCreated}
        onStatus={onStatus}
        redirectSection="integrations"
      />
    ) : null}

    <CompactPanel title="Add integration" icon={PlugZap}>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
            <Badge>{marketplaceConnectors.length} shown</Badge>
            <Badge>{availableConnectorCount} available</Badge>
          </div>
          <input
            type="search"
            value={addIntegrationSearch}
            onChange={(event) => setAddIntegrationSearch(event.target.value)}
            placeholder="Search integrations"
            aria-label="Search integrations"
            className={cn(dashboardInputClassName, "w-full lg:max-w-md")}
          />
        </div>

        <div className="mt-3 space-y-2.5">
          {builtInConnectorsPending ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
              Loading available integrations...
            </div>
          ) : builtInConnectorsError ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
              {builtInConnectorsError}
            </div>
          ) : marketplaceConnectors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
              No popular integrations match the current search.
            </div>
          ) : (
            marketplaceConnectors.map((connector) => (
              <IntegrationMarketplaceCard
                key={connector.slug}
                connector={connector}
                onClick={() => onOpenIntegrationWizard(connector.slug)}
              />
            ))
          )}
        </div>

        <a
          href="/admin-integrations"
          className="mt-4 inline-flex text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          Can&apos;t find an integration you want? Click here.
        </a>
      </div>
    </CompactPanel>

    <CompactPanel title="Your integrations" icon={PlugZap}>
      {integrationCount === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
          No integrations activated yet. Use the section above to connect your first
          one.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  Search and review your integration tools
                </h3>
                <p className="text-xs leading-6 text-[var(--color-text-base)]">
                  Use the compact expandable rows here to search your active
                  integrations, tune access modes, and hide disabled tools by
                  default.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
                <Badge>{filteredIntegrations.length} integrations</Badge>
                <Badge>{visibleToolCount} visible tools</Badge>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <input
                type="search"
                value={integrationSearch}
                onChange={(event) => setIntegrationSearch(event.target.value)}
                placeholder="Search integrations and tools"
                aria-label="Search integrations and tools"
                className={cn(dashboardInputClassName, "w-full lg:max-w-md")}
              />
              <label className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 text-xs text-white">
                <input
                  type="checkbox"
                  checked={hideDisabledTools}
                  aria-label="Hide disabled tools"
                  onChange={(event) => setHideDisabledTools(event.target.checked)}
                />
                <span>Hide disabled tools</span>
              </label>
            </div>
          </div>

          {filteredIntegrations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-4 text-sm text-[var(--color-text-base)]">
              No integrations or tools match the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIntegrations.map(({ integration, tools, visibleTools }) => {
                const isExpanded =
                  expandedIntegrations[integration.key] ?? Boolean(integrationSearch.trim());

                return (
                  <div
                    key={integration.key}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3"
                    data-integration-key={integration.key}
                  >
                    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <ConnectorLogo
                          name={integration.name}
                          logoUrl={resolveIntegrationLogoUrl(integration)}
                          className="h-9 w-9 rounded-lg"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">
                              {integration.name}
                            </h3>
                            <Badge>{integration.provider}</Badge>
                            <Badge>{integration.kind}</Badge>
                            <Badge tone={integration.enabled ? "success" : "danger"}>
                              {integration.enabled ? "enabled" : "disabled"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[var(--color-text-base)]">
                            {integration.key} · auth: {integration.authStrategy} · {visibleTools.length} visible tool
                            {visibleTools.length === 1 ? "" : "s"}
                            {tools.length > 0 ? ` of ${tools.length}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <Button
                          type="button"
                          variant="danger"
                          className="h-8 shrink-0 gap-2 rounded-md px-3 text-xs"
                          disabled={isActionPending}
                          onClick={() => handleDeleteIntegration(integration)}
                          title="Remove this integration and any saved connection details from your personal dashboard."
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                        <Button
                          variant={integration.enabled ? "secondary" : "primary"}
                          className="h-8 shrink-0 gap-2 rounded-md px-3 text-xs"
                          disabled={isActionPending}
                          onClick={() => onToggleIntegrationEnabled(integration)}
                          title="Temporarily enable or disable the full integration."
                        >
                          {integration.enabled ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                          {integration.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 rounded-md px-3 text-xs"
                          aria-expanded={isExpanded}
                          aria-controls={`integration-tools-${integration.key}`}
                          onClick={() =>
                            onToggleIntegrationExpanded(integration.key, isExpanded)
                          }
                        >
                          {isExpanded ? "Hide tools" : "Show tools"}
                          <ChevronRight
                            className={cn(
                              "ml-1 h-4 w-4 transition-transform",
                              isExpanded && "rotate-90",
                            )}
                          />
                        </Button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div
                        id={`integration-tools-${integration.key}`}
                        className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)]"
                      >
                        {tools.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-[var(--color-text-base)]">
                            No tools registered yet.
                          </p>
                        ) : visibleTools.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-[var(--color-text-base)]">
                            No visible tools match the current filters.
                          </p>
                        ) : (
                          <div className="divide-y divide-[var(--color-border)]">
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
                                      <p className="mt-1 truncate text-xs leading-6 text-[var(--color-text-base)]">
                                        {toolSpec.description || "No description provided."}
                                      </p>
                                      <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-base)]">
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
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-8 rounded-md px-3 text-xs"
                                        aria-expanded={isToolExpanded}
                                        aria-controls={`tool-details-${toolKey}`}
                                        onClick={() => onToggleToolExpanded(toolKey)}
                                      >
                                        {isToolExpanded ? "Hide details" : "Show details"}
                                        <ChevronRight
                                          className={cn(
                                            "ml-1 h-4 w-4 transition-transform",
                                            isToolExpanded && "rotate-90",
                                          )}
                                        />
                                      </Button>
                                    </div>
                                  </div>

                                  {isToolExpanded ? (
                                    <div
                                      id={`tool-details-${toolKey}`}
                                      className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
                                    >
                                      <p className="text-sm leading-7 text-[var(--color-text-base)]">
                                        {toolSpec.description || "No description provided."}
                                      </p>
                                      <p className="mt-2 text-xs leading-6 text-[var(--color-text-base)]">
                                        Default scopes: {toolSpec.defaultScopes.join(", ") || "none"}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-6">
              <div className="space-y-1 xl:max-w-2xl">
                <h4 className="text-sm font-semibold text-white">
                  One-time bulk disable for unused tools
                </h4>
                <p className="text-xs leading-6 text-[var(--color-text-base)]">
                  Disable enabled tools with tracked usage that has been inactive
                  since before {unusedCutoffDateLabel}. Tools without tracked
                  invocation history are skipped until new tracking data exists.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end md:gap-3 xl:flex-nowrap">
                <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                  <span>Unused for at least</span>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    inputMode="numeric"
                    value={unusedThresholdValue}
                    aria-label="Unused threshold value"
                    onChange={(event) => onUnusedThresholdValueChange(event.target.value)}
                    onBlur={onUnusedThresholdBlur}
                    className={cn(dashboardInputClassName, "w-28")}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-[var(--color-text-base)]">
                  <span>Window</span>
                  <select
                    value={unusedThresholdUnit}
                    aria-label="Unused threshold unit"
                    onChange={(event) =>
                      onUnusedThresholdUnitChange(
                        event.target.value as UnusedToolWindowUnit,
                      )
                    }
                    className={cn(dashboardInputClassName, "w-32")}
                  >
                    {UNUSED_TOOL_WINDOW_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col gap-2 sm:items-end">
                  <p className="text-xs text-[var(--color-text-base)]">
                    {unusedToolCandidateCount} tool
                    {unusedToolCandidateCount === 1 ? "" : "s"} matched
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 shrink-0 rounded-md px-4 text-xs"
                    onClick={handleDisableUnusedTools}
                    disabled={isBulkDisablePending}
                    aria-label="Disable unused tools"
                  >
                    Disable
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CompactPanel>
  </section>
);
