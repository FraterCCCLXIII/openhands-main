import type { AdminCatalogFilter } from "@/src/types/admin-catalog";

export const CATALOG_AUTH_STATUS_LABELS = {
  oauth_ready: "OAuth ready",
  manual_token: "Manual token today",
  planned: "Planned",
} as const;

export const ADMIN_INTEGRATIONS_PAGE_COPY = {
  title: "Admin Integrations",
  subtitle:
    "Register, edit, and remove managed connectors for this deployment. Regular users can request missing providers through the integrations wizard.",
  userGuidanceTitle: "For users",
  userGuidanceSubtitle: "What to do when the connector you want is not listed.",
  userGuidanceInfoAriaLabel: "For users information",
  userGuidanceBody:
    "The integration wizard only shows connectors that are ready to use in this deployment. If you do not see the provider you need, please contact your deployment administrator to request additional connector registrations.",
  adminGuidanceTitle: "For admins",
  adminGuidanceSubtitle: "How to add a provider that is not currently showing up.",
  adminGuidanceInfoAriaLabel: "For admins information",
  adminGuidanceLead:
    "Managing OAuth apps is a service-level admin action. Use this page to register a managed connector so every user can see it in the integrations wizard.",
  adminGuidanceAccessNotePrefix:
    "The in-app registration form is only available to signed-in app administrators whose email appears in the",
  adminGuidanceAccessNoteEnvVar: "APP_ADMIN_EMAILS",
  adminGuidanceAccessNoteSuffix: "environment variable.",
  catalogFilterLabel: "Filter providers",
  filterAllLabel: "All",
  catalogSectionTitle: "Popular official provider options",
  catalogSectionDescription:
    "Researched catalog of 50 popular providers with official API or MCP entry points. Register one of these providers to make it show up in the integrations wizard.",
  registeredSectionTitle: "Registered managed connectors",
  registeredSectionDescription:
    "Edit stale service-level connector settings in place or delete a connector before re-registering it with a new provider type.",
  registerProviderFormTitle: "Register this provider",
  managedConnectorSearchPlaceholder: "Search managed connectors",
  managedConnectorsCountLabel: "Connectors",
  managedConnectorToolsCountLabel: "Tools",
  managedConnectorSearchEmpty: "No managed connectors match the current search.",
  searchPlaceholder: "Search by provider, category, or status",
  searchEmpty: "No providers match your search.",
  readyNowLabel: "Ready now",
  showDetails: "Show details",
  hideDetails: "Hide details",
  managedConnectorDetailModalAriaLabel: (connectorName: string) =>
    `${connectorName} connector details`,
  managedConnectorDetailIntro:
    "Edit stale provider URLs or credential settings here. Saving updates the existing service-level managed connector in place; deleting removes it until an admin registers it again.",
  managedConnectorOAuthRepairHint:
    "Stored OAuth client credentials cannot be decrypted with the current encryption key. Re-enter the OAuth client ID and secret below, then save this connector to repair it.",
  managedConnectorIndexedToolsTitle: "Indexed tools",
  managedConnectorIndexedToolsDescription:
    "Index the connector's current tools here, then set the maximum access level each user is allowed to select.",
  managedConnectorIndexingLabel: "Indexing…",
  managedConnectorRefreshToolsLabel: "Refresh indexed tools",
  managedConnectorIndexToolsLabel: "Index tools",
  managedConnectorNoIndexedTools:
    "No tools are indexed yet. Index this connector to review and constrain user-facing tool permissions.",
  managedConnectorNoToolDescription: "No description provided.",
  managedConnectorProviderTypeLabel: "Provider type",
  managedConnectorProviderMcp: "Remote MCP",
  managedConnectorProviderHttp: "Managed HTTP / OpenAPI",
  managedConnectorUpdatedLabel: "Updated",
  managedConnectorMcpServerUrlLabel: "MCP server URL",
  managedConnectorApiBaseUrlLabel: "API base URL",
  managedConnectorOpenApiUrlLabel: "OpenAPI schema URL",
  managedConnectorOpenApiHint:
    "Leave blank if you want to keep the current stored tool templates instead of regenerating them from a schema.",
  managedConnectorAuthorizationUrlLabel: "Authorization URL",
  managedConnectorTokenUrlLabel: "Token URL",
  managedConnectorRequiredScopesLabel: "Required scopes (comma separated)",
  managedConnectorOptionalScopesLabel: "Optional scopes (comma separated)",
  managedConnectorReplaceOAuthClientIdLabel: "Replace OAuth client ID (optional)",
  managedConnectorReplaceOAuthClientSecretLabel: "Replace OAuth client secret (optional)",
  managedConnectorSavingLabel: "Saving…",
  managedConnectorSaveChangesLabel: "Save changes",
  managedConnectorDeleteLabel: "Delete",
  managedConnectorDeletingLabel: "Deleting…",
  managedConnectorCloseLabel: "Close",
  managedConnectorDeleteAriaLabel: (connectorName: string) =>
    `Delete ${connectorName} connector`,
  providerSlugLabel: "Provider slug",
  authStatusLabel: "Auth status",
} as const;

export function managedConnectorsCountAriaLabel(count: number): string {
  return `${count} connector${count === 1 ? "" : "s"}`;
}

export function managedConnectorToolsCountAriaLabel(count: number): string {
  return `${count} tool${count === 1 ? "" : "s"}`;
}

export const ADMIN_CATALOG_FILTER_OPTIONS: ReadonlyArray<{
  value: AdminCatalogFilter;
  label: string;
}> = [
  { value: "all", label: ADMIN_INTEGRATIONS_PAGE_COPY.filterAllLabel },
  { value: "ready_now", label: ADMIN_INTEGRATIONS_PAGE_COPY.readyNowLabel },
  { value: "oauth_ready", label: CATALOG_AUTH_STATUS_LABELS.oauth_ready },
  { value: "manual_token", label: CATALOG_AUTH_STATUS_LABELS.manual_token },
  { value: "planned", label: CATALOG_AUTH_STATUS_LABELS.planned },
];

export const ADMIN_CATALOG_FILTER_VALUES = ADMIN_CATALOG_FILTER_OPTIONS.map(
  (option) => option.value,
);

export const ADMIN_CATALOG_FILTER_LABELS = Object.fromEntries(
  ADMIN_CATALOG_FILTER_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<AdminCatalogFilter, string>;
