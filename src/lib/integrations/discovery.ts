import { Composio } from "@composio/core";
import { decryptCredentials } from "@/src/lib/credential-crypto";
import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextRepository } from "@/src/lib/core/repository";
import { buildMcpHeaders, runMcpClientOperation } from "@/src/lib/mcp-client";
import {
  buildManagedConnectorToolSpecs,
  buildManagedConnectorTools,
  getDefaultBuiltInConnector,
  getManagedConnectorApiBaseUrl,
  getManagedConnectorProvider,
  getManagedConnectorServerUrl,
  listAvailableBuiltInConnectors,
  resolveManagedConnectorCredentials,
} from "@/src/lib/integrations/managed-connectors";
import { generateManagedConnectorToolsFromOpenApi } from "@/src/lib/managed-connectors/openapi";
import type {
  AuthStrategy,
  BuiltInConnectorOption,
  ToolSpec,
  IntegrationKind,
  IntegrationProvider,
} from "@/src/types/context-layer";

const slugToToolName = (slug: string, prefix?: string) => {
  const normalizedPrefix = prefix?.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  const normalized = slug
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  if (normalizedPrefix && normalized.startsWith(`${normalizedPrefix}_`)) {
    return normalized.slice(normalizedPrefix.length + 1);
  }

  return normalized;
};

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

const normalizeComposioAuthStrategy = (modes: string[] = []): AuthStrategy =>
  normalizeComposioAuthModes(modes)[0] ?? "oauth2";

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

export function normalizeComposioAuthModes(
  modes: string[] = [],
  includesNoAuth = false,
): AuthStrategy[] {
  const normalized = uniqueValues(modes.map((mode) => mode.toLowerCase()));
  const authModes: AuthStrategy[] = [];

  if (normalized.some((mode) => mode.includes("oauth"))) {
    authModes.push("oauth2");
  }

  if (normalized.includes("api_key")) {
    authModes.push("api_key");
  }

  if (normalized.includes("bearer_token")) {
    authModes.push("bearer");
  }

  if (normalized.some((mode) => mode.startsWith("basic"))) {
    authModes.push("basic");
  }

  if (includesNoAuth || normalized.includes("no_auth")) {
    authModes.push("none");
  }

  return authModes.length > 0 ? authModes : ["oauth2"];
}

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

export type IntegrationDiscoveryKind = IntegrationKind | "built_in";

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

const getComposioClient = () => {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new ContextLayerError(
      "COMPOSIO_API_KEY is required to use Composio-backed integrations.",
      500,
    );
  }

  return new Composio({ apiKey });
};

export const listBuiltInConnectors = async (
  repository?: ContextRepository,
): Promise<BuiltInConnectorOption[]> =>
  repository ? listAvailableBuiltInConnectors(repository) : [];

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

const discoverManagedConnectorIntegration = async (
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
        builtInSlug: storedConnector.slug,
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
      builtInSlug: storedConnector.slug,
      apiBaseUrl,
      managedConnectorSlug: storedConnector.slug,
    },
    credentials: resolveManagedConnectorCredentials(storedConnector, input),
    tools: buildManagedConnectorTools(storedConnector),
  };
};

const discoverDefaultBuiltInConnectorIntegration = async (
  input: IntegrationDiscoveryInput,
  slug: string,
): Promise<IntegrationDiscoveryResult | null> => {
  const connector = getDefaultBuiltInConnector(slug);
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
        builtInSlug: connector.slug,
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
      builtInSlug: connector.slug,
      apiBaseUrl: connector.apiBaseUrl,
    },
    credentials: resolveManagedConnectorCredentials(connector, input),
    tools: buildManagedConnectorToolSpecs(tools),
  };
};

const discoverBuiltInConnectorIntegration = async (
  input: IntegrationDiscoveryInput,
  options: IntegrationDiscoveryOptions,
): Promise<IntegrationDiscoveryResult> => {
  const slug =
    (input.config.builtInSlug as string | undefined)?.trim() || input.key.trim();

  if (options.repository) {
    const storedConnector = await options.repository.getManagedConnector(slug);
    if (storedConnector && !storedConnector.enabled) {
      throw new ContextLayerError(`Unknown built-in connector '${slug}'.`, 404);
    }
  }

  const managedConnectorResult = await discoverManagedConnectorIntegration(
    input,
    options,
    slug,
  );
  if (managedConnectorResult) {
    return managedConnectorResult;
  }

  const defaultConnectorResult = await discoverDefaultBuiltInConnectorIntegration(
    input,
    slug,
  );
  if (defaultConnectorResult) {
    return defaultConnectorResult;
  }

  throw new ContextLayerError(`Unknown built-in connector '${slug}'.`, 404);
};

const discoverComposioIntegration = async (
  input: IntegrationDiscoveryInput,
): Promise<IntegrationDiscoveryResult> => {
  const toolkitSlug =
    (input.config.toolkitSlug as string | undefined)?.trim() || input.key;
  const composio = getComposioClient();
  const [toolkit, rawTools] = await Promise.all([
    composio.toolkits.get(toolkitSlug),
    composio.tools.getRawComposioTools({ toolkits: [toolkitSlug], limit: 200 }),
  ]);

  const tools = Object.fromEntries(
    rawTools.map((tool) => {
      const toolName =
        slugToToolName(tool.slug, toolkitSlug) || tool.slug.toLowerCase();
      return [
        toolName,
        buildToolSpec(
          toolName,
          tool.description ?? tool.name,
          tool.scopes ?? [],
          { composioToolSlug: tool.slug },
        ),
      ];
    }),
  );

  return {
    provider: "composio",
    authStrategy: normalizeComposioAuthStrategy(
      (toolkit.authConfigDetails ?? []).map((detail) => detail.mode),
    ),
    config: compactRecord({ toolkitSlug }),
    credentials: compactRecord({
      connectedAccountId: input.credentials.connectedAccountId,
    }),
    tools,
  };
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
  if (input.kind === "built_in") {
    return discoverBuiltInConnectorIntegration(input, options);
  }

  if (input.kind === "api") {
    return discoverComposioIntegration(input);
  }

  return discoverMcpIntegration(input);
};
