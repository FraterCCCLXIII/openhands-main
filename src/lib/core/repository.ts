import type {
  AccessRequest,
  AgentApiKeyRecord,
  AgentClassPolicy,
  IntegrationConnectionRecord,
  IntegrationSpec,
  NotificationRecord,
  OAuthStateRecord,
  TemporaryGrant,
} from "@/src/types/context-layer";

export interface ContextRepository {
  ensureSchema(): Promise<void>;
  listIntegrations(): Promise<IntegrationSpec[]>;
  getIntegration(key: string): Promise<IntegrationSpec | null>;
  upsertIntegration(spec: IntegrationSpec): Promise<IntegrationSpec>;
  upsertPolicy(policy: AgentClassPolicy): Promise<AgentClassPolicy>;
  getPolicy(agentClass: string): Promise<AgentClassPolicy | null>;
  listAccessRequests(): Promise<AccessRequest[]>;
  getAccessRequest(id: string): Promise<AccessRequest | null>;
  createAccessRequest(request: AccessRequest): Promise<AccessRequest>;
  updateAccessRequest(request: AccessRequest): Promise<AccessRequest>;
  listTemporaryGrants(): Promise<TemporaryGrant[]>;
  saveTemporaryGrant(grant: TemporaryGrant): Promise<TemporaryGrant>;
  purgeExpiredGrants(nowIso: string): Promise<number>;
  listNotifications(): Promise<NotificationRecord[]>;
  createNotification(notification: NotificationRecord): Promise<NotificationRecord>;
  getAgentApiKeyByOwner(ownerId: string): Promise<AgentApiKeyRecord | null>;
  findAgentApiKey(apiKey: string): Promise<AgentApiKeyRecord | null>;
  saveAgentApiKey(record: AgentApiKeyRecord): Promise<AgentApiKeyRecord>;
  hasAgentApiKeys(): Promise<boolean>;
  listIntegrationConnections(ownerId: string): Promise<IntegrationConnectionRecord[]>;
  getIntegrationConnection(
    ownerId: string,
    integrationKey: string,
  ): Promise<IntegrationConnectionRecord | null>;
  upsertIntegrationConnection(
    record: IntegrationConnectionRecord,
  ): Promise<IntegrationConnectionRecord>;
  saveOAuthState(record: OAuthStateRecord): Promise<OAuthStateRecord>;
  getOAuthState(state: string): Promise<OAuthStateRecord | null>;
  deleteOAuthState(state: string): Promise<void>;
}
