import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextRepository } from "@/src/lib/core/repository";
import type {
  BuiltInConnectorOption,
  FunctionSpec,
  ManagedConnectorRecord,
} from "@/src/types/context-layer";

const isManagedConnectorOAuthConfigured = (connector: ManagedConnectorRecord) =>
  connector.authStrategy !== "oauth2" ||
  (!!connector.oauthConfig && !!connector.encryptedOAuthClient);

export const getManagedConnectorProvider = (connector: ManagedConnectorRecord) =>
  connector.provider ??
  (connector.serverUrl || connector.functions.length === 0 ? "mcp" : "http");

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
): ManagedConnectorRecord => ({
  ...connector,
  provider: getManagedConnectorProvider(connector),
  serverUrl: getManagedConnectorServerUrl(connector),
  apiBaseUrl: getManagedConnectorApiBaseUrl(connector),
  oauthConfigured: isManagedConnectorOAuthConfigured(connector),
  encryptedOAuthClient: undefined,
});

export const managedConnectorToBuiltInOption = (
  connector: ManagedConnectorRecord,
): BuiltInConnectorOption => ({
  slug: connector.slug,
  name: connector.name,
  description: connector.description,
  logoUrl: connector.logoUrl,
  appUrl: connector.appUrl,
  toolCount:
    getManagedConnectorProvider(connector) === "mcp" ? 0 : connector.functions.length,
  categories: connector.categories,
  authModes: connector.authModes,
  authStrategy: connector.authStrategy,
  oauthConfigured: isManagedConnectorOAuthConfigured(connector),
  credentialLabel: connector.credentialLabel,
  credentialPlaceholder: connector.credentialPlaceholder,
  credentialHelp: connector.credentialHelp,
});

export const buildManagedConnectorFunctions = (
  connector: ManagedConnectorRecord,
): Record<string, FunctionSpec> =>
  Object.fromEntries(
    connector.functions.map((tool) => [
      tool.name,
      {
        name: tool.name,
        description: tool.description,
        enabled: true,
        accessMode: "enabled",
        fineGrainedPermissions: true,
        defaultScopes: tool.defaultScopes,
        executionMode: "provider",
        config: {
          request: tool.request,
        },
      } satisfies FunctionSpec,
    ]),
  );

export const resolveManagedConnectorCredentials = (
  connector: ManagedConnectorRecord,
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

export const listAvailableBuiltInConnectors = async (
  repository: ContextRepository,
): Promise<BuiltInConnectorOption[]> =>
  (await repository.listManagedConnectors())
    .filter((candidate) => candidate.enabled)
    .map(managedConnectorToBuiltInOption)
    .sort((a, b) => a.name.localeCompare(b.name));

export const getManagedConnectorRecord = async (
  repository: ContextRepository,
  slug: string,
) => {
  const connector = await repository.getManagedConnector(slug);
  if (!connector || !connector.enabled) {
    return null;
  }

  return connector;
};
