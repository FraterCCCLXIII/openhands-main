import type {
  AccessRequest,
  AgentApiKeyRecord,
  AgentClassPolicy,
  IntegrationConnectionRecord,
  IntegrationSpec,
  ManagedConnectorRecord,
  NotificationRecord,
  OAuthStateRecord,
  TemporaryGrant,
} from "@/src/types/context-layer";
import type { ContextRepository } from "@/src/lib/core/repository";

export class MemoryRepository implements ContextRepository {
  private readonly integrations = new Map<string, IntegrationSpec>();
  private readonly ownerIntegrations = new Map<string, IntegrationSpec>();
  private readonly policies = new Map<string, AgentClassPolicy>();
  private readonly accessRequests = new Map<string, AccessRequest>();
  private readonly temporaryGrants = new Map<string, TemporaryGrant>();
  private readonly notifications = new Map<string, NotificationRecord>();
  private readonly agentApiKeysByOwner = new Map<string, AgentApiKeyRecord>();
  private readonly agentApiKeysByValue = new Map<string, AgentApiKeyRecord>();
  private readonly integrationConnections = new Map<
    string,
    IntegrationConnectionRecord
  >();
  private readonly managedConnectors = new Map<string, ManagedConnectorRecord>();
  private readonly oauthStates = new Map<string, OAuthStateRecord>();

  async ensureSchema() {}

  async listIntegrations() {
    return [...this.integrations.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  async getIntegration(key: string) {
    return this.integrations.get(key) ?? null;
  }

  async upsertIntegration(spec: IntegrationSpec) {
    this.integrations.set(spec.key, spec);
    return spec;
  }

  async listOwnerIntegrations(ownerId: string) {
    return [...this.ownerIntegrations.entries()]
      .filter(([key]) => key.startsWith(`${ownerId}:`))
      .map(([, integration]) => integration)
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  async getOwnerIntegration(ownerId: string, integrationKey: string) {
    return this.ownerIntegrations.get(`${ownerId}:${integrationKey}`) ?? null;
  }

  async upsertOwnerIntegration(ownerId: string, spec: IntegrationSpec) {
    this.ownerIntegrations.set(`${ownerId}:${spec.key}`, spec);
    return spec;
  }

  async upsertPolicy(policy: AgentClassPolicy) {
    this.policies.set(policy.agentClass, policy);
    return policy;
  }

  async getPolicy(agentClass: string) {
    return this.policies.get(agentClass) ?? null;
  }

  async listAccessRequests() {
    return [...this.accessRequests.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAccessRequest(id: string) {
    return this.accessRequests.get(id) ?? null;
  }

  async createAccessRequest(request: AccessRequest) {
    this.accessRequests.set(request.id, request);
    return request;
  }

  async updateAccessRequest(request: AccessRequest) {
    this.accessRequests.set(request.id, request);
    return request;
  }

  async listTemporaryGrants() {
    return [...this.temporaryGrants.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveTemporaryGrant(grant: TemporaryGrant) {
    this.temporaryGrants.set(grant.id, grant);
    return grant;
  }

  async purgeExpiredGrants(nowIso: string) {
    let removed = 0;
    for (const [grantId, grant] of this.temporaryGrants) {
      if (grant.expiresAt <= nowIso) {
        this.temporaryGrants.delete(grantId);
        removed += 1;
      }
    }
    return removed;
  }

  async listNotifications() {
    return [...this.notifications.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createNotification(notification: NotificationRecord) {
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async getAgentApiKeyByOwner(ownerId: string) {
    return this.agentApiKeysByOwner.get(ownerId) ?? null;
  }

  async findAgentApiKey(apiKey: string) {
    return this.agentApiKeysByValue.get(apiKey) ?? null;
  }

  async saveAgentApiKey(record: AgentApiKeyRecord) {
    const existing = this.agentApiKeysByOwner.get(record.ownerId);
    if (existing && existing.apiKey !== record.apiKey) {
      this.agentApiKeysByValue.delete(existing.apiKey);
    }

    this.agentApiKeysByOwner.set(record.ownerId, record);
    this.agentApiKeysByValue.set(record.apiKey, record);
    return record;
  }

  async listManagedConnectors() {
    return [...this.managedConnectors.values()].sort((a, b) =>
      a.slug.localeCompare(b.slug),
    );
  }

  async getManagedConnector(slug: string) {
    return this.managedConnectors.get(slug) ?? null;
  }

  async upsertManagedConnector(record: ManagedConnectorRecord) {
    this.managedConnectors.set(record.slug, record);
    return record;
  }

  async deleteManagedConnector(slug: string) {
    this.managedConnectors.delete(slug);
  }

  async hasAgentApiKeys() {
    return this.agentApiKeysByOwner.size > 0;
  }

  async listIntegrationConnections(ownerId: string) {
    return [...this.integrationConnections.values()]
      .filter((connection) => connection.ownerId === ownerId)
      .sort((a, b) => a.integrationKey.localeCompare(b.integrationKey));
  }

  async getIntegrationConnection(ownerId: string, integrationKey: string) {
    return this.integrationConnections.get(`${ownerId}:${integrationKey}`) ?? null;
  }

  async upsertIntegrationConnection(record: IntegrationConnectionRecord) {
    this.integrationConnections.set(`${record.ownerId}:${record.integrationKey}`, record);
    return record;
  }

  async saveOAuthState(record: OAuthStateRecord) {
    this.oauthStates.set(record.state, record);
    return record;
  }

  async getOAuthState(state: string) {
    return this.oauthStates.get(state) ?? null;
  }

  async deleteOAuthState(state: string) {
    this.oauthStates.delete(state);
  }
}
