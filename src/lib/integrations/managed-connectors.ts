import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextRepository } from "@/src/lib/core/repository";
import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";
import {
  getOAuthProviderRegistrationDefaults,
  hubspotMcpAuthorizationUrl,
  hubspotMcpServerUrl,
  hubspotMcpTokenUrl,
  hubspotOptionalScopes,
  hubspotRequiredScopes,
} from "@/src/lib/integrations/oauth-provider-registration-defaults";
import { readManagedOAuthClient } from "@/src/lib/oauth/managed-oauth-client";
import type {
  AuthStrategy,
  GenericOAuthConfig,
  ManagedConnectorOption,
  ToolSpec,
  ManagedConnectorDefinition,
  ManagedConnectorOAuthClientStatus,
  ManagedConnectorToolDefinition,
  ManagedConnectorRecord,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

interface ConnectorCredentialDefaults {
  slug: string;
  name: string;
  authStrategy: AuthStrategy;
  credentialLabel: string;
  apiKeyHeaderName?: string;
}

export interface DefaultManagedConnectorDefinition
  extends ConnectorCredentialDefaults {
  description: string;
  appUrl?: string;
  categories: string[];
  authModes: AuthStrategy[];
  credentialPlaceholder: string;
  credentialHelp: string;
  provider?: "http" | "mcp";
  apiBaseUrl?: string;
  openApiUrl?: string;
  serverUrl?: string;
}

export const getManagedConnectorOAuthClientStatus = (
  connector: Pick<ManagedConnectorRecord, "authStrategy" | "oauthConfig" | "encryptedOAuthClient" | "name">,
): ManagedConnectorOAuthClientStatus => {
  if (connector.authStrategy !== "oauth2") {
    return "not_applicable";
  }

  if (!connector.oauthConfig || !connector.encryptedOAuthClient) {
    return "missing";
  }

  try {
    return readManagedOAuthClient(connector) ? "decryptable" : "missing";
  } catch {
    return "unreadable";
  }
};

const isManagedConnectorOAuthConfigured = (connector: ManagedConnectorRecord) =>
  connector.authStrategy !== "oauth2" ||
  getManagedConnectorOAuthClientStatus(connector) === "decryptable";

export const normalizeOAuthScopeList = (scopes: string[] | undefined) =>
  [...new Set((scopes ?? []).map((scope) => scope.trim()).filter(Boolean))];

const sortScopes = (scopes: string[]) =>
  [...scopes].sort((left, right) => left.localeCompare(right));

const sameScopeSet = (left: string[], right: string[]) => {
  const normalizedLeft = sortScopes(normalizeOAuthScopeList(left));
  const normalizedRight = sortScopes(normalizeOAuthScopeList(right));
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((scope, index) => scope === normalizedRight[index])
  );
};

const hubspotLegacyScopeBundle = [...hubspotRequiredScopes, ...hubspotOptionalScopes];
const hubspotLegacyScopeBundleWithoutOauth = hubspotLegacyScopeBundle.filter(
  (scope) => scope !== "oauth",
);

const isHubspotManagedConnector = (
  connector: Pick<ManagedConnectorRecord, "slug" | "authStrategy">,
) => connector.slug === "hubspot" && connector.authStrategy === "oauth2";

const normalizeManagedOAuthConfig = (
  connector: Pick<
    ManagedConnectorRecord,
    "slug" | "authStrategy" | "oauthConfig" | "provider" | "apiBaseUrl" | "openApiUrl" | "serverUrl"
  >,
): GenericOAuthConfig | undefined => {
  const oauthConfig = connector.oauthConfig;
  if (!oauthConfig) {
    return undefined;
  }

  const scopes = normalizeOAuthScopeList(oauthConfig.scopes);
  const scopeSet = new Set(scopes);
  const optionalScopes = normalizeOAuthScopeList(oauthConfig.optionalScopes).filter(
    (scope) => !scopeSet.has(scope),
  );

  if (isHubspotManagedConnector(connector)) {
    return {
      authorizationUrl: hubspotMcpAuthorizationUrl,
      tokenUrl: hubspotMcpTokenUrl,
      clientAuthentication: "body",
      pkce: true,
      scopes: [],
    };
  }

  return {
    ...oauthConfig,
    scopes,
    optionalScopes: optionalScopes.length > 0 ? optionalScopes : undefined,
  };
};

