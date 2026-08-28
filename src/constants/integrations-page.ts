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
  wizardContinue: "Continue",
  wizardBack: "Back",
  wizardDiscoverTools: "Review tools",
  wizardCreateIntegration: "Create integration",
  wizardSetupTitle: "Step-by-step integration setup",
  wizardSetupDescription:
    "Choose a Managed connector hosted in this deployment or a remote MCP server, let the dashboard discover the available tools, then keep each tool enabled, disable it, or mark it for case-by-case approval.",
  wizardConnectStepTitle: "Connect and discover tools",
  wizardConnectStepDescription:
    "Pick a managed connector or MCP server, connect with the required credentials, then discover the tools this integration exposes.",
  wizardReviewStepTitle: "Review access defaults",
  wizardReviewStepDescription:
    "Review each discovered tool and set its default access. Keep tools enabled, disable them, or mark them for case-by-case approval before saving.",
  wizardStepInfoAriaLabel: "What happens in this step",
  wizardConnectSidebarTitle: "What happens in this step",
  wizardConnectSidebarManagedBullets: [
    "The dashboard loads the managed connectors registered for this service.",
    "Choosing a connector auto-fills the integration key and display name, while still letting you customize them if needed.",
    "For OAuth connectors, each user connects their own account and the token is stored server-side for that user only.",
    "Choosing Review tools calls the MCP for the selected connector and brings its full tool list into the review step.",
  ] as const,
  wizardConnectSidebarMcpBullets: [
    "The dashboard connects to your MCP server and calls listTools.",
    "It infers auth from the credentials you provide, without making you choose an auth type explicitly.",
    "For GitHub MCP, use https://api.githubcopilot.com/mcp/ plus a GitHub PAT in Access token.",
    "Every discovered tool is prepared as enabled by default for the review step.",
  ] as const,
  wizardManagedConnectorLabel: "Managed connector",
  wizardManagedConnectorPlaceholder: "Choose GitHub, Notion, Slack...",
  wizardManagedConnectorLoadingPlaceholder: "Loading supported connectors...",
  wizardManagedConnectorHint:
    "Use the dropdown and start typing to filter the managed connectors registered for this deployment. Selecting one auto-fills a name and key you can change to save another connection.",
  wizardManagedConnectorMissingPrefix: "Don't see a connector you want?",
  wizardAdvancedLabel: "Advanced settings",
  wizardIntegrationKeyLabel: "Integration key",
  wizardIntegrationKeyHint:
    "Edit this if you want more than one saved connection for the same managed connector.",
  wizardIntegrationKeyLockedHint:
    "The key is locked because an OAuth connection already exists for it. Delete the integration to use a different key.",
  wizardDisplayNameLabel: "Display name",
  wizardConnectAccountTitle: (name: string) => `Connect your ${name} account`,
  wizardConnectAccountDescriptionOAuth: (name: string) =>
    `OAuth connection for ${name}.`,
  wizardConnectAccountDescriptionApiKey: (name: string) =>
    `API key connection for ${name}.`,
  wizardOpenProviderDocs: "Open provider docs",
  wizardCustomMcpLabel: "Use a custom MCP server URL instead",
  wizardConnect: "Connect",
  wizardConnected: "Connected",
  wizardReconnect: "Reconnect",
  wizardNotAvailable: "Not available",
  wizardReviewNoTools:
    "No tools were discovered for this connector. Go back and confirm the selected managed connector or MCP server URL.",
  wizardReviewSearchEmpty: "No tools match this search. Try a different term.",
  wizardAdminDiagnosticsTitle: "Admin diagnostics",
  wizardSearchToolsPlaceholder: "Search tools",
  wizardBulkActions: "Bulk Actions",
  wizardSelectAllMatches: "Select all matches",
  wizardDeselectMatches: "Deselect matches",
  wizardEnableSelected: "Enable selected",
  wizardCaseByCaseSelected: "Case-by-case selected",
  wizardDisableSelected: "Disable selected",
  installedCloseLabel: "Close",
  installedNoTools: "No tools registered yet.",
  installedNoVisibleTools: "No visible tools match the current filters.",
  installedToolNoDescription: "No description provided.",
  installedShowToolDetails: "Show details",
  installedHideToolDetails: "Hide details",
  viewMoreLabel: "View More",
  viewLessLabel: "View Less",
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

export function wizardDiscoveredToolsCountAriaLabel(count: number): string {
  return `${count} tool${count === 1 ? "" : "s"}`;
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
