import { randomBytes, randomUUID } from "node:crypto";

import type { AdapterRegistry } from "@/src/lib/core/adapter-registry";
import { addMinutes, nowIso } from "@/src/lib/core/date";
import { ContextLayerError } from "@/src/lib/core/errors";
import type { ContextRepository } from "@/src/lib/core/repository";
import { decryptCredentials, encryptCredentials } from "@/src/lib/credential-crypto";
import { getBuiltInConnectorDefinition } from "@/src/lib/integrations/built-in-connectors";
import type { NotificationPublisher } from "@/src/lib/notifications/publisher";
import { getOAuthProvider } from "@/src/lib/oauth/providers";
import type {
  AccessDecision,
  AccessRequest,
  AgentApiKeyRecord,
  AgentClassPolicy,
  ContextInvocationResult,
  FunctionAccessMode,
  FunctionSpec,
  IntegrationConnectionRecord,
  IntegrationConnectionStatus,
  IntegrationSpec,
  PolicyRule,
  TemporaryGrant,
} from "@/src/types/context-layer";

const unique = (values: string[]) => [...new Set(values)];

const getFunctionAccessMode = (
  functionSpec: FunctionSpec,
): FunctionAccessMode =>
  functionSpec.accessMode ?? (functionSpec.enabled ? "enabled" : "disabled");

const normalizeFunctionSpec = (functionSpec: FunctionSpec): FunctionSpec => {
  const accessMode = getFunctionAccessMode(functionSpec);

  return {
    ...functionSpec,
    accessMode,
    enabled: accessMode !== "disabled",
  };
};

const normalizeFunctions = (functions: Record<string, FunctionSpec>) =>
  Object.fromEntries(
    Object.entries(functions).map(([name, functionSpec]) => [
      name,
      normalizeFunctionSpec(functionSpec),
    ]),
  );

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


const normalizeAgentApiKeyOwner = (ownerId: string) => ownerId.trim().toLowerCase();

const createAgentApiKeyValue = () => `cla_${randomBytes(24).toString("base64url")}`;

