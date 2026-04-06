import { neon } from "@neondatabase/serverless";

import type {
  AccessRequest,
  AdminApiKeyRecord,
  AgentApiKeyRecord,
  AgentClassPolicy,
  ToolUsageSummary,
  IntegrationConnectionRecord,
  IntegrationSpec,
  ManagedConnectorRecord,
  NotificationRecord,
  OAuthStateRecord,
  TemporaryGrant,
  ToolInvocationRecord,
  UserApiKeyRecord,
} from "@/src/types/context-layer";
import type { ContextRepository } from "@/src/lib/core/repository";
import {
  mapAccessRequestRow,
  mapAdminApiKeyRow,
  mapAgentApiKeyRow,
  mapToolUsageSummaryRow,
  mapIntegrationConnectionRow,
  mapIntegrationRow,
  mapManagedConnectorRow,
  mapNotificationRow,
  mapOAuthStateRow,
  mapPolicyRow,
  mapTemporaryGrantRow,
  mapUserApiKeyRow,
} from "@/src/lib/db/postgres-records";
import { initializePostgresSchema } from "@/src/lib/db/postgres-schema";

const getSql = () => {
  const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("POSTGRES_URL or DATABASE_URL must be configured for PostgresRepository.");
  }

  return neon(databaseUrl);
};

export class PostgresRepository implements ContextRepository {
  private schemaReady = false;
  private schemaInitPromise?: Promise<void>;

  async ensureSchema() {
    if (this.schemaReady) {
      return;
    }

    if (!this.schemaInitPromise) {
      this.schemaInitPromise = this.initializeSchema().finally(() => {
        this.schemaInitPromise = undefined;
      });
    }

    await this.schemaInitPromise;
  }

  private async initializeSchema() {
    await initializePostgresSchema(getSql());
    this.schemaReady = true;
  }

  async listOwnerIntegrations(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM owner_integrations
      WHERE owner_id = ${ownerId}
      ORDER BY key ASC
    `;
    return rows.map((row) => mapIntegrationRow(row));
  }

  async getOwnerIntegration(ownerId: string, integrationKey: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM owner_integrations
      WHERE owner_id = ${ownerId} AND key = ${integrationKey}
    `;
    const row = rows[0];
    return row ? mapIntegrationRow(row) : null;
  }

