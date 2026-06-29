import { INTEGRATION_CATALOG } from "@openhands/extensions/integrations";

export interface IntegrationLogoBranding {
  iconBg: string;
  iconColor: string;
}

export const DEFAULT_INTEGRATION_LOGO_BG = "var(--oh-color-tertiary)";
export const DEFAULT_INTEGRATION_LOGO_COLOR = "#FFFFFF";

/**
 * Brand tile colors for OAuth catalog slugs that do not yet ship `iconBg`
 * in `@openhands/extensions` catalog JSON. Hex values follow Simple Icons.
 */
const OAUTH_PROVIDER_LOGO_BRANDING: Record<string, IntegrationLogoBranding> = {
  "google-docs": { iconBg: "#4285F4", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  "google-drive": { iconBg: "#4285F4", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  "google-sheets": { iconBg: "#34A853", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  gmail: { iconBg: "#EA4335", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  "google-calendar": { iconBg: "#4285F4", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  jira: { iconBg: "#0052CC", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  confluence: { iconBg: "#172B4D", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  asana: { iconBg: "#F06A6A", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  trello: { iconBg: "#0052CC", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  clickup: { iconBg: "#7B68EE", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  monday: { iconBg: "#6161FF", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  dropbox: { iconBg: "#0061FF", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  box: { iconBg: "#0061D5", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  "microsoft-outlook": { iconBg: "#0078D4", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  "microsoft-teams": { iconBg: "#6264A7", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  onedrive: { iconBg: "#0078D4", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  sharepoint: { iconBg: "#0078D4", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  salesforce: { iconBg: "#00A1E0", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  hubspot: { iconBg: "#FF7A59", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  zendesk: { iconBg: "#03363D", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  intercom: { iconBg: "#1F1D1D", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  shopify: { iconBg: "#7AB55C", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  discord: { iconBg: "#5865F2", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  zoom: { iconBg: "#0B5CFF", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  webflow: { iconBg: "#4353FF", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  miro: { iconBg: "#050038", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  canva: { iconBg: "#00C4CC", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  datadog: { iconBg: "#632CA6", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  posthog: { iconBg: "#1D4AFF", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  vercel: { iconBg: "#000000", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  netlify: { iconBg: "#00C7B7", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  plaid: { iconBg: "#111111", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  okta: { iconBg: "#007DC1", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  servicenow: { iconBg: "#62D84E", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  freshdesk: { iconBg: "#25C16F", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  pipedrive: { iconBg: "#017737", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  mailchimp: { iconBg: "#FFE01B", iconColor: "#000000" },
  quickbooks: { iconBg: "#2CA01C", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  xero: { iconBg: "#13B5EA", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  gitlab: { iconBg: "#FC6D26", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  bitbucket: { iconBg: "#0052CC", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  ordinal: { iconBg: "#111827", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
  "custom-mcp": {
    iconBg: "var(--oh-interactive-hover)",
    iconColor: DEFAULT_INTEGRATION_LOGO_COLOR,
  },
};

/** Overrides catalog defaults where the hub wants a stronger brand tile. */
const INTEGRATION_LOGO_BRANDING_OVERRIDES: Record<string, IntegrationLogoBranding> = {
  github: { iconBg: "#6E40C9", iconColor: DEFAULT_INTEGRATION_LOGO_COLOR },
};

const buildIntegrationLogoBrandingMap = (): Record<string, IntegrationLogoBranding> => {
  const branding: Record<string, IntegrationLogoBranding> = {
    ...OAUTH_PROVIDER_LOGO_BRANDING,
  };

  for (const entry of INTEGRATION_CATALOG) {
    if (!entry.iconBg) {
      continue;
    }

    branding[entry.id] = {
      iconBg: entry.iconBg,
      iconColor: entry.iconColor ?? DEFAULT_INTEGRATION_LOGO_COLOR,
    };
  }

  return {
    ...branding,
    ...INTEGRATION_LOGO_BRANDING_OVERRIDES,
  };
};

const INTEGRATION_LOGO_BRANDING = buildIntegrationLogoBrandingMap();

export function getIntegrationLogoBranding(slug: string): IntegrationLogoBranding {
  return (
    INTEGRATION_LOGO_BRANDING[slug] ?? {
      iconBg: DEFAULT_INTEGRATION_LOGO_BG,
      iconColor: DEFAULT_INTEGRATION_LOGO_COLOR,
    }
  );
}
