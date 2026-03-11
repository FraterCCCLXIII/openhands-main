import { Composio } from "@composio/core";
import { decryptCredentials } from "@/src/lib/credential-crypto";
import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextRepository } from "@/src/lib/core/repository";
import { buildMcpHeaders, runMcpClientOperation } from "@/src/lib/mcp-client";
import {
  buildManagedConnectorFunctions,
  getManagedConnectorApiBaseUrl,
  getManagedConnectorProvider,
  getManagedConnectorRecord,
  getManagedConnectorServerUrl,
  listAvailableBuiltInConnectors,
  resolveManagedConnectorCredentials,
} from "@/src/lib/integrations/managed-connectors";
import type {
  AuthStrategy,
  BuiltInConnectorOption,
  FunctionSpec,
  IntegrationKind,
  IntegrationProvider,
} from "@/src/types/context-layer";

const slugToFunctionName = (slug: string, prefix?: string) => {
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

const buildFunctionSpec = (
  name: string,
  description: string,
  defaultScopes: string[],
  config: Record<string, unknown>,
): FunctionSpec => ({
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
  functions: Record<string, FunctionSpec>;
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
      `Sign in before discovering functions for ${connectorName}.`,
      401,
    );
  }

  const connection = await repository.getIntegrationConnection(ownerId, integrationKey);
  if (!connection) {
    throw new ContextLayerError(
      `Connect ${connectorName} for this user before discovering functions.`,
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

  const managedConnector = await getManagedConnectorRecord(options.repository, slug);
  if (!managedConnector) {
    return null;
  }

  if (getManagedConnectorProvider(managedConnector) === "mcp") {
    const serverUrl = getManagedConnectorServerUrl(managedConnector);
    if (!serverUrl) {
      throw new ContextLayerError(
        `Managed MCP connector '${managedConnector.slug}' is missing a serverUrl.`,
        500,
      );
    }

    const credentials =
      managedConnector.authStrategy === "oauth2"
        ? await resolveManagedOAuthDiscoveryCredentials(
            options.repository,
            options.ownerId,
            input.key.trim(),
            managedConnector.name,
          )
        : resolveManagedConnectorCredentials(managedConnector, input);

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
      authStrategy: managedConnector.authStrategy,
      config: compactRecord({
        builtInSlug: managedConnector.slug,
        managedConnectorSlug: managedConnector.slug,
        serverUrl,
      }),
      credentials: managedConnector.authStrategy === "oauth2" ? {} : result.credentials,
    };
  }

  const apiBaseUrl = getManagedConnectorApiBaseUrl(managedConnector);
  if (!apiBaseUrl) {
    throw new ContextLayerError(
      `Managed HTTP connector '${managedConnector.slug}' is missing an apiBaseUrl.`,
      500,
    );
  }

  return {
    provider: "http",
    authStrategy: managedConnector.authStrategy,
    config: {
      builtInSlug: managedConnector.slug,
      apiBaseUrl,
      managedConnectorSlug: managedConnector.slug,
    },
    credentials: resolveManagedConnectorCredentials(managedConnector, input),
    functions: buildManagedConnectorFunctions(managedConnector),
  };
};


const discoverBuiltInConnectorIntegration = async (
  input: IntegrationDiscoveryInput,
  options: IntegrationDiscoveryOptions,
): Promise<IntegrationDiscoveryResult> => {
  const slug =
    (input.config.builtInSlug as string | undefined)?.trim() || input.key.trim();

  const managedConnectorResult = await discoverManagedConnectorIntegration(
    input,
    options,
    slug,
  );
  if (managedConnectorResult) {
    return managedConnectorResult;
  }

  throw new ContextLayerError(`Unknown built-in connector '${slug}'.`, 404);
};

const discoverComposioIntegration = async (
  input: IntegrationDiscoveryInput,
): Promise<IntegrationDiscoveryResult> => {
  const toolkitSlug =
    (input.config.toolkitSlug as string | undefined)?.trim() || input.key;
  const composio = getComposioClient();
  const [toolkit, tools] = await Promise.all([
    composio.toolkits.get(toolkitSlug),
    composio.tools.getRawComposioTools({ toolkits: [toolkitSlug], limit: 200 }),
  ]);

  const functions = Object.fromEntries(
    tools.map((tool) => {
      const functionName =
        slugToFunctionName(tool.slug, toolkitSlug) || tool.slug.toLowerCase();
      return [
        functionName,
        buildFunctionSpec(
          functionName,
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
    functions,
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
  const functions = Object.fromEntries(
    result.tools.map((tool) => [
      tool.name,
      buildFunctionSpec(tool.name, tool.description ?? tool.title ?? "", [], {
        toolName: tool.name,
      }),
    ]),
  );

  return {
    provider: "mcp",
    authStrategy,
    config: compactRecord({ serverUrl }),
    credentials,
    functions,
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
