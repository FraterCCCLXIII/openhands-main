import type { AuthStrategy } from "@/src/types/integrations-hub";

export const INTEGRATIONS_PAGE_COPY = {
  title: "Integrations",
  subtitle:
    "Connect managed services so agents can use approved tools with scoped permissions.",
  searchPlaceholder: "Search integrations",
  searchClearAriaLabel: "Clear search",
  yourIntegrationsTitle: "Your integrations",
  addIntegrationTitle: "Add integration",
  installedEmptyTitle: "No integrations activated yet",
  installedEmptyHint:
    "Browse the catalog below to connect your first integration.",
  searchEmpty: "No integrations match your search.",
  requestIntegration: "Add Integration",
  cantFindPrompt: "Can't find an integration you want?",
  cantFindLink: "Click here.",
  catalogAddLabel: "Add integration",
  catalogAddTooltip: "Add integration",
  catalogRemoveTooltip: "Remove",
  wizardModalAriaLabel: "Integration setup",
  loadingCatalog: "Loading available integrations...",
  catalogLoadError: "Unable to load integrations catalog.",
  sectionActionsAriaLabel: "Integrations section actions",
  disableUnusedToolsMenuItem: "Disable unused tools",
  hideDisabledToolsLabel: "Hide disabled tools",
  bulkDisableModalAriaLabel: "Disable unused tools",
  bulkDisableTitle: "One-time bulk disable for unused tools",
  bulkDisableUnusedForLabel: "Unused for at least",
  bulkDisableWindowLabel: "Window",
  bulkDisableDisableButton: "Disable",
  installedEnableLabel: "Enable integration",
  installedDisableLabel: "Disable integration",
  installedEnableTooltip: "Enable",
  installedDisableTooltip: "Disable",
  installedStatusDisabled: "Disabled",
  installedDeleteLabel: "Delete",
  installedDeleteTooltip:
    "Remove this integration and any saved connection details from your personal dashboard.",
  deleteModalAriaLabel: "Delete integration",
  deleteModalTitle: "Delete integration?",
  deleteModalDescription: (integrationName: string) =>
    `This permanently removes "${integrationName}" and any saved connection details from your personal dashboard. This action cannot be undone.`,
  deleteConfirm: "Delete integration",
  cancel: "Cancel",
  installedCloseLabel: "Close",
  installedNoTools: "No tools registered yet.",
  installedNoVisibleTools: "No visible tools match the current filters.",
  installedToolNoDescription: "No description provided.",
  installedShowToolDetails: "Show details",
  installedHideToolDetails: "Hide details",
  installedEnabledStateLabel: "Enabled",
  installedDisabledStateLabel: "Disabled",
  installedDefaultScopesLabel: "Default scopes:",
  installedNoneLabel: "none",
  installedIntegrationsCountLabel: "Integrations",
  installedVisibleToolsCountLabel: "Tools",
} as const;

export function installedDetailModalAriaLabel(integrationName: string): string {
  return `${integrationName} integration details`;
}

export function installedIntegrationsCountAriaLabel(count: number): string {
  return `${count} integration${count === 1 ? "" : "s"}`;
}

export function installedVisibleToolsCountAriaLabel(count: number): string {
  return `${count} visible tool${count === 1 ? "" : "s"}`;
}

export function formatBulkDisableDescription(cutoffDateLabel: string): string {
  return `Disable enabled tools with tracked usage that has been inactive since before ${cutoffDateLabel}. Tools without tracked invocation history are skipped until new tracking data exists.`;
}

export function formatToolsMatchedLabel(count: number): string {
  return `${count} tool${count === 1 ? "" : "s"} matched`;
}

export const AUTH_TYPE_LABELS: Record<AuthStrategy, string> = {
  oauth2: "OAuth2",
  api_key: "API Key",
  bearer: "Bearer token",
  basic: "Basic auth",
  none: "No Auth",
  mcp_session: "MCP session",
};

export function getAuthTypeLabel(authStrategy: AuthStrategy): string {
  return AUTH_TYPE_LABELS[authStrategy] ?? authStrategy;
}

export function formatIntegrationToolCountLabel(
  visibleCount: number,
  totalCount: number,
): string {
  if (totalCount > 0 && visibleCount !== totalCount) {
    return `${visibleCount} of ${totalCount} tools`;
  }

  return `${visibleCount} tool${visibleCount === 1 ? "" : "s"}`;
}
