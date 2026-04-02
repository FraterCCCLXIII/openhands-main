import { randomUUID } from "node:crypto";

import { DEFAULT_CASE_BY_CASE_APPROVAL_MINUTES } from "@/src/lib/access-requests";
import { isAppAdminEmail } from "@/src/lib/app-admins";

import type { AdapterRegistry } from "@/src/lib/core/adapter-registry";
import {
  evaluateIntegrationAccess,
  getFunctionAccessMode,
  normalizeFunctions,
  normalizeFunctionSpec,
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
import {
  listAllManagedConnectorDefinitions,
  sanitizeManagedConnector,
} from "@/src/lib/integrations/managed-connectors";
import { generateManagedConnectorFunctionsFromOpenApi } from "@/src/lib/managed-connectors/openapi";
import type { NotificationPublisher } from "@/src/lib/notifications/publisher";
import {
  encryptManagedOAuthClient,
  registerManagedOAuthClient,
  usesDynamicOAuthClientRegistration,
} from "@/src/lib/oauth/managed-oauth-client";
import { resolveOAuthProvider } from "@/src/lib/oauth/provider-resolver";
import type {
  AccessDecision,
  AccessRequest,
  AdminApiKeyRecord,
  AdminApiKeyStatus,
  AgentApiKeyRecord,
  AgentClassPolicy,
  ContextInvocationResult,
  DisableUnusedFunctionsResult,
  FunctionAccessMode,
  FunctionSpec,
  FunctionUsageSummary,
  GenericOAuthConfig,
  IntegrationConnectionRecord,
  IntegrationConnectionStatus,
  IntegrationSpec,
  ManagedConnectorDefinition,
  ManagedConnectorRecord,
  NotificationRecord,
  PolicyRule,
  TemporaryGrant,
  ToolInvocationOutcome,
  ToolInvocationRecord,
  UnusedFunctionWindowUnit,
  UserApiKeyRecord,
  UserApiKeyStatus,
} from "@/src/types/context-layer";

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

const isConnectionExpired = (expiresAt?: string, bufferMs = 60_000) => {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now() + bufferMs;
};

const normalizeAgentApiKeyOwner = normalizeOwnerId;

export interface AccessEvaluationRequest {
  agentId: string;
  agentClass: string;
  integrationKey: string;
  functionName: string;
  requestedScopes?: string[];
  ownerId?: string;
}

export interface ContextInvocationRequest extends AccessEvaluationRequest {
  payload?: Record<string, unknown>;
}

const toAccessEvaluationRequest = (
  agentIdOrRequest: string | AccessEvaluationRequest,
  agentClass?: string,
  integrationKey?: string,
  functionName?: string,
  requestedScopes: string[] = [],
  options: {
    ownerId?: string;
  } = {},
): AccessEvaluationRequest => {
  if (typeof agentIdOrRequest !== "string") {
    return {
      ...agentIdOrRequest,
      requestedScopes: agentIdOrRequest.requestedScopes ?? [],
    };
  }

  if (!agentClass || !integrationKey || !functionName) {
    throw new ContextLayerError("Incomplete access evaluation request.", 400);
  }

  return {
    agentId: agentIdOrRequest,
    agentClass,
    integrationKey,
    functionName,
    requestedScopes,
    ownerId: options.ownerId,
  };
};

const toContextInvocationRequest = (
  agentIdOrRequest: string | ContextInvocationRequest,
  agentClass?: string,
  integrationKey?: string,
  functionName?: string,
  payload: Record<string, unknown> = {},
  requestedScopes: string[] = [],
  options: {
    ownerId?: string;
  } = {},
): ContextInvocationRequest => {
  if (typeof agentIdOrRequest !== "string") {
    return {
      ...agentIdOrRequest,
      payload: agentIdOrRequest.payload ?? {},
      requestedScopes: agentIdOrRequest.requestedScopes ?? [],
    };
  }

  const accessRequest = toAccessEvaluationRequest(
    agentIdOrRequest,
    agentClass,
    integrationKey,
    functionName,
    requestedScopes,
    options,
  );

  return {
    ...accessRequest,
    payload,
  };
};


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
    return (await this.repository.listOwnerIntegrations(normalizeAgentApiKeyOwner(ownerId)))
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  async listOwnerIntegrationsWithUsage(ownerId: string) {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const [integrations, usageSummaries] = await Promise.all([
      this.repository.listOwnerIntegrations(normalizedOwnerId),
      this.repository.listOwnerFunctionUsageSummaries(normalizedOwnerId),
    ]);
    const usageByFunction = new Map(
      usageSummaries.map((summary) => [
        `${summary.integrationKey}:${summary.functionName}`,
        summary,
      ]),
    );

    return integrations
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((integration) => ({
        ...integration,
        functions: Object.fromEntries(
          Object.entries(integration.functions).map(([functionName, functionSpec]) => {
            const usage = usageByFunction.get(`${integration.key}:${functionName}`);
            return [
              functionName,
              usage
                ? {
                    ...functionSpec,
                    lastInvokedAt: usage.lastInvokedAt,
                    lastInvocationOutcome: usage.lastInvocationOutcome,
                    invocationCount: usage.invocationCount,
                  }
                : functionSpec,
            ];
          }),
        ),
      }));
  }

  async disableUnusedOwnerFunctions(
    ownerId: string,
    thresholdValue: number,
    thresholdUnit: UnusedFunctionWindowUnit,
  ): Promise<DisableUnusedFunctionsResult> {
    await this.initialize();
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const [integrations, usageSummaries] = await Promise.all([
      this.repository.listOwnerIntegrations(normalizedOwnerId),
      this.repository.listOwnerFunctionUsageSummaries(normalizedOwnerId),
    ]);
    const cutoffIso = subtractUnusedWindow(nowIso(), thresholdValue, thresholdUnit);
    const staleUsageByFunction = new Map(
      usageSummaries
        .filter((summary) => summary.lastInvokedAt < cutoffIso)
        .map((summary) => [`${summary.integrationKey}:${summary.functionName}`, summary]),
    );
    const disabledFunctions: DisableUnusedFunctionsResult["disabledFunctions"] = [];

    for (const integration of integrations) {
      let changed = false;

      for (const [functionName, functionSpec] of Object.entries(integration.functions)) {
        if (getFunctionAccessMode(functionSpec) === "disabled") {
          continue;
        }

        const usage = staleUsageByFunction.get(`${integration.key}:${functionName}`);
        if (!usage) {
          continue;
        }

        integration.functions[functionName] = {
          ...functionSpec,
          accessMode: "disabled",
          enabled: false,
        };
        disabledFunctions.push({
          integrationKey: integration.key,
          functionName,
          lastInvokedAt: usage.lastInvokedAt,
        });
        changed = true;
      }

      if (changed) {
        await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
      }
    }

    disabledFunctions.sort(
      (left, right) =>
        left.integrationKey.localeCompare(right.integrationKey) ||
        left.functionName.localeCompare(right.functionName),
    );

    return {
      thresholdValue,
      thresholdUnit,
      cutoffIso,
      disabledCount: disabledFunctions.length,
      disabledFunctions,
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
    return listAllManagedConnectorDefinitions(this.repository);
  }

  async upsertManagedConnector(
    input: Omit<
      ManagedConnectorDefinition,
      "authModes" | "createdAt" | "oauthConfigured" | "updatedAt"
    > & {
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

    const generatedFunctions =
      provider === "http" && normalizedOpenApiUrl
        ? await generateManagedConnectorFunctionsFromOpenApi({
            openApiUrl: normalizedOpenApiUrl,
            authStrategy: input.authStrategy,
          })
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
      functions: generatedFunctions ?? input.functions,
      enabled: input.enabled,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    return sanitizeManagedConnector(
      await this.repository.upsertManagedConnector(record),
    );
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
    spec: Omit<IntegrationSpec, "functions"> & {
      functions?: Record<string, FunctionSpec>;
    },
  ) {
    await this.initialize();

    if (spec.authStrategy === "oauth2" && Object.keys(spec.credentials).length > 0) {
      throw new ContextLayerError(
        "OAuth integrations cannot store credentials directly. Save per-user OAuth connections instead.",
        400,
      );
    }

    const integration: IntegrationSpec = {
      ...spec,
      functions: normalizeFunctions(spec.functions ?? {}),
    };
    return this.repository.upsertOwnerIntegration(
      normalizeAgentApiKeyOwner(ownerId),
      integration,
    );
  }

  async addOwnerFunction(
    ownerId: string,
    integrationKey: string,
    functionSpec: FunctionSpec,
  ) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integration = await this.getMutableOwnerIntegration(
      normalizedOwnerId,
      integrationKey,
    );
    integration.functions[functionSpec.name] = normalizeFunctionSpec(functionSpec);
    await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
    return integration.functions[functionSpec.name];
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
    return this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
  }

  async setOwnerFunctionEnabled(
    ownerId: string,
    integrationKey: string,
    functionName: string,
    enabled: boolean,
  ) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integration = await this.getMutableOwnerIntegration(
      normalizedOwnerId,
      integrationKey,
    );
    const functionSpec = integration.functions[functionName];

    if (!functionSpec) {
      throw new ContextLayerError(
        `Unknown function '${functionName}' for integration '${integrationKey}'.`,
        404,
      );
    }

    const accessMode = enabled
      ? functionSpec.accessMode === "disabled"
        ? "enabled"
        : getFunctionAccessMode(functionSpec)
      : "disabled";

    functionSpec.enabled = accessMode !== "disabled";
    functionSpec.accessMode = accessMode;
    await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
    return functionSpec;
  }

  async setOwnerFunctionAccessMode(
    ownerId: string,
    integrationKey: string,
    functionName: string,
    accessMode: FunctionAccessMode,
  ) {
    const normalizedOwnerId = normalizeAgentApiKeyOwner(ownerId);
    const integration = await this.getMutableOwnerIntegration(
      normalizedOwnerId,
      integrationKey,
    );
    const functionSpec = integration.functions[functionName];

    if (!functionSpec) {
      throw new ContextLayerError(
        `Unknown function '${functionName}' for integration '${integrationKey}'.`,
        404,
      );
    }

    functionSpec.accessMode = accessMode;
    functionSpec.enabled = accessMode !== 'disabled';
    await this.repository.upsertOwnerIntegration(normalizedOwnerId, integration);
    return functionSpec;
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
    agentId: string,
    agentClass: string,
    integrationKey: string,
    functionName: string,
    requestedScopes?: string[],
    options?: {
      ownerId?: string;
    },
  ): Promise<AccessDecision>;
  async evaluateAccess(
    agentIdOrRequest: string | AccessEvaluationRequest,
    agentClass?: string,
    integrationKey?: string,
    functionName?: string,
    requestedScopes: string[] = [],
    options: {
      ownerId?: string;
    } = {},
  ): Promise<AccessDecision> {
    const request = toAccessEvaluationRequest(
      agentIdOrRequest,
      agentClass,
      integrationKey,
      functionName,
      requestedScopes,
      options,
    );
    const integration = await this.getRuntimeIntegration(
      request.integrationKey,
      request.ownerId,
    );
    const [temporaryGrants, policy] = await Promise.all([
      this.repository.listTemporaryGrants(),
      this.repository.getPolicy(request.agentClass),
    ]);

    return evaluateIntegrationAccess({
      agentId: request.agentId,
      agentClass: request.agentClass,
      integration,
      functionName: request.functionName,
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
    const request = await this.getAccessRequest(requestId);
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
      functionName: request.functionName,
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

  async rejectAccessRequest(requestId: string, approver: string) {
    const request = await this.getAccessRequest(requestId);
    const rejected: AccessRequest = {
      ...request,
      status: "rejected",
      decidedAt: nowIso(),
      decidedBy: approver,
    };
    await this.repository.updateAccessRequest(rejected);
    return rejected;
  }

  async purgeExpiredGrants() {
    await this.initialize();
    return this.repository.purgeExpiredGrants(nowIso());
  }

  async invokeContext(
    request: ContextInvocationRequest,
  ): Promise<ContextInvocationResult>;
  async invokeContext(
    agentId: string,
    agentClass: string,
    integrationKey: string,
    functionName: string,
    payload?: Record<string, unknown>,
    requestedScopes?: string[],
    options?: {
      ownerId?: string;
    },
  ): Promise<ContextInvocationResult>;
  async invokeContext(
    agentIdOrRequest: string | ContextInvocationRequest,
    agentClass?: string,
    integrationKey?: string,
    functionName?: string,
    payload: Record<string, unknown> = {},
    requestedScopes: string[] = [],
    options: {
      ownerId?: string;
    } = {},
  ): Promise<ContextInvocationResult> {
    const request = toContextInvocationRequest(
      agentIdOrRequest,
      agentClass,
      integrationKey,
      functionName,
      payload,
      requestedScopes,
      options,
    );
    const integration = await this.getRuntimeIntegration(
      request.integrationKey,
      request.ownerId,
    );
    const functionSpec = integration.functions[request.functionName];
    if (!functionSpec) {
      throw new ContextLayerError(
        `Unknown function '${request.functionName}' for integration '${request.integrationKey}'.`,
        404,
      );
    }

    const invokedAt = nowIso();
    const startedAtMs = Date.now();
    const payloadKeys = normalizePayloadKeys(request.payload ?? {});
    const fallbackScopes = normalizeScopes(
      request.requestedScopes && request.requestedScopes.length > 0
        ? request.requestedScopes
        : functionSpec.defaultScopes,
    );
    const decision = await this.evaluateAccess(request);
    if (!decision.allowed) {
      if (getFunctionAccessMode(functionSpec) === "approval_required") {
        await runOptionalSideEffect("create a pending access request", async () => {
          await this.ensurePendingAccessRequest({
            agentId: request.agentId,
            agentClass: request.agentClass,
            integrationKey: request.integrationKey,
            functionName: request.functionName,
            scopes: decision.effectiveScopes,
            ownerId: request.ownerId,
          });
        });
      }

      await runOptionalSideEffect("record a denied tool invocation", async () => {
        await this.recordToolInvocation({
          ownerId: request.ownerId,
          agentId: request.agentId,
          agentClass: request.agentClass,
          integration,
          functionName: request.functionName,
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
        functionSpec.executionMode === "mock"
          ? await this.adapters.invoke("mock", {
              agentId: request.agentId,
              integration: invocationIntegration,
              functionSpec,
              payload: request.payload ?? {},
            })
          : await this.adapters.invoke(invocationIntegration.provider, {
              agentId: request.agentId,
              integration: invocationIntegration,
              functionSpec,
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
            functionName: request.functionName,
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
        function: functionSpec.name,
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
          functionName: request.functionName,
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
    agentId: string;
    agentClass: string;
    integration: Pick<IntegrationSpec, "key" | "provider" | "kind" | "authStrategy">;
    functionName: string;
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
      return existing;
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
    functionName,
    scopes,
    ownerId,
  }: {
    agentId: string;
    agentClass: string;
    integrationKey: string;
    functionName: string;
    scopes: string[];
    ownerId?: string;
  }) {
    await this.initialize();
    const pendingRequests = (await this.repository.listAccessRequests()).filter(
      (request) => request.status === "pending",
    );
    const existing = pendingRequests.find(
      (request) =>
        request.agentId === agentId &&
        request.agentClass === agentClass &&
        request.integrationKey === integrationKey &&
        request.functionName === functionName &&
        sameScopes(request.scopes, scopes),
    );

    if (existing) {
      return existing;
    }

    const notificationRecipient = ownerId?.trim() || "case-by-case-approvals";

    return this.createAccessRequest({
      agentId,
      agentClass,
      integrationKey,
      functionName,
      scopes: normalizeScopes(scopes),
      requestedMinutes: DEFAULT_CASE_BY_CASE_APPROVAL_MINUTES,
      channels: ["in_app"],
      notificationTargets: {
        in_app: notificationRecipient,
      },
      justification:
        "Auto-created after an agent attempted a case-by-case tool without an active approval.",
    });
  }

  private async getOwnerIntegration(ownerId: string, key: string) {
    await this.initialize();
    const integration = await this.repository.getOwnerIntegration(
      normalizeAgentApiKeyOwner(ownerId),
      key,
    );
    if (integration) {
      return integration;
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
}