const isLegacyHubspotManagedConnector = (connector: ManagedConnectorRecord) => {
  if (!isHubspotManagedConnector(connector) || !connector.oauthConfig) {
    return false;
  }

  const scopes = normalizeOAuthScopeList(connector.oauthConfig.scopes);
  const optionalScopes = normalizeOAuthScopeList(connector.oauthConfig.optionalScopes);

  return (
    connector.provider !== "mcp" ||
    connector.serverUrl?.trim() !== hubspotMcpServerUrl ||
    Boolean(connector.apiBaseUrl?.trim()) ||
    Boolean(connector.openApiUrl?.trim()) ||
    connector.oauthConfig.authorizationUrl !== hubspotMcpAuthorizationUrl ||
    connector.oauthConfig.tokenUrl !== hubspotMcpTokenUrl ||
    connector.oauthConfig.clientAuthentication !== "body" ||
    connector.oauthConfig.pkce !== true ||
    scopes.length > 0 ||
    optionalScopes.length > 0 ||
    sameScopeSet(scopes, hubspotLegacyScopeBundle) ||
    sameScopeSet(scopes, hubspotLegacyScopeBundleWithoutOauth) ||
    Boolean(connector.oauthConfig.additionalAuthorizationParams?.optional_scope)
  );
};

export const normalizeManagedConnectorRecord = (
  connector: ManagedConnectorRecord,
): ManagedConnectorRecord => {
  const oauthConfig = normalizeManagedOAuthConfig(connector);

  if (isHubspotManagedConnector(connector)) {
    return {
      ...connector,
      provider: "mcp",
      serverUrl: hubspotMcpServerUrl,
      apiBaseUrl: undefined,
      openApiUrl: undefined,
      oauthConfig,
      tools: isLegacyHubspotManagedConnector(connector) ? [] : connector.tools,
    };
  }

  return {
    ...connector,
    oauthConfig,
  };
};

const getConfiguredApiKeyHeaderName = (slug: string) =>
  getOAuthProviderRegistrationDefaults(slug)?.apiKeyHeaderName?.trim() || undefined;

const toManagedConnectorOption = (
  connector: Pick<
    DefaultManagedConnectorDefinition,
    | "slug"
    | "name"
    | "description"
    | "appUrl"
    | "categories"
    | "authModes"
    | "authStrategy"
    | "credentialLabel"
    | "credentialPlaceholder"
    | "credentialHelp"
    | "apiKeyHeaderName"
  > & {
    logoUrl?: string;
    toolCount: number;
    oauthConfigured: boolean;
  },
): ManagedConnectorOption => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  logoUrl: connector.logoUrl,
  appUrl: connector.appUrl,
  toolCount: connector.toolCount,
  categories: connector.categories,
  authModes: connector.authModes,
  authStrategy: connector.authStrategy,
  oauthConfigured: connector.oauthConfigured,
  credentialLabel: connector.credentialLabel,
  credentialPlaceholder: connector.credentialPlaceholder,
  credentialHelp: connector.credentialHelp,
  apiKeyHeaderName: connector.apiKeyHeaderName,
});

const isDefaultManagedConnectorProvider = (provider: OAuthProviderCatalogOption) => {
  const defaults = provider.registrationDefaults;
  if (!defaults?.authStrategy || defaults.authStrategy === "oauth2") {
    return false;
  }

  if (defaults.provider === "http" && defaults.apiBaseUrl && defaults.openApiUrl) {
    return true;
  }

  if (defaults.provider === "mcp" && defaults.serverUrl) {
    return true;
  }

  return false;
};

const toDefaultManagedConnector = (
  provider: OAuthProviderCatalogOption,
): DefaultManagedConnectorDefinition | null => {
  if (!isDefaultManagedConnectorProvider(provider)) {
    return null;
  }

  const defaults = provider.registrationDefaults;
  if (!defaults?.authStrategy) {
    return null;
  }

  return {
    slug: provider.managedConnectorSlug ?? provider.slug,
    name: provider.name,
    description: provider.description,
    appUrl: provider.appUrl,
    categories: provider.categories,
    authModes:
      defaults.authModes?.length && defaults.authModes.every(Boolean)
        ? defaults.authModes
        : [defaults.authStrategy],
    authStrategy: defaults.authStrategy,
    credentialLabel:
      defaults.credentialLabel ?? `${provider.name} credential`,
    credentialPlaceholder:
      defaults.credentialPlaceholder ?? `Paste your ${provider.name} credential`,
    credentialHelp:
      defaults.credentialHelp ?? `Credential required by ${provider.name}.`,
    provider: defaults.provider,
    apiBaseUrl: defaults.apiBaseUrl,
    openApiUrl: defaults.openApiUrl,
    serverUrl: defaults.serverUrl,
    apiKeyHeaderName: defaults.apiKeyHeaderName?.trim() || undefined,
  };
};