const permittedByRule = (
  rule: PolicyRule,
  functionName: string,
  requestedScopes: string[],
  fineGrained: boolean,
) => {
  if (!rule.enabled) {
    return false;
  }

  if (
    fineGrained &&
    rule.functionNames.length > 0 &&
    !rule.functionNames.includes(functionName)
  ) {
    return false;
  }

  if (
    rule.scopes.length > 0 &&
    !requestedScopes.every((scope) => rule.scopes.includes(scope))
  ) {
    return false;
  }

  return true;
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

  async listIntegrations() {
    await this.initialize();
    return this.repository.listIntegrations();
  }

  async listAccessRequests() {
    await this.initialize();
    return this.repository.listAccessRequests();
  }

  async listNotifications() {
    await this.initialize();
    return this.repository.listNotifications();
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
    expiresAt: string;
  }) {
    await this.initialize();
    return this.repository.saveOAuthState({
      ...record,
      ownerId: normalizeAgentApiKeyOwner(record.ownerId),
      createdAt: nowIso(),
    });
  }

  async consumeOAuthState(state: string, provider: string) {
    await this.initialize();
    const record = await this.repository.getOAuthState(state);
    if (!record) {
      throw new ContextLayerError("OAuth state not found or already used.", 400);
    }

    await this.repository.deleteOAuthState(state);

    if (record.provider !== provider) {
      throw new ContextLayerError("OAuth state provider mismatch.", 400);
    }

    if (record.expiresAt <= nowIso()) {
      throw new ContextLayerError("OAuth state has expired. Try connecting again.", 400);
    }

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


  async registerIntegration(
    spec: Omit<IntegrationSpec, "functions"> & {
      functions?: Record<string, FunctionSpec>;
    },
  ) {
    await this.initialize();
    const integration: IntegrationSpec = {
      ...spec,
      functions: normalizeFunctions(spec.functions ?? {}),
    };
    return this.repository.upsertIntegration(integration);
  }

  async addFunction(integrationKey: string, functionSpec: FunctionSpec) {
    const integration = await this.getIntegration(integrationKey);
    integration.functions[functionSpec.name] =
      normalizeFunctionSpec(functionSpec);
    await this.repository.upsertIntegration(integration);
    return integration.functions[functionSpec.name];
  }

  async setIntegrationEnabled(integrationKey: string, enabled: boolean) {
    const integration = await this.getIntegration(integrationKey);
    integration.enabled = enabled;
    return this.repository.upsertIntegration(integration);
  }

  async setFunctionEnabled(
    integrationKey: string,
    functionName: string,
    enabled: boolean,
  ) {
    const integration = await this.getIntegration(integrationKey);
    const functionSpec = integration.functions[functionName];

    if (!functionSpec) {
      throw new ContextLayerError(
        `Unknown function '${functionName}' for integration '${integrationKey}'.`,
        404,
      );
    }

    functionSpec.enabled = enabled;
    functionSpec.accessMode = enabled
      ? functionSpec.accessMode === "disabled"
        ? "enabled"
        : getFunctionAccessMode(functionSpec)
      : "disabled";
    await this.repository.upsertIntegration(integration);
    return functionSpec;
  }

  async upsertAgentPolicy(agentClass: string, rules: PolicyRule[]) {
    await this.initialize();
    const policy: AgentClassPolicy = { agentClass, rules };
    return this.repository.upsertPolicy(policy);
  }

  async evaluateAccess(
    agentId: string,
    agentClass: string,
    integrationKey: string,
    functionName: string,
    requestedScopes: string[] = [],
  ): Promise<AccessDecision> {
    const integration = await this.getIntegration(integrationKey);
    const functionSpec = integration.functions[functionName];

    if (!functionSpec) {
      throw new ContextLayerError(
        `Unknown function '${functionName}' for integration '${integrationKey}'.`,
        404,
      );
    }

    const effectiveScopes = unique(
      requestedScopes.length > 0 ? requestedScopes : functionSpec.defaultScopes,
    );
    const accessMode = getFunctionAccessMode(functionSpec);

    if (!integration.enabled) {
      return {
        allowed: false,
        reason: "Integration disabled",
        effectiveScopes,
      };
    }

    if (!functionSpec.enabled || accessMode === "disabled") {
      return { allowed: false, reason: "Function disabled", effectiveScopes };
    }

    const activeGrant = (await this.repository.listTemporaryGrants()).find(
      (grant) => {
        if (
          grant.agentId !== agentId ||
          grant.agentClass !== agentClass ||
          grant.integrationKey !== integrationKey ||
          grant.functionName !== functionName
        ) {
          return false;
        }

        if (grant.expiresAt <= nowIso()) {
          return false;
        }

        return (
          grant.scopes.length === 0 ||
          effectiveScopes.every((scope) => grant.scopes.includes(scope))
        );
      },
    );

    if (accessMode === "approval_required") {
      if (activeGrant) {
        return {
          allowed: true,
          reason: "Allowed by temporary approval",
          effectiveScopes,
        };
      }

      return { allowed: false, reason: "Permission required", effectiveScopes };
    }

    const policy = await this.repository.getPolicy(agentClass);
    if (policy) {
      for (const rule of policy.rules) {
        if (rule.integrationKey !== integrationKey) {
          continue;
        }

        const fineGrained =
          integration.fineGrainedPermissions &&
          functionSpec.fineGrainedPermissions;
        if (permittedByRule(rule, functionName, effectiveScopes, fineGrained)) {
          return {
            allowed: true,
            reason: "Allowed by agent class policy",
            effectiveScopes,
          };
        }
      }
    }

    if (activeGrant) {
      return {
        allowed: true,
        reason: "Allowed by temporary approval",
        effectiveScopes,
      };
    }

    return { allowed: false, reason: "Permission required", effectiveScopes };
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
    agentId: string,
    agentClass: string,
    integrationKey: string,
    functionName: string,
    payload: Record<string, unknown> = {},
    requestedScopes: string[] = [],
    options: {
      ownerId?: string;
    } = {},
  ): Promise<ContextInvocationResult> {
    const integration = await this.getIntegration(integrationKey);
    const functionSpec = integration.functions[functionName];
    if (!functionSpec) {
      throw new ContextLayerError(
        `Unknown function '${functionName}' for integration '${integrationKey}'.`,
        404,
      );
    }

    const decision = await this.evaluateAccess(
      agentId,
      agentClass,
      integrationKey,
      functionName,
      requestedScopes,
    );
    if (!decision.allowed) {
      throw new ContextLayerError(decision.reason, 403);
    }

    const resolvedIntegration = await this.resolveIntegrationForOwner(
      integration,
      options.ownerId,
    );

    const data =
      functionSpec.executionMode === "mock"
        ? await this.adapters.invoke("mock", {
            agentId,
            integration: resolvedIntegration,
            functionSpec,
            payload,
          })
        : await this.adapters.invoke(resolvedIntegration.provider, {
            agentId,
            integration: resolvedIntegration,
            functionSpec,
            payload,
          });

    return {
      integration: resolvedIntegration.key,
      function: functionSpec.name,
      provider: resolvedIntegration.provider,
      kind: resolvedIntegration.kind,
      authStrategy: resolvedIntegration.authStrategy,
      decision,
      data,
    };
  }

  private async refreshOAuthConnection(record: IntegrationConnectionRecord) {
    const provider = getOAuthProvider(record.provider);
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
        const builtInSlug =
          (integration.config.builtInSlug as string | undefined) ?? integration.key;
        const connector = getBuiltInConnectorDefinition(builtInSlug);
        throw new ContextLayerError(
          `Connect ${connector?.name ?? integration.name} for this user before invoking '${integration.key}'.`,
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


  private async getIntegration(key: string) {
    await this.initialize();
    const integration = await this.repository.getIntegration(key);
    if (!integration) {
      throw new ContextLayerError(`Unknown integration '${key}'.`, 404);
    }
    return integration;
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
