import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextRepository } from "@/src/lib/core/repository";
import { listBuiltInConnectors as listStaticBuiltInConnectors } from "@/src/lib/integrations/built-in-connectors";
import type {
  BuiltInConnectorOption,
  FunctionSpec,
  ManagedConnectorRecord,
} from "@/src/types/context-layer";
import type {
  IntegrationDiscoveryInput,
  IntegrationDiscoveryResult,
} from "@/src/lib/integrations/discovery";

const isManagedConnectorOAuthConfigured = (connector: ManagedConnectorRecord) =>
  connector.authStrategy !== "oauth2" ||
  (!!connector.oauthConfig && !!connector.encryptedOAuthClient);

export const sanitizeManagedConnector = (
  connector: ManagedConnectorRecord,
): ManagedConnectorRecord => ({
  ...connector,
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
  toolCount: connector.functions.length,
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

const resolveManagedConnectorCredentials = (
  connector: ManagedConnectorRecord,
  input: IntegrationDiscoveryInput,
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

export const discoverManagedBuiltInConnector = (
  connector: ManagedConnectorRecord,
  input: IntegrationDiscoveryInput,
): IntegrationDiscoveryResult => ({
  provider: "http",
  authStrategy: connector.authStrategy,
  config: {
    builtInSlug: connector.slug,
    apiBaseUrl: connector.apiBaseUrl,
    managedConnectorSlug: connector.slug,
  },
  credentials: resolveManagedConnectorCredentials(connector, input),
  functions: buildManagedConnectorFunctions(connector),
});

export const listAvailableBuiltInConnectors = async (
  repository: ContextRepository,
): Promise<BuiltInConnectorOption[]> => {
  const managedConnectors = (await repository.listManagedConnectors())
    .filter((connector) => connector.enabled)
    .map(managedConnectorToBuiltInOption);

  return [...listStaticBuiltInConnectors(), ...managedConnectors].sort((a, b) =>
    a.name.localeCompare(b.name),
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

  return connector;
};
