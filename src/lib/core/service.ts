import { randomUUID } from "node:crypto";

import { DEFAULT_CASE_BY_CASE_APPROVAL_MINUTES } from "@/src/lib/access-requests";
import { isAppAdminEmail } from "@/src/lib/app-admins";

import type { AdapterRegistry } from "@/src/lib/core/adapter-registry";
import {
  evaluateIntegrationAccess,
  getToolAccessMode,
  normalizeTools,
  normalizeToolSpec,
  normalizeScopes,
  sameScopes,
  subtractUnusedWindow,
} from "@/src/lib/core/access-policy";
import { addMinutes, nowIso } from "@/src/lib/core/date";
import { ContextLayerError } from "@/src/lib/core/errors";
import {
  createToolInvocationRecord,
  normalizePayloadKeys,
  runOptionalSideEffect,
  summarizeErrorMessage,
} from "@/src/lib/core/invocation-side-effects";
import type { ContextRepository } from "@/src/lib/core/repository";
import {
  createAdminApiKeyValue,
  createAgentApiKeyValue,
  createUserApiKeyValue,
  decryptScopedApiKey,
  encryptScopedApiKey,
  getScopedApiKeyPrefix,
  getScopedApiKeySuffix,
  hashScopedApiKey,
  normalizeOwnerId,
  requireAdminApiKeyOwner,
  toAdminApiKeyStatus,
  toUserApiKeyStatus,
} from "@/src/lib/core/scoped-api-keys";
import { decryptCredentials, encryptCredentials } from "@/src/lib/credential-crypto";
import { discoverIntegration } from "@/src/lib/integrations/discovery";
import {
  buildManagedConnectorTools,
  listAllManagedConnectorDefinitions,
  sanitizeManagedConnector,
} from "@/src/lib/integrations/managed-connectors";
import { generateManagedConnectorToolsFromOpenApi } from "@/src/lib/managed-connectors/openapi";
import type { NotificationPublisher } from "@/src/lib/notifications/publisher";
import {
  encryptManagedOAuthClient,
  registerManagedOAuthClient,
  usesDynamicOAuthClientRegistration,
} from "@/src/lib/oauth/managed-oauth-client";
import { resolveOAuthProvider } from "@/src/lib/oauth/provider-resolver";
import {
  clampFunctionAccessMode,
  isFunctionAccessModeAllowed,
} from "@/src/lib/function-access-mode";
import type {
  AccessDecision,
  AccessRequest,
  AccessRequestAgentData,
  AdminApiKeyRecord,
  AgentApiKeyRecord,
  AgentClassPolicy,
  ContextInvocationResult,
  DisableUnusedToolsResult,
  ToolAccessMode,
  ToolSpec,
  GenericHttpRequestTemplate,
  GenericOAuthConfig,
  IntegrationConnectionRecord,
  IntegrationConnectionStatus,
  IntegrationSpec,
  ManagedConnectorDefinition,
  ManagedConnectorToolDefinition,
  ManagedConnectorRecord,
  NotificationRecord,
  PolicyRule,
  TemporaryGrant,
  ToolInvocationOutcome,
  UnusedToolWindowUnit,
  UserApiKeyRecord,
} from "@/src/types/context-layer";

