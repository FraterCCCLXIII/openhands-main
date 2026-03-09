import { Composio } from "@composio/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { ContextLayerError } from "@/src/lib/core/errors";
import type {
  AuthStrategy,
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

const normalizeComposioAuthStrategy = (modes: string[] = []): AuthStrategy => {
  const normalized = modes.map((mode) => mode.toLowerCase());

  if (normalized.some((mode) => mode.includes("oauth"))) {
    return "oauth2";
  }

  if (normalized.includes("api_key")) {
    return "api_key";
  }

  if (normalized.includes("bearer_token")) {
    return "bearer";
  }

  if (normalized.some((mode) => mode.startsWith("basic"))) {
    return "basic";
  }

  if (normalized.includes("no_auth")) {
    return "none";
  }

  return "oauth2";
};

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

const buildMcpHeaders = (
  authStrategy: AuthStrategy,
  credentials: Record<string, unknown>,
): Record<string, string> => {
  if (authStrategy === "api_key") {
    const headerName =
      (credentials.headerName as string | undefined) ?? "X-API-Key";
    const secret = credentials.secret as string | undefined;
    return secret ? { [headerName]: secret } : {};
  }

  if (authStrategy === "bearer" || authStrategy === "oauth2") {
    const token = credentials.accessToken as string | undefined;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  if (authStrategy === "basic") {
    const username = credentials.username as string | undefined;
    const password = credentials.password as string | undefined;

    if (username && password) {
      return {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      };
    }
  }

  return {};
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

export interface IntegrationDiscoveryInput {
  key: string;
  kind: IntegrationKind;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
}

export interface IntegrationDiscoveryResult {
  provider: IntegrationProvider;
  authStrategy: AuthStrategy;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  functions: Record<string, FunctionSpec>;
}

const discoverComposioIntegration = async (
  input: IntegrationDiscoveryInput,
): Promise<IntegrationDiscoveryResult> => {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new ContextLayerError(
      "COMPOSIO_API_KEY is required to discover API integrations.",
      500,
    );
  }

  const toolkitSlug =
    (input.config.toolkitSlug as string | undefined)?.trim() || input.key;
  const composio = new Composio({ apiKey });
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

  const client = new Client({
    name: "agent-context-layer",
    version: "0.2.0",
  });
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: {
      headers: buildMcpHeaders(authStrategy, credentials),
    },
  });

  await client.connect(transport);

  try {
    const result = await client.listTools();
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
  } finally {
    await transport.close();
  }
};

export const discoverIntegration = async (
  input: IntegrationDiscoveryInput,
): Promise<IntegrationDiscoveryResult> => {
  if (input.kind === "api") {
    return discoverComposioIntegration(input);
  }

  return discoverMcpIntegration(input);
};