  async upsertOwnerIntegration(ownerId: string, spec: IntegrationSpec) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO owner_integrations (
        owner_id, key, name, kind, provider, auth_strategy, enabled,
        fine_grained_permissions, config, credentials, functions, created_at, updated_at
      )
      VALUES (
        ${ownerId}, ${spec.key}, ${spec.name}, ${spec.kind}, ${spec.provider}, ${spec.authStrategy}, ${spec.enabled},
        ${spec.fineGrainedPermissions}, ${JSON.stringify(spec.config)}, ${JSON.stringify(spec.credentials)}, ${JSON.stringify(spec.tools)}, NOW(), NOW()
      )
      ON CONFLICT (owner_id, key) DO UPDATE SET
        name = EXCLUDED.name,
        kind = EXCLUDED.kind,
        provider = EXCLUDED.provider,
        auth_strategy = EXCLUDED.auth_strategy,
        enabled = EXCLUDED.enabled,
        fine_grained_permissions = EXCLUDED.fine_grained_permissions,
        config = EXCLUDED.config,
        credentials = EXCLUDED.credentials,
        functions = EXCLUDED.functions,
        updated_at = NOW()
    `;
    return spec;
  }

  async deleteOwnerIntegration(ownerId: string, integrationKey: string) {
    await this.ensureSchema();
    const sql = getSql();
    await sql.transaction([
      sql`
        DELETE FROM integration_connections
        WHERE owner_id = ${ownerId} AND integration_key = ${integrationKey}
      `,
      sql`
        DELETE FROM owner_integrations
        WHERE owner_id = ${ownerId} AND key = ${integrationKey}
      `,
    ]);
  }

  async upsertPolicy(policy: AgentClassPolicy) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO agent_class_policies (agent_class, rules, updated_at)
      VALUES (${policy.agentClass}, ${JSON.stringify(policy.rules)}, NOW())
      ON CONFLICT (agent_class) DO UPDATE SET rules = EXCLUDED.rules, updated_at = NOW()
    `;
    return policy;
  }

  async getPolicy(agentClass: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM agent_class_policies WHERE agent_class = ${agentClass}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapPolicyRow(row);
  }

  async listAccessRequests() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM access_requests ORDER BY created_at DESC`;
    return rows.map((row) => mapAccessRequestRow(row));
  }

  async getAccessRequest(id: string) {
    const requests = await this.listAccessRequests();
    return requests.find((request) => request.id === id) ?? null;
  }

  async createAccessRequest(request: AccessRequest) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO access_requests (
        id, agent_id, agent_class, integration_key, function_name, scopes,
        requested_minutes, channels, notification_targets, justification, agent_data,
        created_at, status, decided_at, decided_by
      ) VALUES (
        ${request.id}, ${request.agentId ?? null}, ${request.agentClass ?? null}, ${request.integrationKey}, ${request.toolName}, ${JSON.stringify(request.scopes)},
        ${request.requestedMinutes}, ${JSON.stringify(request.channels)}, ${JSON.stringify(request.notificationTargets)}, ${request.justification ?? ""}, ${JSON.stringify(request.agentData ?? {})},
        ${request.createdAt}, ${request.status}, ${request.decidedAt ?? null}, ${request.decidedBy ?? null}
      )
    `;
    return request;
  }

  async updateAccessRequest(request: AccessRequest) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      UPDATE access_requests
      SET
        agent_id = ${request.agentId ?? null},
        agent_class = ${request.agentClass ?? null},
        integration_key = ${request.integrationKey},
        function_name = ${request.toolName},
        scopes = ${JSON.stringify(request.scopes)},
        requested_minutes = ${request.requestedMinutes},
        channels = ${JSON.stringify(request.channels)},
        notification_targets = ${JSON.stringify(request.notificationTargets)},
        justification = ${request.justification ?? ""},
        agent_data = ${JSON.stringify(request.agentData ?? {})},
        created_at = ${request.createdAt},
        status = ${request.status},
        decided_at = ${request.decidedAt ?? null},
        decided_by = ${request.decidedBy ?? null}
      WHERE id = ${request.id}
    `;
    return request;
  }

  async listTemporaryGrants() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM temporary_grants ORDER BY created_at DESC`;
    return rows.map((row) => mapTemporaryGrantRow(row));
  }

  async saveTemporaryGrant(grant: TemporaryGrant) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO temporary_grants (
        id, agent_id, agent_class, integration_key, function_name, scopes, granted_by, created_at, expires_at
      ) VALUES (
        ${grant.id}, ${grant.agentId ?? null}, ${grant.agentClass ?? null}, ${grant.integrationKey}, ${grant.toolName}, ${JSON.stringify(grant.scopes)}, ${grant.grantedBy}, ${grant.createdAt}, ${grant.expiresAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        agent_id = EXCLUDED.agent_id,
        agent_class = EXCLUDED.agent_class,
        integration_key = EXCLUDED.integration_key,
        function_name = EXCLUDED.function_name,
        scopes = EXCLUDED.scopes,
        granted_by = EXCLUDED.granted_by,
        created_at = EXCLUDED.created_at,
        expires_at = EXCLUDED.expires_at
    `;
    return grant;
  }

  async purgeExpiredGrants(nowIso: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`DELETE FROM temporary_grants WHERE expires_at <= ${nowIso} RETURNING id`;
    return rows.length;
  }

  async createToolInvocation(record: ToolInvocationRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO tool_invocations (
        id, owner_id, agent_id, agent_class, integration_key, function_name,
        scopes, provider, kind, auth_strategy, outcome, invoked_at, duration_ms,
        payload_keys, error_message
      ) VALUES (
        ${record.id}, ${record.ownerId ?? null}, ${record.agentId ?? null}, ${record.agentClass ?? null}, ${record.integrationKey}, ${record.toolName},
        ${JSON.stringify(record.scopes)}, ${record.provider}, ${record.kind}, ${record.authStrategy}, ${record.outcome}, ${record.invokedAt}, ${record.durationMs ?? null},
        ${JSON.stringify(record.payloadKeys)}, ${record.errorMessage ?? null}
      )
    `;
    return record;
  }

  async listOwnerToolUsageSummaries(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT
        integration_key,
        function_name,
        COUNT(*)::int AS invocation_count,
        MAX(invoked_at) AS last_invoked_at,
        (ARRAY_AGG(outcome ORDER BY invoked_at DESC))[1] AS last_invocation_outcome
      FROM tool_invocations
      WHERE owner_id = ${ownerId}
      GROUP BY integration_key, function_name
      ORDER BY integration_key ASC, function_name ASC
    `;

    return rows.map((row) => mapToolUsageSummaryRow(row));
  }

  async listNotifications() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM notifications ORDER BY created_at DESC`;
    return rows.map((row) => mapNotificationRow(row));
  }

  async createNotification(notification: NotificationRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO notifications (id, channel, recipient, subject, body, metadata, created_at)
      VALUES (
        ${notification.id}, ${notification.channel}, ${notification.recipient}, ${notification.subject}, ${notification.body}, ${JSON.stringify(notification.metadata)}, ${notification.createdAt}
      )
    `;
    return notification;
  }

  async getAgentApiKeyByOwner(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM agent_api_keys WHERE owner_id = ${ownerId}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapAgentApiKeyRow(row);
  }

  async findAgentApiKey(apiKey: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM agent_api_keys WHERE api_key = ${apiKey}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapAgentApiKeyRow(row);
  }

  async saveAgentApiKey(record: AgentApiKeyRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO agent_api_keys (owner_id, api_key, created_at, updated_at)
      VALUES (${record.ownerId}, ${record.apiKey}, ${record.createdAt}, ${record.updatedAt})
      ON CONFLICT (owner_id) DO UPDATE SET
        api_key = EXCLUDED.api_key,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `;
    return record;
  }

  async getUserApiKeyByOwner(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM user_api_keys WHERE owner_id = ${ownerId}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapUserApiKeyRow(row);
  }

  async findUserApiKeyByHash(apiKeyHash: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM user_api_keys WHERE api_key_hash = ${apiKeyHash}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapUserApiKeyRow(row);
  }

  async saveUserApiKey(record: UserApiKeyRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO user_api_keys (
        owner_id,
        api_key_hash,
        key_prefix,
        key_suffix,
        encrypted_api_key,
        created_at,
        updated_at
      )
      VALUES (
        ${record.ownerId},
        ${record.apiKeyHash},
        ${record.keyPrefix},
        ${record.keySuffix},
        ${record.encryptedApiKey ?? null},
        ${record.createdAt},
        ${record.updatedAt}
      )
      ON CONFLICT (owner_id) DO UPDATE SET
        api_key_hash = EXCLUDED.api_key_hash,
        key_prefix = EXCLUDED.key_prefix,
        key_suffix = EXCLUDED.key_suffix,
        encrypted_api_key = EXCLUDED.encrypted_api_key,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `;
    return record;
  }

  async deleteUserApiKey(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM user_api_keys WHERE owner_id = ${ownerId}`;
  }

  async getAdminApiKeyByOwner(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM admin_api_keys WHERE owner_id = ${ownerId}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapAdminApiKeyRow(row);
  }

  async findAdminApiKeyByHash(apiKeyHash: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM admin_api_keys WHERE api_key_hash = ${apiKeyHash}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapAdminApiKeyRow(row);
  }

  async saveAdminApiKey(record: AdminApiKeyRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO admin_api_keys (
        owner_id,
        api_key_hash,
        key_prefix,
        key_suffix,
        encrypted_api_key,
        created_at,
        updated_at
      )
      VALUES (
        ${record.ownerId},
        ${record.apiKeyHash},
        ${record.keyPrefix},
        ${record.keySuffix},
        ${record.encryptedApiKey ?? null},
        ${record.createdAt},
        ${record.updatedAt}
      )
      ON CONFLICT (owner_id) DO UPDATE SET
        api_key_hash = EXCLUDED.api_key_hash,
        key_prefix = EXCLUDED.key_prefix,
        key_suffix = EXCLUDED.key_suffix,
        encrypted_api_key = EXCLUDED.encrypted_api_key,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `;
    return record;
  }

  async deleteAdminApiKey(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM admin_api_keys WHERE owner_id = ${ownerId}`;
  }

  async hasAgentApiKeys() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT 1 FROM agent_api_keys LIMIT 1`;
    return rows.length > 0;
  }

  async listManagedConnectors() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM managed_connectors ORDER BY slug ASC`;
    return rows.map((row) => mapManagedConnectorRow(row));
  }

  async getManagedConnector(slug: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM managed_connectors WHERE slug = ${slug}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapManagedConnectorRow(row);
  }

  async upsertManagedConnector(record: ManagedConnectorRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO managed_connectors (
        slug, name, description, logo_url, app_url, docs_url, categories,
        auth_modes, auth_strategy, provider, credential_label, credential_placeholder,
        credential_help, api_base_url, server_url, open_api_url, oauth_config,
        encrypted_oauth_client, functions, enabled, created_at, updated_at
      ) VALUES (
        ${record.slug}, ${record.name}, ${record.description}, ${record.logoUrl ?? null}, ${record.appUrl ?? null}, ${record.docsUrl ?? null}, ${JSON.stringify(record.categories)},
        ${JSON.stringify(record.authModes)}, ${record.authStrategy}, ${record.provider ?? null}, ${record.credentialLabel}, ${record.credentialPlaceholder},
        ${record.credentialHelp}, ${record.apiBaseUrl ?? ""}, ${record.serverUrl ?? null}, ${record.openApiUrl ?? null}, ${record.oauthConfig ? JSON.stringify(record.oauthConfig) : null},
        ${record.encryptedOAuthClient ?? null}, ${JSON.stringify(record.tools)}, ${record.enabled}, ${record.createdAt}, ${record.updatedAt}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        logo_url = EXCLUDED.logo_url,
        app_url = EXCLUDED.app_url,
        docs_url = EXCLUDED.docs_url,
        categories = EXCLUDED.categories,
        auth_modes = EXCLUDED.auth_modes,
        auth_strategy = EXCLUDED.auth_strategy,
        provider = EXCLUDED.provider,
        credential_label = EXCLUDED.credential_label,
        credential_placeholder = EXCLUDED.credential_placeholder,
        credential_help = EXCLUDED.credential_help,
        api_base_url = EXCLUDED.api_base_url,
        server_url = EXCLUDED.server_url,
        open_api_url = EXCLUDED.open_api_url,
        oauth_config = EXCLUDED.oauth_config,
        encrypted_oauth_client = EXCLUDED.encrypted_oauth_client,
        functions = EXCLUDED.functions,
        enabled = EXCLUDED.enabled,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `;
    return record;
  }

  async deleteManagedConnector(slug: string) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM managed_connectors WHERE slug = ${slug}`;
  }

  async listIntegrationConnections(ownerId: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM integration_connections
      WHERE owner_id = ${ownerId}
      ORDER BY integration_key ASC
    `;
    return rows.map((row) => mapIntegrationConnectionRow(row));
  }

  async getIntegrationConnection(ownerId: string, integrationKey: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM integration_connections
      WHERE owner_id = ${ownerId} AND integration_key = ${integrationKey}
    `;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapIntegrationConnectionRow(row);
  }

  async upsertIntegrationConnection(record: IntegrationConnectionRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO integration_connections (
        owner_id, integration_key, provider, auth_strategy, encrypted_credentials,
        token_type, scopes, expires_at, external_account_id, external_workspace_id,
        display_name, metadata, created_at, updated_at
      ) VALUES (
        ${record.ownerId}, ${record.integrationKey}, ${record.provider}, ${record.authStrategy}, ${record.encryptedCredentials},
        ${record.tokenType ?? null}, ${JSON.stringify(record.scopes)}, ${record.expiresAt ?? null}, ${record.externalAccountId ?? null}, ${record.externalWorkspaceId ?? null},
        ${record.displayName ?? null}, ${JSON.stringify(record.metadata)}, ${record.createdAt}, ${record.updatedAt}
      )
      ON CONFLICT (owner_id, integration_key) DO UPDATE SET
        provider = EXCLUDED.provider,
        auth_strategy = EXCLUDED.auth_strategy,
        encrypted_credentials = EXCLUDED.encrypted_credentials,
        token_type = EXCLUDED.token_type,
        scopes = EXCLUDED.scopes,
        expires_at = EXCLUDED.expires_at,
        external_account_id = EXCLUDED.external_account_id,
        external_workspace_id = EXCLUDED.external_workspace_id,
        display_name = EXCLUDED.display_name,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `;
    return record;
  }

  async saveOAuthState(record: OAuthStateRecord) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO oauth_states (
        state, owner_id, integration_key, provider, code_verifier, redirect_to, redirect_uri, callback_url, created_at, expires_at
      ) VALUES (
        ${record.state}, ${record.ownerId}, ${record.integrationKey}, ${record.provider}, ${record.codeVerifier ?? null}, ${record.redirectTo}, ${record.redirectUri ?? null}, ${record.callbackUrl ?? null}, ${record.createdAt}, ${record.expiresAt}
      )
      ON CONFLICT (state) DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        integration_key = EXCLUDED.integration_key,
        provider = EXCLUDED.provider,
        code_verifier = EXCLUDED.code_verifier,
        redirect_to = EXCLUDED.redirect_to,
        redirect_uri = EXCLUDED.redirect_uri,
        callback_url = EXCLUDED.callback_url,
        created_at = EXCLUDED.created_at,
        expires_at = EXCLUDED.expires_at
    `;
    return record;
  }

  async getOAuthState(state: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM oauth_states WHERE state = ${state}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapOAuthStateRow(row);
  }

  async deleteOAuthState(state: string) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM oauth_states WHERE state = ${state}`;
  }
}
