import type { AdminCatalogFilter } from "@/src/types/admin-catalog";

export const CATALOG_AUTH_STATUS_LABELS = {
  oauth_ready: "OAuth ready",
  manual_token: "Manual token today",
  planned: "Planned",
} as const;

export const ADMIN_INTEGRATIONS_PAGE_COPY = {
  title: "Admin integrations",
  subtitle:
    "Register, edit, and remove managed connectors for this deployment. Regular users can request missing providers through the integrations wizard.",
  metaSummary: (readyCount: number, catalogCount: number) =>
    `${readyCount} connectors ready · ${catalogCount} catalog options`,
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
  searchPlaceholder: "Search by provider, category, or status",
  searchEmpty: "No providers match your search.",
  readyNowLabel: "Ready now",
  showDetails: "Show details",
  hideDetails: "Hide details",
  providerSlugLabel: "Provider slug",
  authStatusLabel: "Auth status",
} as const;

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