export const listDefaultManagedConnectorOptions = (): ManagedConnectorOption[] =>
  listOAuthProviderCatalog()
    .map(toDefaultManagedConnector)
    .filter((connector): connector is DefaultManagedConnectorDefinition =>
      connector != null,
    )
    .map((connector) =>
      toManagedConnectorOption({
        ...connector,
        toolCount: 0,
        oauthConfigured: true,
      }),
    );

export const getDefaultManagedConnector = (slug: string) =>
  listOAuthProviderCatalog()
    .filter((provider) => (provider.managedConnectorSlug ?? provider.slug) === slug)
    .map(toDefaultManagedConnector)
    .find((connector): connector is DefaultManagedConnectorDefinition =>
      connector != null,
    ) ?? null;

export const getManagedConnectorProvider = (connector: ManagedConnectorRecord) =>
  connector.provider ??
  (connector.serverUrl || connector.tools.length === 0 ? "mcp" : "http");

export const getManagedConnectorServerUrl = (connector: ManagedConnectorRecord) => {
  if (getManagedConnectorProvider(connector) !== "mcp") {
    return undefined;
  }

  return connector.serverUrl?.trim() || connector.apiBaseUrl?.trim() || undefined;
};

export const getManagedConnectorApiBaseUrl = (connector: ManagedConnectorRecord) => {
  if (getManagedConnectorProvider(connector) !== "http") {
    return undefined;
  }

  return connector.apiBaseUrl?.trim() || undefined;
};

export const sanitizeManagedConnector = (
  connector: ManagedConnectorRecord,
): ManagedConnectorRecord => {
  const normalizedConnector = normalizeManagedConnectorRecord(connector);
  const oauthClientStatus = getManagedConnectorOAuthClientStatus(normalizedConnector);

  return {
    ...normalizedConnector,
    provider: getManagedConnectorProvider(normalizedConnector),
    serverUrl: getManagedConnectorServerUrl(normalizedConnector),
    apiBaseUrl: getManagedConnectorApiBaseUrl(normalizedConnector),
    oauthConfigured: isManagedConnectorOAuthConfigured(normalizedConnector),
    oauthClientStatus,
    encryptedOAuthClient: undefined,
  };
};

export const managedConnectorToOption = (
  connector: ManagedConnectorRecord,
): ManagedConnectorOption =>
  toManagedConnectorOption({
    slug: connector.slug,
    name: connector.name,
    description: connector.description,
    logoUrl: connector.logoUrl,
    appUrl: connector.appUrl,
    toolCount: connector.tools.length,
    categories: connector.categories,
    authModes: connector.authModes,
    authStrategy: connector.authStrategy,
    oauthConfigured: isManagedConnectorOAuthConfigured(connector),
    credentialLabel: connector.credentialLabel,
    credentialPlaceholder: connector.credentialPlaceholder,
    credentialHelp: connector.credentialHelp,
    apiKeyHeaderName: getConfiguredApiKeyHeaderName(connector.slug),
  });

export const buildManagedConnectorToolSpecs = (
  tools: ManagedConnectorToolDefinition[],
): Record<string, ToolSpec> =>
  Object.fromEntries(
    tools.map((tool) => {
      const accessMode = tool.accessMode ?? "enabled";
      const config = {
        ...(tool.config ?? {}),
        ...(tool.request ? { request: tool.request } : {}),
      };

      return [
        tool.name,
        {
          name: tool.name,
          description: tool.description,
          enabled: accessMode !== "disabled",
          accessMode,
          maxAccessMode: accessMode,
          fineGrainedPermissions: true,
          defaultScopes: tool.defaultScopes,
          executionMode: "provider",
          config,
        } satisfies ToolSpec,
      ];
    }),
  );

