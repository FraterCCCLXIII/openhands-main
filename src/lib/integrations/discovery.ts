import { decryptCredentials } from "@/src/lib/credential-crypto";
import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextRepository } from "@/src/lib/core/repository";
import { buildMcpHeaders, runMcpClientOperation } from "@/src/lib/mcp-client";
import {
  buildManagedConnectorToolSpecs,
  buildManagedConnectorTools,
  getDefaultManagedConnector,
  getManagedConnectorApiBaseUrl,
  getManagedConnectorProvider,
  getManagedConnectorServerUrl,
  listAvailableManagedConnectors,
  resolveManagedConnectorCredentials,
} from "@/src/lib/integrations/managed-connectors";
import { generateManagedConnectorToolsFromOpenApi } from "@/src/lib/managed-connectors/openapi";
import type {
  AuthStrategy,
  ManagedConnectorOption,
  ToolSpec,
  IntegrationProvider,
} from "@/src/types/context-layer";

const compactRecord = (record: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value == null) {
        return false;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      return true;
    }),
  );

export const inferMcpAuthStrategy = (
  credentials: Record<string, unknown>,
): AuthStrategy => {
  const secret = credentials.secret as string | undefined;
  const accessToken = credentials.accessToken as string | undefined;
  const username = credentials.username as string | undefined;
  const password = credentials.password as string | undefined;

  if (accessToken) {
    return "oauth2";
  }

  if (secret) {
    return "api_key";
  }

  if (username && password) {
    return "basic";
  }

  return "none";
};

const buildToolSpec = (
  name: string,
  description: string,
  defaultScopes: string[],
  config: Record<string, unknown>,
): ToolSpec => ({
  name,
  description,
  enabled: true,
  accessMode: "enabled",
  fineGrainedPermissions: true,
  defaultScopes,
  executionMode: "provider",
  config,
});

export type IntegrationDiscoveryKind = "mcp" | "managed";

export interface IntegrationDiscoveryInput {
  key: string;
  kind: IntegrationDiscoveryKind;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
}

export interface IntegrationDiscoveryOptions {
  baseUrl?: string;
  repository?: ContextRepository;
  ownerId?: string;
}

export interface IntegrationDiscoveryResult {
  provider: IntegrationProvider;
  authStrategy: AuthStrategy;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  tools: Record<string, ToolSpec>;
}

export const listManagedConnectors = async (
  repository?: ContextRepository,
): Promise<ManagedConnectorOption[]> =>
  repository ? listAvailableManagedConnectors(repository) : [];

const resolveManagedOAuthDiscoveryCredentials = async (
  repository: ContextRepository,
  ownerId: string | undefined,
  integrationKey: string,
  connectorName: string,
) => {
  if (!ownerId) {
    throw new ContextLayerError(
      `Sign in before discovering tools for ${connectorName}.`,
      401,
    );
  }

  const connection = await repository.getIntegrationConnection(ownerId, integrationKey);
  if (!connection) {
    throw new ContextLayerError(
      `Connect ${connectorName} for this user before discovering tools.`,
      403,
    );
  }

  return compactRecord(
    decryptCredentials<Record<string, unknown>>(connection.encryptedCredentials),
  );
};

const discoverStoredManagedConnectorIntegration = async (
  input: IntegrationDiscoveryInput,
  options: IntegrationDiscoveryOptions,
  slug: string,
): Promise<IntegrationDiscoveryResult | null> => {
  if (!options.repository) {
    return null;
  }

  const storedConnector = await options.repository.getManagedConnector(slug);
  if (!storedConnector) {
    return null;
  }

  if (!storedConnector.enabled) {
    return null;
  }

  if (getManagedConnectorProvider(storedConnector) === "mcp") {
    const serverUrl = getManagedConnectorServerUrl(storedConnector);
    if (!serverUrl) {
      throw new ContextLayerError(
        `Managed MCP connector '${storedConnector.slug}' is missing a serverUrl.`,
        500,
      );
    }

    if (storedConnector.tools.length > 0) {
      return {
        provider: "mcp",
        authStrategy: storedConnector.authStrategy,
        config: compactRecord({
          managedConnectorSlug: storedConnector.slug,
          serverUrl,
        }),
        credentials:
          storedConnector.authStrategy === "oauth2"
            ? {}
            : resolveManagedConnectorCredentials(storedConnector, input),
        tools: buildManagedConnectorTools(storedConnector),
      };
    }

    const credentials =
      storedConnector.authStrategy === "oauth2"
        ? await resolveManagedOAuthDiscoveryCredentials(
            options.repository,
            options.ownerId,
            input.key.trim(),
            storedConnector.name,
          )
        : resolveManagedConnectorCredentials(storedConnector, input);

    const result = await discoverMcpIntegration({
      ...input,
      kind: "mcp",
      config: {
        serverUrl,
      },
      credentials,
    });

    return {
      ...result,
      authStrategy: storedConnector.authStrategy,
      config: compactRecord({
        managedConnectorSlug: storedConnector.slug,
        serverUrl,
      }),
      credentials: storedConnector.authStrategy === "oauth2" ? {} : result.credentials,
    };
  }

  const apiBaseUrl = getManagedConnectorApiBaseUrl(storedConnector);
  if (!apiBaseUrl) {
    throw new ContextLayerError(
      `Managed HTTP connector '${storedConnector.slug}' is missing an apiBaseUrl.`,
      500,
    );
  }

  return {
    provider: "http",
    authStrategy: storedConnector.authStrategy,
    config: {
      managedConnectorSlug: storedConnector.slug,
      apiBaseUrl,
    },
    credentials: resolveManagedConnectorCredentials(storedConnector, input),
    tools: buildManagedConnectorTools(storedConnector),
  };
};

