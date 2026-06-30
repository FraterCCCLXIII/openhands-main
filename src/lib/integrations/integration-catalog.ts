import {
  listIntegrationCatalog,
  type IntegrationCatalogEntry,
  type IntegrationConnectionOption,
} from "@openhands/extensions/integrations";

import type {
  IntegrationCatalogOption,
  IntegrationConnectionDefaults,
  GenericOAuthConfig,
} from "@/src/types/integrations-hub";

const definedEntries = <T extends Record<string, unknown>>(values: T) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Partial<T>;

const connectionDefaultsFromOption = (
  option: IntegrationConnectionOption,
): IntegrationConnectionDefaults => {
  const auth = option.auth;
  const oauth = auth.oauth ?? {};
  const http = option.http ?? {};
  const transportUrl = option.transport && "url" in option.transport ? option.transport.url : undefined;

  const oauthConfig = definedEntries({
    authorizationUrl: oauth.authorizationUrl,
    tokenUrl: oauth.tokenUrl,
    scopes: oauth.scopes,
    optionalScopes: oauth.optionalScopes,
    scopeSeparator: oauth.scopeSeparator,
    pkce: oauth.pkce,
    clientAuthentication: oauth.clientAuthentication,
    registrationUrl: oauth.registrationUrl,
    additionalAuthorizationParams: oauth.additionalAuthorizationParams,
    additionalTokenParams: oauth.additionalTokenParams,
  }) as GenericOAuthConfig | undefined;

  return definedEntries({
    provider: option.provider,
    authModes: auth.authModes,
    authStrategy: auth.strategy,
    credentialLabel: auth.credentialLabel,
    credentialPlaceholder: auth.credentialPlaceholder,
    credentialHelp: auth.credentialHelp,
    apiKeyHeaderName: auth.apiKeyHeaderName,
    apiKeyOptional: auth.apiKeyOptional,
    apiBaseUrl: http.apiBaseUrl,
    serverUrl: transportUrl,
    openApiUrl: http.openApiUrl,
    oauthConfig,
  }) as IntegrationConnectionDefaults;
};

const toCatalogOption = (integration: IntegrationCatalogEntry): IntegrationCatalogOption | null => {
  const option = integration.connectionOptions[0];
  if (!option) {
    return null;
  }

  return {
    slug: integration.id,
    name: integration.name,
    description: integration.description,
    categories: integration.categories ?? [],
    appUrl: integration.appUrl,
    docsUrl: integration.docsUrl,
    logoUrl: integration.logoUrl,
    iconBg: integration.iconBg,
    iconColor: integration.iconColor,
    notes: integration.notes ?? "",
    popularityRank: integration.popularityRank ?? 0,
    connectionDefaults: connectionDefaultsFromOption(option),
  };
};

export const listIntegrationCatalogOptions = (): IntegrationCatalogOption[] =>
  listIntegrationCatalog()
    .map(toCatalogOption)
    .filter((provider): provider is IntegrationCatalogOption => provider != null);