export const buildManagedConnectorTools = (
  connector: Pick<ManagedConnectorRecord, "tools">,
): Record<string, ToolSpec> =>
  buildManagedConnectorToolSpecs(connector.tools);

export const buildManagedConnectorFunctionSpecs = buildManagedConnectorToolSpecs;
export const buildManagedConnectorFunctions = buildManagedConnectorTools;

export const resolveManagedConnectorCredentials = (
  connector: ConnectorCredentialDefaults,
  input: { credentials: Record<string, unknown> },
) => {
  switch (connector.authStrategy) {
    case "oauth2":
    case "none":
      return {};
    case "bearer": {
      const accessToken =
        (input.credentials.accessToken as string | undefined)?.trim() ?? "";
      if (!accessToken) {
        throw new ContextLayerError(
          `${connector.credentialLabel} is required to use the ${connector.name} connector.`,
          400,
        );
      }
      return { accessToken };
    }
    case "api_key": {
      const secret = (input.credentials.secret as string | undefined)?.trim() ?? "";
      if (!secret) {
        throw new ContextLayerError(
          `${connector.credentialLabel} is required to use the ${connector.name} connector.`,
          400,
        );
      }
      return {
        headerName:
          (input.credentials.headerName as string | undefined)?.trim() ||
          connector.apiKeyHeaderName?.trim() ||
          getConfiguredApiKeyHeaderName(connector.slug) ||
          "X-API-Key",
        secret,
      };
    }
    case "basic": {
      const username =
        (input.credentials.username as string | undefined)?.trim() ?? "";
      const password =
        (input.credentials.password as string | undefined)?.trim() ?? "";
      if (!username || !password) {
        throw new ContextLayerError(
          `${connector.credentialLabel} is required to use the ${connector.name} connector.`,
          400,
        );
      }
      return { username, password };
    }
    default:
      throw new ContextLayerError(
        `Managed connector '${connector.slug}' uses unsupported auth strategy '${connector.authStrategy}'.`,
        400,
      );
  }
};

export const listAvailableManagedConnectorOptions = async (
  repository: ContextRepository,
): Promise<ManagedConnectorOption[]> => {
  const managedConnectors = await repository.listManagedConnectors();
  const registeredSlugs = new Set(managedConnectors.map((connector) => connector.slug));

  return [
    ...managedConnectors
      .filter((candidate) => candidate.enabled)
      .map(managedConnectorToOption),
    ...listDefaultManagedConnectorOptions().filter(
      (connector) => !registeredSlugs.has(connector.slug),
    ),
  ].sort((a, b) => a.name.localeCompare(b.name));
};

const defaultManagedConnectorToDefinition = (
  connector: DefaultManagedConnectorDefinition,
): ManagedConnectorDefinition => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  appUrl: connector.appUrl,
  categories: connector.categories,
  authModes: connector.authModes,
  authStrategy: connector.authStrategy,
  provider: connector.provider,
  oauthConfigured: true,
  oauthClientStatus: "not_applicable",
  credentialLabel: connector.credentialLabel,
  credentialPlaceholder: connector.credentialPlaceholder,
  credentialHelp: connector.credentialHelp,
  apiBaseUrl: connector.apiBaseUrl,
  serverUrl: connector.serverUrl,
  openApiUrl: connector.openApiUrl,
  tools: [],
  enabled: true,
  createdAt: "",
  updatedAt: "",
});

export const listAllManagedConnectorDefinitions = async (
  repository: ContextRepository,
): Promise<ManagedConnectorDefinition[]> => {
  const dbConnectors = await repository.listManagedConnectors();
  const registeredSlugs = new Set(dbConnectors.map((c) => c.slug));

  const catalogDefaults = listOAuthProviderCatalog()
    .map(toDefaultManagedConnector)
    .filter((c): c is DefaultManagedConnectorDefinition => c != null)
    .filter((c) => !registeredSlugs.has(c.slug))
    .map(defaultManagedConnectorToDefinition);

  return [...dbConnectors.map(sanitizeManagedConnector), ...catalogDefaults].sort(
    (a, b) => a.name.localeCompare(b.name),
  );
};

export const getManagedConnectorRecord = async (
  repository: ContextRepository,
  slug: string,
) => {
  const connector = await repository.getManagedConnector(slug);
  if (!connector || !connector.enabled) {
    return null;
  }

  return normalizeManagedConnectorRecord(connector);
};
