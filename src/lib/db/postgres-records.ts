import type {
  AccessRequest,
  AdminApiKeyRecord,
  AgentApiKeyRecord,
  AgentClassPolicy,
  FunctionUsageSummary,
  IntegrationConnectionRecord,
  IntegrationSpec,
  ManagedConnectorRecord,
  NotificationRecord,
  OAuthStateRecord,
  TemporaryGrant,
  UserApiKeyRecord,
} from "@/src/types/context-layer";

export type PostgresRow = Record<string, unknown>;

export const parseJson = <T>(value: unknown): T => {
  if (value == null) {
    return {} as T;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
};

const toDate = (value: unknown) =>
  value instanceof Date ? value : new Date(String(value));

const toIsoString = (value: unknown) => toDate(value).toISOString();
const toOptionalIsoString = (value: unknown) =>
  value == null ? undefined : toDate(value).toISOString();
const toOptionalString = (value: unknown) =>
  value == null ? undefined : String(value);

export const mapIntegrationRow = (row: PostgresRow): IntegrationSpec => ({
  key: String(row.key),
  name: String(row.name),
  kind: String(row.kind) as IntegrationSpec["kind"],
  provider: String(row.provider) as IntegrationSpec["provider"],
  authStrategy: String(row.auth_strategy) as IntegrationSpec["authStrategy"],
  enabled: Boolean(row.enabled),
  fineGrainedPermissions: Boolean(row.fine_grained_permissions),
  config: parseJson<Record<string, unknown>>(row.config),
  credentials: parseJson<Record<string, unknown>>(row.credentials),
  functions: parseJson<IntegrationSpec["functions"]>(row.functions),
});

export const mapPolicyRow = (row: PostgresRow): AgentClassPolicy => ({
  agentClass: String(row.agent_class),
  rules: parseJson<AgentClassPolicy["rules"]>(row.rules),
});

export const mapAccessRequestRow = (row: PostgresRow): AccessRequest => ({
  id: String(row.id),
  agentId: row.agent_id == null ? null : String(row.agent_id),
  agentClass: row.agent_class == null ? null : String(row.agent_class),
  integrationKey: String(row.integration_key),
  functionName: String(row.function_name),
  scopes: parseJson<string[]>(row.scopes),
  requestedMinutes: Number(row.requested_minutes),
  channels: parseJson<AccessRequest["channels"]>(row.channels),
  notificationTargets: parseJson<Record<string, string>>(row.notification_targets),
  justification: String(row.justification ?? ""),
  agentData: parseJson<AccessRequest["agentData"]>(row.agent_data),
  createdAt: toIsoString(row.created_at),
  status: String(row.status) as AccessRequest["status"],
  decidedAt: toOptionalIsoString(row.decided_at),
  decidedBy: toOptionalString(row.decided_by),
});

export const mapTemporaryGrantRow = (row: PostgresRow): TemporaryGrant => ({
  id: String(row.id),
  agentId: row.agent_id == null ? null : String(row.agent_id),
  agentClass: row.agent_class == null ? null : String(row.agent_class),
  integrationKey: String(row.integration_key),
  functionName: String(row.function_name),
  scopes: parseJson<string[]>(row.scopes),
  grantedBy: String(row.granted_by),
  createdAt: toIsoString(row.created_at),
  expiresAt: toIsoString(row.expires_at),
});

export const mapFunctionUsageSummaryRow = (
  row: PostgresRow,
): FunctionUsageSummary => ({
  integrationKey: String(row.integration_key),
  functionName: String(row.function_name),
  lastInvokedAt: toIsoString(row.last_invoked_at),
  lastInvocationOutcome: String(
    row.last_invocation_outcome,
  ) as FunctionUsageSummary["lastInvocationOutcome"],
  invocationCount: Number(row.invocation_count),
});

export const mapNotificationRow = (row: PostgresRow): NotificationRecord => ({
  id: String(row.id),
  channel: String(row.channel) as NotificationRecord["channel"],
  recipient: String(row.recipient),
  subject: String(row.subject),
  body: String(row.body),
  metadata: parseJson<Record<string, unknown>>(row.metadata),
  createdAt: toIsoString(row.created_at),
});

export const mapAgentApiKeyRow = (row: PostgresRow): AgentApiKeyRecord => ({
  ownerId: String(row.owner_id),
  apiKey: String(row.api_key),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

export const mapUserApiKeyRow = (row: PostgresRow): UserApiKeyRecord => ({
  ownerId: String(row.owner_id),
  apiKeyHash: String(row.api_key_hash),
  keyPrefix: String(row.key_prefix),
  keySuffix: String(row.key_suffix ?? ""),
  encryptedApiKey: row.encrypted_api_key == null ? null : String(row.encrypted_api_key),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

export const mapAdminApiKeyRow = (row: PostgresRow): AdminApiKeyRecord => ({
  ownerId: String(row.owner_id),
  apiKeyHash: String(row.api_key_hash),
  keyPrefix: String(row.key_prefix),
  keySuffix: String(row.key_suffix ?? ""),
  encryptedApiKey: row.encrypted_api_key == null ? null : String(row.encrypted_api_key),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

export const mapManagedConnectorRow = (
  row: PostgresRow,
): ManagedConnectorRecord => ({
  slug: String(row.slug),
  name: String(row.name),
  description: String(row.description),
  logoUrl: toOptionalString(row.logo_url),
  appUrl: toOptionalString(row.app_url),
  docsUrl: toOptionalString(row.docs_url),
  categories: parseJson<string[]>(row.categories),
  authModes: parseJson<ManagedConnectorRecord["authModes"]>(row.auth_modes),
  authStrategy: String(row.auth_strategy) as ManagedConnectorRecord["authStrategy"],
  provider: toOptionalString(row.provider) as ManagedConnectorRecord["provider"],
  oauthConfigured: Boolean(row.encrypted_oauth_client),
  credentialLabel: String(row.credential_label),
  credentialPlaceholder: String(row.credential_placeholder),
  credentialHelp: String(row.credential_help),
  apiBaseUrl: String(row.api_base_url),
  serverUrl: toOptionalString(row.server_url),
  openApiUrl: toOptionalString(row.open_api_url),
  oauthConfig: row.oauth_config
    ? parseJson<ManagedConnectorRecord["oauthConfig"]>(row.oauth_config)
    : undefined,
  encryptedOAuthClient: toOptionalString(row.encrypted_oauth_client),
  functions: parseJson<ManagedConnectorRecord["functions"]>(row.functions),
  enabled: Boolean(row.enabled),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

export const mapIntegrationConnectionRow = (
  row: PostgresRow,
): IntegrationConnectionRecord => ({
  ownerId: String(row.owner_id),
  integrationKey: String(row.integration_key),
  provider: String(row.provider),
  authStrategy: String(row.auth_strategy) as IntegrationConnectionRecord["authStrategy"],
  encryptedCredentials: String(row.encrypted_credentials),
  tokenType: toOptionalString(row.token_type),
  scopes: parseJson<string[]>(row.scopes),
  expiresAt: toOptionalIsoString(row.expires_at),
  externalAccountId: toOptionalString(row.external_account_id),
  externalWorkspaceId: toOptionalString(row.external_workspace_id),
  displayName: toOptionalString(row.display_name),
  metadata: parseJson<Record<string, unknown>>(row.metadata),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

export const mapOAuthStateRow = (row: PostgresRow): OAuthStateRecord => ({
  state: String(row.state),
  ownerId: String(row.owner_id),
  integrationKey: String(row.integration_key),
  provider: String(row.provider),
  codeVerifier: toOptionalString(row.code_verifier),
  redirectTo: String(row.redirect_to),
  redirectUri: toOptionalString(row.redirect_uri),
  callbackUrl: toOptionalString(row.callback_url),
  createdAt: toIsoString(row.created_at),
  expiresAt: toIsoString(row.expires_at),
});