const discoverDefaultManagedConnectorIntegration = async (
  input: IntegrationDiscoveryInput,
  slug: string,
): Promise<IntegrationDiscoveryResult | null> => {
  const connector = getDefaultManagedConnector(slug);
  if (!connector) {
    return null;
  }

  if (connector.provider === "mcp" && connector.serverUrl) {
    const credentials = resolveManagedConnectorCredentials(connector, input);
    const result = await discoverMcpIntegration({
      ...input,
      kind: "mcp",
      config: { serverUrl: connector.serverUrl },
      credentials,
    });

    return {
      ...result,
      authStrategy: connector.authStrategy,
      config: compactRecord({
        managedConnectorSlug: connector.slug,
        serverUrl: connector.serverUrl,
      }),
      credentials: result.credentials,
    };
  }

  if (!connector.openApiUrl) {
    return null;
  }

  const tools = await generateManagedConnectorToolsFromOpenApi({
    openApiUrl: connector.openApiUrl,
    authStrategy: connector.authStrategy,
  });

  return {
    provider: "http",
    authStrategy: connector.authStrategy,
    config: {
      managedConnectorSlug: connector.slug,
      apiBaseUrl: connector.apiBaseUrl,
    },
    credentials: resolveManagedConnectorCredentials(connector, input),
    tools: buildManagedConnectorToolSpecs(tools),
  };
};

const discoverManagedConnectorIntegration = async (
  input: IntegrationDiscoveryInput,
  options: IntegrationDiscoveryOptions,
): Promise<IntegrationDiscoveryResult> => {
  const slug =
    (input.config.managedConnectorSlug as string | undefined)?.trim() || input.key.trim();

  if (options.repository) {
    const storedConnector = await options.repository.getManagedConnector(slug);
    if (storedConnector && !storedConnector.enabled) {
      throw new ContextLayerError(`Unknown managed connector '${slug}'.`, 404);
    }
  }

  const managedConnectorResult = await discoverStoredManagedConnectorIntegration(
    input,
    options,
    slug,
  );
  if (managedConnectorResult) {
    return managedConnectorResult;
  }

  const defaultConnectorResult = await discoverDefaultManagedConnectorIntegration(
    input,
    slug,
  );
  if (defaultConnectorResult) {
    return defaultConnectorResult;
  }

  throw new ContextLayerError(`Unknown managed connector '${slug}'.`, 404);
};

const discoverMcpIntegration = async (
  input: IntegrationDiscoveryInput,
): Promise<IntegrationDiscoveryResult> => {
  const serverUrl = (input.config.serverUrl as string | undefined)?.trim();
  if (!serverUrl) {
    throw new ContextLayerError(
      "A serverUrl is required to discover MCP integrations.",
      400,
    );
  }

  const credentials = compactRecord({
    headerName: input.credentials.headerName,
    secret: input.credentials.secret,
    accessToken: input.credentials.accessToken,
    username: input.credentials.username,
    password: input.credentials.password,
  });
  const authStrategy = inferMcpAuthStrategy(credentials);

  const result = await runMcpClientOperation(
    serverUrl,
    buildMcpHeaders(authStrategy, credentials),
    "listTools",
    (client) => client.listTools(),
    {
      authStrategy,
      credentials,
      integrationKey: input.key,
      managedConnectorSlug:
        (input.config.managedConnectorSlug as string | undefined) ??
        (input.config.builtInSlug as string | undefined),
    },
  );
  const tools = Object.fromEntries(
    result.tools.map((tool) => [
      tool.name,
      buildToolSpec(tool.name, tool.description ?? tool.title ?? "", [], {
        toolName: tool.name,
        inputSchema: tool.inputSchema,
      }),
    ]),
  );

  return {
    provider: "mcp",
    authStrategy,
    config: compactRecord({ serverUrl }),
    credentials,
    tools,
  };
};

export const discoverIntegration = async (
  input: IntegrationDiscoveryInput,
  options: IntegrationDiscoveryOptions = {},
): Promise<IntegrationDiscoveryResult> => {
  if (input.kind === "managed") {
    return discoverManagedConnectorIntegration(input, options);
  }

  return discoverMcpIntegration(input);
};