const getManagedConnectorSlug = (integration: IntegrationSpec) => {
  const value = integration.config.managedConnectorSlug;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

const getManagedConnectorToolAccessMode = (
  toolSpec: ManagedConnectorToolDefinition,
): ToolAccessMode => toolSpec.accessMode ?? "enabled";

const toManagedConnectorToolDefinition = (
  toolSpec: ToolSpec,
  accessMode: ToolAccessMode,
): ManagedConnectorToolDefinition => {
  const config = { ...toolSpec.config };
  const request = config.request as GenericHttpRequestTemplate | undefined;

  delete config.request;

  return {
    name: toolSpec.name,
    description: toolSpec.description ?? "",
    defaultScopes: toolSpec.defaultScopes,
    accessMode,
    ...(request ? { request } : {}),
    ...(Object.keys(config).length > 0 ? { config } : {}),
  };
};

const sanitizeIndexedToolDefinitions = (
  tools: ManagedConnectorToolDefinition[],
) =>
  tools.map((toolSpec) => ({
    ...toolSpec,
    accessMode: getManagedConnectorToolAccessMode(toolSpec),
  }));

const sanitizeManagedConnectorToolSource = (
  connector: ManagedConnectorRecord,
): ManagedConnectorRecord => ({
  ...connector,
  tools: sanitizeIndexedToolDefinitions(connector.tools),
});

const sanitizeManagedConnectorToolResponse = (
  connector: ManagedConnectorRecord,
): ManagedConnectorRecord => sanitizeManagedConnector(sanitizeManagedConnectorToolSource(connector));

const getManagedConnectorToolAccessModes = (
  tools: ManagedConnectorToolDefinition[],
) =>
  new Map(
    tools.map((toolSpec) => [
      toolSpec.name,
      getManagedConnectorToolAccessMode(toolSpec),
    ]),
  );

const applyManagedConnectorToolAccessModes = (
  tools: ManagedConnectorToolDefinition[],
  preferredAccessModes: Map<string, ToolAccessMode>,
  fallbackAccessModes?: Map<string, ToolAccessMode>,
) =>
  tools.map((toolSpec) => ({
    ...toolSpec,
    accessMode:
      preferredAccessModes.get(toolSpec.name) ??
      fallbackAccessModes?.get(toolSpec.name) ??
      getManagedConnectorToolAccessMode(toolSpec),
  }));

const mergeToolConfigs = (
  indexedConfig: Record<string, unknown>,
  installedConfig: Record<string, unknown>,
) => ({
  ...indexedConfig,
  ...installedConfig,
});

const sanitizeManagedConnectorToolDefinitions = (
  connector: ManagedConnectorRecord,
  integration: IntegrationSpec,
) => {
  const indexedFunctions = buildManagedConnectorTools(
    sanitizeManagedConnectorToolSource(connector),
  );
  const hasIndexedFunctions = connector.tools.length > 0;
  const nextFunctions: Record<string, ToolSpec> = {};
  const toolNames = hasIndexedFunctions
    ? [...new Set([...Object.keys(indexedFunctions), ...Object.keys(integration.tools)])]
    : Object.keys(integration.tools);

  for (const toolName of toolNames) {
    const indexedFunction = indexedFunctions[toolName];
    const installedFunction = integration.tools[toolName];
    const baseFunction = installedFunction ?? indexedFunction;

    if (!baseFunction) {
      continue;
    }

    const mergedFunction = normalizeToolSpec(
      indexedFunction && installedFunction
        ? {
            ...indexedFunction,
            ...installedFunction,
            config: mergeToolConfigs(indexedFunction.config, installedFunction.config),
          }
        : baseFunction,
    );

    const maxAccessMode = hasIndexedFunctions
      ? indexedFunction?.maxAccessMode ?? "disabled"
      : undefined;
    const effectiveAccessMode = maxAccessMode
      ? clampFunctionAccessMode(getToolAccessMode(mergedFunction), maxAccessMode)
      : getToolAccessMode(mergedFunction);

    nextFunctions[toolName] = {
      ...mergedFunction,
      maxAccessMode,
      accessMode: effectiveAccessMode,
      enabled: effectiveAccessMode !== "disabled",
    };
  }

  return nextFunctions;
};

const sanitizeIntegrationTools = (
  integration: IntegrationSpec,
  connector: ManagedConnectorRecord | null,
): IntegrationSpec => ({
  ...integration,
  tools: connector
    ? sanitizeManagedConnectorToolDefinitions(connector, integration)
    : normalizeTools(integration.tools),
});

const redactIntegrationCredentials = (
  integration: IntegrationSpec,
): IntegrationSpec => ({
  ...integration,
  credentials: {},
});

const sanitizeConnectionStatus = (
  record: IntegrationConnectionRecord,
): IntegrationConnectionStatus => ({
  integrationKey: record.integrationKey,
  provider: record.provider,
  authStrategy: record.authStrategy,
  tokenType: record.tokenType,
  scopes: record.scopes,
  expiresAt: record.expiresAt,
  externalAccountId: record.externalAccountId,
  externalWorkspaceId: record.externalWorkspaceId,
  displayName: record.displayName,
  metadata: record.metadata,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const normalizeAccessRequestAgentData = (
  agentData?: AccessRequestAgentData,
): AccessRequestAgentData => {
  const conversationLink = agentData?.conversationLink?.trim();

  return conversationLink ? { conversationLink } : {};
};

const sameAccessRequestAgentData = (
  left?: AccessRequestAgentData,
  right?: AccessRequestAgentData,
) =>
  normalizeAccessRequestAgentData(left).conversationLink ===
  normalizeAccessRequestAgentData(right).conversationLink;

const isConnectionExpired = (expiresAt?: string, bufferMs = 60_000) => {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now() + bufferMs;
};

const normalizeAgentApiKeyOwner = normalizeOwnerId;

const getAccessRequestOwnerId = (request: AccessRequest) => {
  const recipient = request.notificationTargets.in_app?.trim();
  return recipient ? normalizeAgentApiKeyOwner(recipient) : null;
};

export interface AccessEvaluationRequest {
  agentId: string | null;
  agentClass: string | null;
  integrationKey: string;
  toolName: string;
  requestedScopes?: string[];
  ownerId?: string;
  agentData?: AccessRequestAgentData;
}

export interface ContextInvocationRequest extends AccessEvaluationRequest {
  payload?: Record<string, unknown>;
}

const toAccessEvaluationRequest = (
  agentIdOrRequest: string | null | AccessEvaluationRequest,
  agentClass?: string | null,
  integrationKey?: string,
  toolName?: string,
  requestedScopes: string[] = [],
  options: {
    ownerId?: string;
    agentData?: AccessRequestAgentData;
  } = {},
): AccessEvaluationRequest => {
  if (typeof agentIdOrRequest !== "string" && agentIdOrRequest !== null) {
    return {
      ...agentIdOrRequest,
      requestedScopes: agentIdOrRequest.requestedScopes ?? [],
      agentData: agentIdOrRequest.agentData,
    };
  }

  if (!integrationKey || !toolName) {
    throw new ContextLayerError("Incomplete access evaluation request.", 400);
  }

  return {
    agentId: agentIdOrRequest,
    agentClass: agentClass ?? null,
    integrationKey,
    toolName,
    requestedScopes,
    ownerId: options.ownerId,
    agentData: options.agentData,
  };
};

const toContextInvocationRequest = (
  agentId: string | null,
  agentClass?: string | null,
  integrationKey?: string,
  toolName?: string,
  payload: Record<string, unknown> = {},
  requestedScopes: string[] = [],
  options: {
    ownerId?: string;
    agentData?: AccessRequestAgentData;
  } = {},
): ContextInvocationRequest => {
  const accessRequest = toAccessEvaluationRequest(
    agentId,
    agentClass,
    integrationKey,
    toolName,
    requestedScopes,
    options,
  );

  return {
    ...accessRequest,
    payload,
  };
};


/**
 * Main orchestration service for integration lifecycle, API-key management, approvals, and runtime tool invocation.
 */
export class ContextLayerService {
  constructor(
    private readonly repository: ContextRepository,
    private readonly adapters: AdapterRegistry,
    private readonly notifications: NotificationPublisher,
  ) {}

  async initialize() {
    await this.repository.ensureSchema();
  }

  async listOwnerIntegrations(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integrations = await this.repository.listOwnerIntegrations(normalizedOwnerId);

    return (await Promise.all(
      integrations.map((integration) => this.applyManagedConnectorConstraints(integration)),
    ))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(redactIntegrationCredentials);
  }

  async listOwnerIntegrationsWithUsage(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const [storedIntegrations, usageSummaries] = await Promise.all([
      this.repository.listOwnerIntegrations(normalizedOwnerId),
      this.repository.listOwnerToolUsageSummaries(normalizedOwnerId),
    ]);
    const integrations = await Promise.all(
      storedIntegrations.map((integration) => this.applyManagedConnectorConstraints(integration)),
    );
    const usageByFunction = new Map(
      usageSummaries.map((summary) => [
        `${summary.integrationKey}:${summary.toolName}`,
        summary,
      ]),
    );

    return integrations
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((integration) =>
        redactIntegrationCredentials({
          ...integration,
          tools: Object.fromEntries(
            Object.entries(integration.tools).map(([toolName, toolSpec]) => {
              const usage = usageByFunction.get(`${integration.key}:${toolName}`);
              return [
                toolName,
                usage
                  ? {
                      ...toolSpec,
                      lastInvokedAt: usage.lastInvokedAt,
                      lastInvocationOutcome: usage.lastInvocationOutcome,
                      invocationCount: usage.invocationCount,
                    }
                  : toolSpec,
              ];
            }),
          ),
        }),
      );
  }

  async disableUnusedOwnerTools(
    ownerId: string,
    thresholdValue: number,
    thresholdUnit: UnusedToolWindowUnit,
  ): Promise<DisableUnusedToolsResult> {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const [integrations, usageSummaries] = await Promise.all([
      this.repository.listOwnerIntegrations(normalizedOwnerId),
      this.repository.listOwnerToolUsageSummaries(normalizedOwnerId),
    ]);
    const cutoffIso = subtractUnusedWindow(nowIso(), thresholdValue, thresholdUnit);
    const staleUsageByTool = new Map(
      usageSummaries
        .filter((summary) => summary.lastInvokedAt < cutoffIso)
        .map((summary) => [`${summary.integrationKey}:${summary.toolName}`, summary]),
    );
    const disabledTools: DisableUnusedToolsResult["disabledTools"] = [];

    for (const integration of integrations) {
      let changed = false;

      for (const [toolName, toolSpec] of Object.entries(integration.tools)) {
        if (getToolAccessMode(toolSpec) === "disabled") {
          continue;
        }

        const usage = staleUsageByTool.get(`${integration.key}:${toolName}`);
        if (!usage) {
          continue;
        }

        integration.tools[toolName] = {
          ...toolSpec,
          accessMode: "disabled",
          enabled: false,
        };
        disabledTools.push({
          integrationKey: integration.key,
          toolName,
          lastInvokedAt: usage.lastInvokedAt,
        });
        changed = true;
      }

      if (changed) {
        await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
      }
    }

    disabledTools.sort(
      (left, right) =>
        left.integrationKey.localeCompare(right.integrationKey) ||
        left.toolName.localeCompare(right.toolName),
    );

    return {
      thresholdValue,
      thresholdUnit,
      cutoffIso,
      disabledCount: disabledTools.length,
      disabledTools,
    };
  }

  async deleteOwnerIntegration(ownerId: string, integrationKey: string) {
    await this.initialize();

    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const normalizedIntegrationKey = integrationKey.trim();
    if (!normalizedIntegrationKey) {
      throw new ContextLayerError("Integration key is required.", 400);
    }

    const existing = await this.repository.getOwnerIntegration(
      normalizedOwnerId,
      normalizedIntegrationKey,
    );
    if (!existing) {
      throw new ContextLayerError("Integration not found.", 404);
    }

    await this.repository.deleteOwnerIntegration(normalizedOwnerId, normalizedIntegrationKey);
    return { deleted: true as const, key: normalizedIntegrationKey };
  }

  async listManagedConnectors() {
    await this.initialize();
    return (await listAllManagedConnectorDefinitions(this.repository)).map((connector) => ({
      ...connector,
      tools: sanitizeIndexedToolDefinitions(connector.tools),
    }));
  }

  async upsertManagedConnector(
    input: Omit<
      ManagedConnectorDefinition,
      "authModes" | "createdAt" | "oauthConfigured" | "updatedAt" | "tools"
    > & {
      tools?: ManagedConnectorDefinition["tools"];
      functions?: ManagedConnectorDefinition["tools"];
      authModes?: ManagedConnectorDefinition["authModes"];
      oauthClientId?: string;
      oauthClientSecret?: string;
    },
  ) {
    await this.initialize();

    const slug = input.slug.trim();
    if (!slug) {
      throw new ContextLayerError("Managed connectors require a slug.", 400);
    }

    const timestamp = nowIso();
    const existing = await this.repository.getManagedConnector(slug);
    const authModes =
      input.authModes?.length && input.authModes.every(Boolean)
        ? [...new Set(input.authModes)]
        : [input.authStrategy];
    const provider = input.provider ?? (input.serverUrl ? "mcp" : "http");
    const normalizedServerUrl = input.serverUrl?.trim() || undefined;
    const normalizedApiBaseUrl = input.apiBaseUrl?.trim() || undefined;
    const normalizedOpenApiUrl = input.openApiUrl?.trim() || undefined;

    if (provider === "mcp" && !normalizedServerUrl && !normalizedApiBaseUrl) {
      throw new ContextLayerError("Managed MCP connectors require a serverUrl.", 400);
    }

    if (provider === "http" && !normalizedApiBaseUrl) {
      throw new ContextLayerError("Managed HTTP connectors require an apiBaseUrl.", 400);
    }

    const normalizedOAuthConfig: GenericOAuthConfig | undefined =
      input.authStrategy === "oauth2" && input.oauthConfig
        ? {
            ...input.oauthConfig,
            scopes: [...new Set(input.oauthConfig.scopes.map((scope) => scope.trim()).filter(Boolean))],
          }
        : undefined;
    const requestedTools = input.tools ?? input.functions ?? [];
    const requestedAccessModes = getManagedConnectorToolAccessModes(requestedTools);
    const existingAccessModes = getManagedConnectorToolAccessModes(existing?.tools ?? []);

    const generatedTools =
      provider === "http" && normalizedOpenApiUrl
        ? applyManagedConnectorToolAccessModes(
            await generateManagedConnectorToolsFromOpenApi({
              openApiUrl: normalizedOpenApiUrl,
              authStrategy: input.authStrategy,
            }),
            requestedAccessModes,
            existingAccessModes,
          )
        : undefined;

    let encryptedOAuthClient = existing?.encryptedOAuthClient;
    if (input.authStrategy === "oauth2") {
      if (!normalizedOAuthConfig) {
        throw new ContextLayerError(
          "OAuth-managed connectors require an oauthConfig.",
          400,
        );
      }

      const oauthClientId = input.oauthClientId?.trim() ?? "";
      const oauthClientSecret = input.oauthClientSecret?.trim() ?? "";
      const usesDynamicRegistration = usesDynamicOAuthClientRegistration(normalizedOAuthConfig);

      if (usesDynamicRegistration) {
        const registeredClient = await registerManagedOAuthClient({
          connectorName: input.name.trim(),
          slug,
          oauthConfig: normalizedOAuthConfig,
        });
        encryptedOAuthClient = encryptManagedOAuthClient(registeredClient);
      } else if (oauthClientId || oauthClientSecret) {
        if (
          !oauthClientId ||
          (!oauthClientSecret && normalizedOAuthConfig.clientAuthentication !== "none")
        ) {
          throw new ContextLayerError(
            normalizedOAuthConfig.clientAuthentication === "none"
              ? "Provide an oauthClientId when updating OAuth credentials."
              : "Provide both oauthClientId and oauthClientSecret when updating OAuth credentials.",
            400,
          );
        }

        encryptedOAuthClient = encryptManagedOAuthClient(
          oauthClientSecret
            ? { clientId: oauthClientId, clientSecret: oauthClientSecret }
            : { clientId: oauthClientId },
        );
      } else if (!encryptedOAuthClient) {
        throw new ContextLayerError(
          normalizedOAuthConfig.clientAuthentication === "none"
            ? "New OAuth-managed connectors require an oauthClientId or a registrationUrl."
            : "New OAuth-managed connectors require both oauthClientId and oauthClientSecret.",
          400,
        );
      }
    } else {
      encryptedOAuthClient = undefined;
    }

    const record: ManagedConnectorRecord = {
      slug,
      name: input.name.trim(),
      description: input.description.trim(),
      logoUrl: input.logoUrl?.trim() || undefined,
      appUrl: input.appUrl?.trim() || undefined,
      docsUrl: input.docsUrl?.trim() || undefined,
      categories: input.categories.map((category) => category.trim()).filter(Boolean),
      authModes,
      authStrategy: input.authStrategy,
      provider,
      oauthConfigured:
        input.authStrategy !== "oauth2" ||
        Boolean(normalizedOAuthConfig && encryptedOAuthClient),
      credentialLabel: input.credentialLabel.trim(),
      credentialPlaceholder: input.credentialPlaceholder.trim(),
      credentialHelp: input.credentialHelp.trim(),
      apiBaseUrl:
        provider === "mcp"
          ? normalizedApiBaseUrl ?? normalizedServerUrl
          : normalizedApiBaseUrl,
      serverUrl: normalizedServerUrl ?? (provider === "mcp" ? normalizedApiBaseUrl : undefined),
      openApiUrl: provider === "http" ? normalizedOpenApiUrl : undefined,
      oauthConfig: normalizedOAuthConfig,
      encryptedOAuthClient,
      tools: sanitizeIndexedToolDefinitions(generatedTools ?? requestedTools),
      enabled: input.enabled,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    return sanitizeManagedConnectorToolResponse(
      await this.repository.upsertManagedConnector(record),
    );
  }

  async indexManagedConnectorFunctions(slug: string, ownerId?: string) {
    await this.initialize();

    const normalizedSlug = slug.trim();
    if (!normalizedSlug) {
      throw new ContextLayerError("Managed connectors require a slug.", 400);
    }

    const existing = await this.repository.getManagedConnector(normalizedSlug);
    if (!existing) {
      throw new ContextLayerError("Managed connector not found.", 404);
    }

    const existingAccessModes = getManagedConnectorToolAccessModes(existing.tools);

    let tools: ManagedConnectorToolDefinition[];
    const provider = existing.provider ?? (existing.openApiUrl ? "http" : "mcp");

    if (provider === "http") {
      if (!existing.openApiUrl) {
        throw new ContextLayerError(
          "Managed HTTP connectors need an OpenAPI URL before their tools can be indexed.",
          400,
        );
      }

      const generatedTools = await generateManagedConnectorToolsFromOpenApi({
        openApiUrl: existing.openApiUrl,
        authStrategy: existing.authStrategy,
      });
      tools = applyManagedConnectorToolAccessModes(
        generatedTools,
        existingAccessModes,
      );
    } else {
      const credentials =
        existing.authStrategy === "oauth2" && ownerId
          ? await this.getManagedConnectorDiscoveryCredentials(ownerId, normalizedSlug)
          : {};
      const discovery = await discoverIntegration(
        {
          key: normalizedSlug,
          kind: "mcp",
          config: {
            serverUrl: existing.serverUrl,
          },
          credentials,
        },
        {
          ownerId,
          repository: this.repository,
        },
      );

      tools = Object.values(discovery.tools).map((toolSpec) => {
        const accessMode =
          existingAccessModes.get(toolSpec.name) ?? getToolAccessMode(toolSpec);
        return toManagedConnectorToolDefinition(toolSpec, accessMode);
      });
    }

    const updated = await this.repository.upsertManagedConnector({
      ...existing,
      tools: sanitizeIndexedToolDefinitions(tools),
      updatedAt: nowIso(),
    });

    return sanitizeManagedConnectorToolResponse(updated);
  }


  async deleteManagedConnector(slug: string) {
    await this.initialize();

    const normalizedSlug = slug.trim();
    if (!normalizedSlug) {
      throw new ContextLayerError("Managed connectors require a slug.", 400);
    }

    const existing = await this.repository.getManagedConnector(normalizedSlug);
    if (!existing) {
      throw new ContextLayerError("Managed connector not found.", 404);
    }

    await this.repository.deleteManagedConnector(normalizedSlug);
    return { deleted: true as const, slug: normalizedSlug };
  }


  async listAccessRequests() {
    await this.initialize();
    return this.repository.listAccessRequests();
  }

  async listOwnerAccessRequests(ownerId: string) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    return (await this.listAccessRequests()).filter(
      (request) => getAccessRequestOwnerId(request) === normalizedOwnerId,
    );
  }

  async listNotifications() {
    await this.initialize();
    return this.repository.listNotifications();
  }

  async createNotification(notification: NotificationRecord) {
    await this.initialize();
    return this.repository.createNotification(notification);
  }

  async getOrCreateAgentApiKey(ownerId: string): Promise<AgentApiKeyRecord> {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);

    if (!normalizedOwnerId) {
      throw new ContextLayerError(
        "A signed-in user email or name is required before issuing a context-layer API key.",
        400,
      );
    }

    const existing = await this.repository.getAgentApiKeyByOwner(normalizedOwnerId);
    if (existing) {
      return existing;
    }

    const timestamp = nowIso();
    return this.repository.saveAgentApiKey({
      ownerId: normalizedOwnerId,
      apiKey: createAgentApiKeyValue(),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async rotateAgentApiKey(ownerId: string): Promise<AgentApiKeyRecord> {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);

    if (!normalizedOwnerId) {
      throw new ContextLayerError(
        "A signed-in user email or name is required before issuing a context-layer API key.",
        400,
      );
    }

    const existing = await this.repository.getAgentApiKeyByOwner(normalizedOwnerId);
    const timestamp = nowIso();

    // Agent keys are stored one-per-owner, so this upsert replaces the prior key and
    // immediately invalidates the old bearer token for that owner.
    return this.repository.saveAgentApiKey({
      ownerId: normalizedOwnerId,
      apiKey: createAgentApiKeyValue(),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  }

  async hasStoredAgentApiKeys() {
    await this.initialize();
    return this.repository.hasAgentApiKeys();
  }

  async getStoredAgentApiKey(apiKey: string | null | undefined) {
    const normalizedApiKey = apiKey?.trim();
    if (!normalizedApiKey) {
      return null;
    }

    await this.initialize();
    return this.repository.findAgentApiKey(normalizedApiKey);
  }

  async getUserApiKeyStatus(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const record = await this.repository.getUserApiKeyByOwner(normalizedOwnerId);

    if (!record) {
      return null;
    }

    if (record.encryptedApiKey && !record.keySuffix) {
      const apiKey = decryptScopedApiKey(record.encryptedApiKey);
      if (apiKey) {
        const updatedRecord: UserApiKeyRecord = {
          ...record,
          keyPrefix: getScopedApiKeyPrefix(apiKey),
          keySuffix: getScopedApiKeySuffix(apiKey),
        };
        await this.repository.saveUserApiKey(updatedRecord);
        return toUserApiKeyStatus(updatedRecord);
      }
    }

    return toUserApiKeyStatus(record);
  }

  async getUserApiKeyValue(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const record = await this.repository.getUserApiKeyByOwner(normalizedOwnerId);

    if (!record?.encryptedApiKey) {
      return null;
    }

    return decryptScopedApiKey(record.encryptedApiKey);
  }

  async rotateUserApiKey(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);

    if (!normalizedOwnerId) {
      throw new ContextLayerError(
        "A signed-in user email or name is required before issuing a user API key.",
        400,
      );
    }

    const existing = await this.repository.getUserApiKeyByOwner(normalizedOwnerId);
    const apiKey = createUserApiKeyValue();
    const timestamp = nowIso();
    const record: UserApiKeyRecord = {
      ownerId: normalizedOwnerId,
      apiKeyHash: hashScopedApiKey(apiKey),
      keyPrefix: getScopedApiKeyPrefix(apiKey),
      keySuffix: getScopedApiKeySuffix(apiKey),
      encryptedApiKey: encryptScopedApiKey(apiKey),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    await this.repository.saveUserApiKey(record);

    return {
      apiKey,
      key: toUserApiKeyStatus(record),
    };
  }

  async revokeUserApiKey(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const existing = await this.repository.getUserApiKeyByOwner(normalizedOwnerId);

    if (!existing) {
      return { revoked: false as const };
    }

    await this.repository.deleteUserApiKey(normalizedOwnerId);
    return { revoked: true as const };
  }

  async getStoredUserApiKey(apiKey: string | null | undefined) {
    const normalizedApiKey = apiKey?.trim();
    if (!normalizedApiKey) {
      return null;
    }

    await this.initialize();
    return this.repository.findUserApiKeyByHash(hashScopedApiKey(normalizedApiKey));
  }

  async getAdminApiKeyStatus(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = requireAdminApiKeyOwner(ownerId);
    const record = await this.repository.getAdminApiKeyByOwner(normalizedOwnerId);

    if (!record) {
      return null;
    }

    if (record.encryptedApiKey && !record.keySuffix) {
      const apiKey = decryptScopedApiKey(record.encryptedApiKey);
      if (apiKey) {
        const updatedRecord: AdminApiKeyRecord = {
          ...record,
          keyPrefix: getScopedApiKeyPrefix(apiKey),
          keySuffix: getScopedApiKeySuffix(apiKey),
        };
        await this.repository.saveAdminApiKey(updatedRecord);
        return toAdminApiKeyStatus(updatedRecord);
      }
    }

    return toAdminApiKeyStatus(record);
  }

  async getAdminApiKeyValue(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = requireAdminApiKeyOwner(ownerId);
    const record = await this.repository.getAdminApiKeyByOwner(normalizedOwnerId);

    if (!record?.encryptedApiKey) {
      return null;
    }

    return decryptScopedApiKey(record.encryptedApiKey);
  }

  async rotateAdminApiKey(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = requireAdminApiKeyOwner(ownerId);

    const existing = await this.repository.getAdminApiKeyByOwner(normalizedOwnerId);
    const apiKey = createAdminApiKeyValue();
    const timestamp = nowIso();
    const record: AdminApiKeyRecord = {
      ownerId: normalizedOwnerId,
      apiKeyHash: hashScopedApiKey(apiKey),
      keyPrefix: getScopedApiKeyPrefix(apiKey),
      keySuffix: getScopedApiKeySuffix(apiKey),
      encryptedApiKey: encryptScopedApiKey(apiKey),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    await this.repository.saveAdminApiKey(record);

    return {
      apiKey,
      key: toAdminApiKeyStatus(record),
    };
  }

  async revokeAdminApiKey(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = requireAdminApiKeyOwner(ownerId);
    const existing = await this.repository.getAdminApiKeyByOwner(normalizedOwnerId);

    if (!existing) {
      return { revoked: false as const };
    }

    await this.repository.deleteAdminApiKey(normalizedOwnerId);
    return { revoked: true as const };
  }

  async getStoredAdminApiKey(apiKey: string | null | undefined) {
    const normalizedApiKey = apiKey?.trim();
    if (!normalizedApiKey) {
      return null;
    }

    await this.initialize();
    const record = await this.repository.findAdminApiKeyByHash(
      hashScopedApiKey(normalizedApiKey),
    );

    if (!record || !isAppAdminEmail(record.ownerId)) {
      return null;
    }

    return record;
  }

  async listIntegrationConnections(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const connections = await this.repository.listIntegrationConnections(
      normalizedOwnerId,
    );
    return connections.map(sanitizeConnectionStatus);
  }

  async getIntegrationConnectionStatus(ownerId: string, integrationKey: string) {
    await this.initialize();
    const connection = await this.repository.getIntegrationConnection(
      normalizeAgentApiKeyOwner(ownerId),
      integrationKey,
    );
    return connection ? sanitizeConnectionStatus(connection) : null;
  }

  async saveOAuthConnection(
    ownerId: string,
    integrationKey: string,
    provider: string,
    credentials: {
      accessToken: string;
      refreshToken?: string;
    },
    metadata: Omit<
      IntegrationConnectionRecord,
      | "ownerId"
      | "integrationKey"
      | "provider"
      | "encryptedCredentials"
      | "createdAt"
      | "updatedAt"
    >,
  ) {
    await this.initialize();
    const timestamp = nowIso();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const existing = await this.repository.getIntegrationConnection(
      normalizedOwnerId,
      integrationKey,
    );
    const record: IntegrationConnectionRecord = {
      ownerId: normalizedOwnerId,
      integrationKey,
      provider,
      authStrategy: metadata.authStrategy,
      encryptedCredentials: encryptCredentials({
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
      }),
      tokenType: metadata.tokenType,
      scopes: metadata.scopes,
      expiresAt: metadata.expiresAt,
      externalAccountId: metadata.externalAccountId,
      externalWorkspaceId: metadata.externalWorkspaceId,
      displayName: metadata.displayName,
      metadata: metadata.metadata,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    return sanitizeConnectionStatus(
      await this.repository.upsertIntegrationConnection(record),
    );
  }

  async saveOAuthState(record: {
    state: string;
    ownerId: string;
    integrationKey: string;
    provider: string;
    codeVerifier?: string;
    redirectTo: string;
    redirectUri?: string;
    callbackUrl?: string;
    expiresAt: string;
  }) {
    await this.initialize();
    return this.repository.saveOAuthState({
      ...record,
      ownerId: normalizeAgentApiKeyOwner(record.ownerId),
      createdAt: nowIso(),
    });
  }

  async getOAuthState(state: string, provider: string) {
    await this.initialize();
    const record = await this.repository.getOAuthState(state);
    if (!record) {
      throw new ContextLayerError("OAuth state not found or already used.", 400);
    }

    if (record.provider !== provider) {
      throw new ContextLayerError("OAuth state provider mismatch.", 400);
    }

    if (record.expiresAt <= nowIso()) {
      throw new ContextLayerError("OAuth state has expired. Try connecting again.", 400);
    }

    return record;

  }

  async consumeOAuthState(state: string, provider: string) {
    await this.initialize();
    const record = await this.getOAuthState(state, provider);
    await this.repository.deleteOAuthState(state);
    return record;
  }


  async isStoredAgentApiKeyAuthorized(apiKey: string) {
    await this.initialize();
    const candidate = apiKey.trim();

    if (!candidate) {
      return false;
    }

    return (await this.repository.findAgentApiKey(candidate)) !== null;
  }


  async registerOwnerIntegration(
    ownerId: string,
    spec: Omit<IntegrationSpec, "tools"> & {
      tools?: Record<string, ToolSpec>;
      functions?: Record<string, ToolSpec>;
    },
  ) {
    await this.initialize();

    if (spec.authStrategy === "oauth2" && Object.keys(spec.credentials).length > 0) {
      throw new ContextLayerError(
        "OAuth integrations cannot store credentials directly. Save per-user OAuth connections instead.",
        400,
      );
    }

    const integration = await this.applyManagedConnectorConstraints({
      ...spec,
      tools: normalizeTools(spec.tools ?? spec.functions ?? {}),
    });
    return redactIntegrationCredentials(
      await this.repository.upsertOwnerIntegration(
        normalizeAgentApiKeyOwner(ownerId),
        integration,
      ),
    );
  }

  async addOwnerTool(
    ownerId: string,
    integrationKey: string,
    toolSpec: ToolSpec,
  ) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integration = await this.getMutableOwnerIntegration(
      normalizedOwnerId,
      integrationKey,
    );
    integration.tools[toolSpec.name] = normalizeToolSpec(toolSpec);
    const constrainedIntegration = await this.applyManagedConnectorConstraints(integration);
    await this.repository.upsertOwnerIntegration(normalizedOwnerId, constrainedIntegration);
    return constrainedIntegration.tools[toolSpec.name];
  }

  async setOwnerIntegrationEnabled(
    ownerId: string,
    integrationKey: string,
    enabled: boolean,
  ) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integration = await this.getMutableOwnerIntegration(
      normalizedOwnerId,
      integrationKey,
    );
    integration.enabled = enabled;
    return redactIntegrationCredentials(
      await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration),
    );
  }

  async setOwnerToolEnabled(
    ownerId: string,
    integrationKey: string,
    toolName: string,
    enabled: boolean,
  ) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integration = await this.getMutableOwnerIntegration(
      normalizedOwnerId,
      integrationKey,
    );
    const toolSpec = integration.tools[toolName];

    if (!toolSpec) {
      throw new ContextLayerError(
        `Unknown tool '${toolName}' for integration '${integrationKey}'.`,
        404,
      );
    }

    const requestedAccessMode = enabled
      ? toolSpec.accessMode === "disabled"
        ? "enabled"
        : getToolAccessMode(toolSpec)
      : "disabled";
    const accessMode = toolSpec.maxAccessMode
      ? clampFunctionAccessMode(requestedAccessMode, toolSpec.maxAccessMode)
      : requestedAccessMode;

    toolSpec.enabled = accessMode !== "disabled";
    toolSpec.accessMode = accessMode;
    await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
    return toolSpec;
  }

  async setOwnerToolAccessMode(
    ownerId: string,
    integrationKey: string,
    toolName: string,
    accessMode: ToolAccessMode,
  ) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integration = await this.getMutableOwnerIntegration(
      normalizedOwnerId,
      integrationKey,
    );
    const toolSpec = integration.tools[toolName];

    if (!toolSpec) {
      throw new ContextLayerError(
        `Unknown tool '${toolName}' for integration '${integrationKey}'.`,
        404,
      );
    }

    if (
      toolSpec.maxAccessMode &&
      !isFunctionAccessModeAllowed(accessMode, toolSpec.maxAccessMode)
    ) {
      throw new ContextLayerError(
        `Tool '${toolName}' cannot exceed the organization-managed '${toolSpec.maxAccessMode}' access level.`,
        403,
      );
    }

    toolSpec.accessMode = accessMode;
    toolSpec.enabled = accessMode !== "disabled";
    await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
    return toolSpec;
  }


  async upsertAgentPolicy(agentClass: string, rules: PolicyRule[]) {
    await this.initialize();
    const policy: AgentClassPolicy = { agentClass, rules };
    return this.repository.upsertPolicy(policy);
  }

  async evaluateAccess(
    request: AccessEvaluationRequest,
  ): Promise<AccessDecision>;
  async evaluateAccess(
    agentId: string | null,
    agentClass: string | null,
    integrationKey: string,
    toolName: string,
    requestedScopes?: string[],
    options?: {
      ownerId?: string;
      agentData?: AccessRequestAgentData;
    },
  ): Promise<AccessDecision>;
  async evaluateAccess(
    agentIdOrRequest: string | null | AccessEvaluationRequest,
    agentClass?: string | null,
    integrationKey?: string,
    toolName?: string,
    requestedScopes: string[] = [],
    options: {
      ownerId?: string;
      agentData?: AccessRequestAgentData;
    } = {},
  ): Promise<AccessDecision> {
    const request = toAccessEvaluationRequest(
      agentIdOrRequest,
      agentClass,
      integrationKey,
      toolName,
      requestedScopes,
      options,
    );
    const integration = await this.getRuntimeIntegration(
      request.integrationKey,
      request.ownerId,
    );
    const [temporaryGrants, policy] = await Promise.all([
      this.repository.listTemporaryGrants(),
      request.agentClass ? this.repository.getPolicy(request.agentClass) : Promise.resolve(null),
    ]);

    return evaluateIntegrationAccess({
      agentId: request.agentId,
      agentClass: request.agentClass,
      integration,
      toolName: request.toolName,
      requestedScopes: request.requestedScopes,
      temporaryGrants,
      policy,
    });
  }

  async createAccessRequest(
    request: Omit<AccessRequest, "id" | "createdAt" | "status">,
  ) {
    await this.initialize();
    const accessRequest: AccessRequest = {
      ...request,
      justification: request.justification?.trim() || undefined,
      agentData: normalizeAccessRequestAgentData(request.agentData),
      id: randomUUID(),
      createdAt: nowIso(),
      status: "pending",
    };
    await this.repository.createAccessRequest(accessRequest);
    await this.notifications.publishAccessRequest(accessRequest);
    return accessRequest;
  }

  async approveAccessRequest(
    requestId: string,
    approver: string,
    durationMinutes?: number,
  ) {
    return this.approveResolvedAccessRequest(
      await this.getAccessRequest(requestId),
      approver,
      durationMinutes,
    );
  }

  async approveOwnerAccessRequest(
    ownerId: string,
    requestId: string,
    approver: string,
    durationMinutes?: number,
  ) {
    return this.approveResolvedAccessRequest(
      await this.getAccessRequestForOwner(requestId, ownerId),
      approver,
      durationMinutes,
    );
  }

  async rejectAccessRequest(requestId: string, approver: string) {
    return this.rejectResolvedAccessRequest(
      await this.getAccessRequest(requestId),
      approver,
    );
  }

  async rejectOwnerAccessRequest(
    ownerId: string,
    requestId: string,
    approver: string,
  ) {
    return this.rejectResolvedAccessRequest(
      await this.getAccessRequestForOwner(requestId, ownerId),
      approver,
    );
  }

  async purgeExpiredGrants() {
    await this.initialize();
    return this.repository.purgeExpiredGrants(nowIso());
  }

  /**
   * Resolves an owner-scoped integration, enforces access policy, invokes the backing adapter,
   * and records best-effort invocation metadata for auditing.
   */
  async invokeContext(
    agentId: string | null,
    agentClass: string | null,
    integrationKey: string,
    toolName: string,
    payload?: Record<string, unknown>,
    requestedScopes?: string[],
    options?: {
      ownerId?: string;
      agentData?: AccessRequestAgentData;
    },
  ): Promise<ContextInvocationResult>;
  async invokeContext(
    agentId: string | null,
    agentClass?: string | null,
    integrationKey?: string,
    toolName?: string,
    payload: Record<string, unknown> = {},
    requestedScopes: string[] = [],
    options: {
      ownerId?: string;
      agentData?: AccessRequestAgentData;
    } = {},
  ): Promise<ContextInvocationResult> {
    const request = toContextInvocationRequest(
      agentId,
      agentClass,
      integrationKey,
      toolName,
      payload,
      requestedScopes,
      options,
    );
    const integration = await this.getRuntimeIntegration(
      request.integrationKey,
      request.ownerId,
    );
    const toolSpec = integration.tools[request.toolName];
    if (!toolSpec) {
      throw new ContextLayerError(
        `Unknown tool '${request.toolName}' for integration '${request.integrationKey}'.`,
        404,
      );
    }

    const invokedAt = nowIso();
    const startedAtMs = Date.now();
    const payloadKeys = normalizePayloadKeys(request.payload ?? {});
    const fallbackScopes = normalizeScopes(
      request.requestedScopes && request.requestedScopes.length > 0
        ? request.requestedScopes
        : toolSpec.defaultScopes,
    );
    const decision = await this.evaluateAccess(request);
    if (!decision.allowed) {
      if (getToolAccessMode(toolSpec) === "approval_required") {
        await runOptionalSideEffect("create a pending access request", async () => {
          await this.ensurePendingAccessRequest({
            agentId: request.agentId,
            agentClass: request.agentClass,
            integrationKey: request.integrationKey,
            toolName: request.toolName,
            scopes: decision.effectiveScopes,
            ownerId: request.ownerId,
            agentData: request.agentData,
          });
        });
      }

      await runOptionalSideEffect("record a denied tool invocation", async () => {
        await this.recordToolInvocation({
          ownerId: request.ownerId,
          agentId: request.agentId,
          agentClass: request.agentClass,
          integration,
          toolName: request.toolName,
          scopes: decision.effectiveScopes,
          payloadKeys,
          invokedAt,
          outcome: "denied",
          durationMs: Date.now() - startedAtMs,
          errorMessage: decision.reason,
        });
      });

      throw new ContextLayerError(decision.reason, 403);
    }

    let resolvedIntegration: IntegrationSpec | null = null;

    try {
      resolvedIntegration = await this.resolveIntegrationForOwner(
        integration,
        request.ownerId,
      );
      const invocationIntegration = resolvedIntegration;

      const data =
        toolSpec.executionMode === "mock"
          ? await this.adapters.invoke("mock", {
              agentId: request.agentId,
              integration: invocationIntegration,
              toolSpec,
              payload: request.payload ?? {},
            })
          : await this.adapters.invoke(invocationIntegration.provider, {
              agentId: request.agentId,
              integration: invocationIntegration,
              toolSpec,
              payload: request.payload ?? {},
            });

      await runOptionalSideEffect(
        "record a successful tool invocation",
        async () => {
          await this.recordToolInvocation({
            ownerId: request.ownerId,
            agentId: request.agentId,
            agentClass: request.agentClass,
            integration: invocationIntegration,
            toolName: request.toolName,
            scopes: decision.effectiveScopes,
            payloadKeys,
            invokedAt,
            outcome: "success",
            durationMs: Date.now() - startedAtMs,
          });
        },
      );

      return {
        integration: invocationIntegration.key,
        tool: toolSpec.name,
        provider: invocationIntegration.provider,
        kind: invocationIntegration.kind,
        authStrategy: invocationIntegration.authStrategy,
        decision,
        data,
      };
    } catch (error) {
      await runOptionalSideEffect("record a failed tool invocation", async () => {
        await this.recordToolInvocation({
          ownerId: request.ownerId,
          agentId: request.agentId,
          agentClass: request.agentClass,
          integration: resolvedIntegration ?? integration,
          toolName: request.toolName,
          scopes:
            decision.effectiveScopes.length > 0
              ? decision.effectiveScopes
              : fallbackScopes,
          payloadKeys,
          invokedAt,
          outcome: "error",
          durationMs: Date.now() - startedAtMs,
          errorMessage: summarizeErrorMessage(error),
        });
      });
      throw error;
    }
  }

  private async recordToolInvocation(args: {
    ownerId?: string;
    agentId: string | null;
    agentClass: string | null;
    integration: Pick<IntegrationSpec, "key" | "provider" | "kind" | "authStrategy">;
    toolName: string;
    scopes: string[];
    payloadKeys: string[];
    invokedAt: string;
    outcome: ToolInvocationOutcome;
    durationMs?: number;
    errorMessage?: string;
  }) {
    await this.repository.createToolInvocation(createToolInvocationRecord(args));
  }

  private async refreshOAuthConnection(record: IntegrationConnectionRecord) {
    const provider = await resolveOAuthProvider(this.repository, record.provider);

    if (!provider) {
      throw new ContextLayerError(
        `OAuth provider '${record.provider}' is not configured.`,
        500,
      );
    }

    const storedCredentials = decryptCredentials<{
      accessToken: string;
      refreshToken?: string;
    }>(record.encryptedCredentials);

    if (!storedCredentials.refreshToken) {
      throw new ContextLayerError(
        `Reconnect ${record.provider} to refresh the expired access token.`,
        403,
      );
    }

    const refreshed = await provider.refreshToken({
      refreshToken: storedCredentials.refreshToken,
    });
    const timestamp = nowIso();

    return this.repository.upsertIntegrationConnection({
      ...record,
      authStrategy: "oauth2",
      encryptedCredentials: encryptCredentials({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? storedCredentials.refreshToken,
      }),
      tokenType: refreshed.tokenType ?? record.tokenType,
      scopes: refreshed.scopes.length > 0 ? refreshed.scopes : record.scopes,
      expiresAt: refreshed.expiresAt,
      externalAccountId: refreshed.externalAccountId ?? record.externalAccountId,
      externalWorkspaceId:
        refreshed.externalWorkspaceId ?? record.externalWorkspaceId,
      displayName: refreshed.displayName ?? record.displayName,
      metadata: {
        ...record.metadata,
        ...refreshed.metadata,
      },
      updatedAt: timestamp,
    });
  }

  private async resolveIntegrationForOwner(
    integration: IntegrationSpec,
    ownerId?: string,
  ) {
    if (!ownerId) {
      return integration;
    }

    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const connection = await this.repository.getIntegrationConnection(
      normalizedOwnerId,
      integration.key,
    );

    if (!connection) {
      if (
        integration.authStrategy === "oauth2" &&
        Object.keys(integration.credentials).length === 0
      ) {
        throw new ContextLayerError(
          `Connect ${integration.name} for this user before invoking '${integration.key}'.`,
          403,
        );
      }

      return integration;
    }

    const activeConnection =
      connection.authStrategy === "oauth2" && isConnectionExpired(connection.expiresAt)
        ? await this.refreshOAuthConnection(connection)
        : connection;

    return {
      ...integration,
      authStrategy: activeConnection.authStrategy,
      credentials: decryptCredentials<Record<string, unknown>>(
        activeConnection.encryptedCredentials,
      ),
    } satisfies IntegrationSpec;
  }


  private async applyManagedConnectorConstraints(integration: IntegrationSpec) {
    const managedConnectorSlug = getManagedConnectorSlug(integration);
    if (!managedConnectorSlug) {
      return sanitizeIntegrationTools(integration, null);
    }

    const connector = await this.repository.getManagedConnector(managedConnectorSlug);
    return sanitizeIntegrationTools(integration, connector);
  }

  private async getManagedConnectorDiscoveryCredentials(
    ownerId: string,
    integrationKey: string,
  ): Promise<Record<string, unknown>> {
    const connection = await this.repository.getIntegrationConnection(
      normalizeAgentApiKeyOwner(ownerId),
      integrationKey,
    );

    if (!connection) {
      return {};
    }

    return decryptCredentials<Record<string, unknown>>(connection.encryptedCredentials);
  }

  private async getRuntimeIntegration(key: string, ownerId?: string) {
    if (!ownerId) {
      throw new ContextLayerError(
        `Integration '${key}' must be installed for a specific user before invocation.`,
        400,
      );
    }

    return this.getOwnerIntegration(ownerId, key);
  }

  private async getMutableOwnerIntegration(ownerId: string, key: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const existing = await this.repository.getOwnerIntegration(normalizedOwnerId, key);
    if (existing) {
      return this.applyManagedConnectorConstraints(existing);
    }

    throw new ContextLayerError(
      `Integration '${key}' is not installed for this user. Install it from the integrations wizard first.`,
      404,
    );
  }

  private async ensurePendingAccessRequest({
    agentId,
    agentClass,
    integrationKey,
    toolName,
    scopes,
    ownerId,
    agentData,
  }: {
    agentId: string | null;
    agentClass: string | null;
    integrationKey: string;
    toolName: string;
    scopes: string[];
    ownerId?: string;
    agentData?: AccessRequestAgentData;
  }) {
    await this.initialize();
    const notificationRecipient = ownerId?.trim() || "case-by-case-approvals";
    const normalizedNotificationRecipient = normalizeAgentApiKeyOwner(
      notificationRecipient,
    );
    const pendingRequests = (await this.repository.listAccessRequests()).filter(
      (request) => request.status === "pending",
    );
    const existing = pendingRequests.find(
      (request) =>
        request.agentId === agentId &&
        request.agentClass === agentClass &&
        request.integrationKey === integrationKey &&
        request.toolName === toolName &&
        sameScopes(request.scopes, scopes) &&
        getAccessRequestOwnerId(request) === normalizedNotificationRecipient,
    );

    if (existing) {
      const normalizedAgentData = normalizeAccessRequestAgentData(agentData);
      if (
        normalizedAgentData.conversationLink &&
        !sameAccessRequestAgentData(existing.agentData, normalizedAgentData)
      ) {
        const updated = {
          ...existing,
          agentData: normalizedAgentData,
        } satisfies AccessRequest;
        await this.repository.updateAccessRequest(updated);
        return updated;
      }

      return existing;
    }

    return this.createAccessRequest({
      agentId,
      agentClass,
      integrationKey,
      toolName,
      scopes: normalizeScopes(scopes),
      requestedMinutes: DEFAULT_CASE_BY_CASE_APPROVAL_MINUTES,
      channels: ["in_app"],
      notificationTargets: {
        in_app: notificationRecipient,
      },
      agentData,
    });
  }

  private async getOwnerIntegration(ownerId: string, key: string) {
    await this.initialize();
    const integration = await this.repository.getOwnerIntegration(
      normalizeAgentApiKeyOwner(ownerId),
      key,
    );
    if (integration) {
      return this.applyManagedConnectorConstraints(integration);
    }

    throw new ContextLayerError(
      `Integration '${key}' is not installed for this user. Install it from the integrations wizard first.`,
      404,
    );
  }

  private async getAccessRequest(requestId: string) {
    await this.initialize();
    const request = await this.repository.getAccessRequest(requestId);
    if (!request) {
      throw new ContextLayerError(
        `Unknown access request '${requestId}'.`,
        404,
      );
    }
    return request;
  }

  private async getAccessRequestForOwner(requestId: string, ownerId: string) {
    const request = await this.getAccessRequest(requestId);
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);

    if (getAccessRequestOwnerId(request) !== normalizedOwnerId) {
      throw new ContextLayerError(
        `Unknown access request '${requestId}'.`,
        404,
      );
    }

    return request;
  }

  private async approveResolvedAccessRequest(
    request: AccessRequest,
    approver: string,
    durationMinutes?: number,
  ) {
    const decidedAt = nowIso();
    const approvedRequest: AccessRequest = {
      ...request,
      status: "approved",
      decidedAt,
      decidedBy: approver,
    };
    await this.repository.updateAccessRequest(approvedRequest);

    const grant: TemporaryGrant = {
      id: randomUUID(),
      agentId: request.agentId,
      agentClass: request.agentClass,
      integrationKey: request.integrationKey,
      toolName: request.toolName,
      scopes: request.scopes,
      grantedBy: approver,
      createdAt: decidedAt,
      expiresAt: addMinutes(
        decidedAt,
        durationMinutes ?? request.requestedMinutes,
      ),
    };

    await this.repository.saveTemporaryGrant(grant);
    return grant;
  }

  private async rejectResolvedAccessRequest(
    request: AccessRequest,
    approver: string,
  ) {
    const rejected: AccessRequest = {
      ...request,
      status: "rejected",
      decidedAt: nowIso(),
      decidedBy: approver,
    };
    await this.repository.updateAccessRequest(rejected);
    return rejected;
  }
}
