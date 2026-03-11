import { neon } from "@neondatabase/serverless";

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

const parseJson = <T>(value: unknown): T => {
  if (value == null) {
    return {} as T;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
};

const getSql = () => {
  const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("POSTGRES_URL or DATABASE_URL must be configured for PostgresRepository.");
  }

  return neon(databaseUrl);
};

const SCHEMA_LOCK_ID = 482190317;

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
    const sql = getSql();

    await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(${SCHEMA_LOCK_ID})`,
      sql`
        CREATE TABLE IF NOT EXISTS integrations (
          key TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          kind TEXT NOT NULL,
          provider TEXT NOT NULL,
          auth_strategy TEXT NOT NULL,
          enabled BOOLEAN NOT NULL,
          fine_grained_permissions BOOLEAN NOT NULL,
          config JSONB NOT NULL DEFAULT '{}'::jsonb,
          credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
          functions JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS agent_class_policies (
          agent_class TEXT PRIMARY KEY,
          rules JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS access_requests (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          agent_class TEXT NOT NULL,
          integration_key TEXT NOT NULL,
          function_name TEXT NOT NULL,
          scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
          requested_minutes INTEGER NOT NULL,
          channels JSONB NOT NULL DEFAULT '[]'::jsonb,
          notification_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
          justification TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL,
          decided_at TIMESTAMPTZ,
          decided_by TEXT
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS temporary_grants (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          agent_class TEXT NOT NULL,
          integration_key TEXT NOT NULL,
          function_name TEXT NOT NULL,
          scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
          granted_by TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          channel TEXT NOT NULL,
          recipient TEXT NOT NULL,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS agent_api_keys (
          owner_id TEXT PRIMARY KEY,
          api_key TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS managed_connectors (
          slug TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          logo_url TEXT,
          app_url TEXT,
          docs_url TEXT,
          categories JSONB NOT NULL DEFAULT '[]'::jsonb,
          auth_modes JSONB NOT NULL DEFAULT '[]'::jsonb,
          auth_strategy TEXT NOT NULL,
          provider TEXT,
          credential_label TEXT NOT NULL,
          credential_placeholder TEXT NOT NULL,
          credential_help TEXT NOT NULL,
          api_base_url TEXT NOT NULL,
          server_url TEXT,
          open_api_url TEXT,
          oauth_config JSONB,
          encrypted_oauth_client TEXT,
          functions JSONB NOT NULL DEFAULT '[]'::jsonb,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS integration_connections (
          owner_id TEXT NOT NULL,
          integration_key TEXT NOT NULL,
          provider TEXT NOT NULL,
          auth_strategy TEXT NOT NULL,
          encrypted_credentials TEXT NOT NULL,
          token_type TEXT,
          scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
          expires_at TIMESTAMPTZ,
          external_account_id TEXT,
          external_workspace_id TEXT,
          display_name TEXT,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          PRIMARY KEY (owner_id, integration_key)
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS oauth_states (
          state TEXT PRIMARY KEY,
          owner_id TEXT NOT NULL,
          integration_key TEXT NOT NULL,
          provider TEXT NOT NULL,
          code_verifier TEXT,
          redirect_to TEXT NOT NULL,
          redirect_uri TEXT,
          callback_url TEXT,
          created_at TIMESTAMPTZ NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `,
      sql`ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS redirect_uri TEXT`,
      sql`ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS callback_url TEXT`,
      sql`ALTER TABLE managed_connectors ADD COLUMN IF NOT EXISTS provider TEXT`,
      sql`ALTER TABLE managed_connectors ADD COLUMN IF NOT EXISTS server_url TEXT`,
      sql`ALTER TABLE managed_connectors ADD COLUMN IF NOT EXISTS open_api_url TEXT`,
    ]);

    this.schemaReady = true;
  }

  async listIntegrations() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM integrations ORDER BY key ASC`;
    return rows.map((row) => ({
      key: row.key,
      name: row.name,
      kind: row.kind,
      provider: row.provider,
      authStrategy: row.auth_strategy,
      enabled: row.enabled,
      fineGrainedPermissions: row.fine_grained_permissions,
      config: parseJson<Record<string, unknown>>(row.config),
      credentials: parseJson<Record<string, unknown>>(row.credentials),
      functions: parseJson<IntegrationSpec["functions"]>(row.functions),
    }));
  }

  async getIntegration(key: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM integrations WHERE key = ${key}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      key: row.key,
      name: row.name,
      kind: row.kind,
      provider: row.provider,
      authStrategy: row.auth_strategy,
      enabled: row.enabled,
      fineGrainedPermissions: row.fine_grained_permissions,
      config: parseJson<Record<string, unknown>>(row.config),
      credentials: parseJson<Record<string, unknown>>(row.credentials),
      functions: parseJson<IntegrationSpec["functions"]>(row.functions),
    };
  }

  async upsertIntegration(spec: IntegrationSpec) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO integrations (
        key, name, kind, provider, auth_strategy, enabled,
        fine_grained_permissions, config, credentials, functions, updated_at
      )
      VALUES (
        ${spec.key}, ${spec.name}, ${spec.kind}, ${spec.provider}, ${spec.authStrategy}, ${spec.enabled},
        ${spec.fineGrainedPermissions}, ${JSON.stringify(spec.config)}, ${JSON.stringify(spec.credentials)}, ${JSON.stringify(spec.functions)}, NOW()
      )
      ON CONFLICT (key) DO UPDATE SET
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
    return {
      agentClass: row.agent_class,
      rules: parseJson<AgentClassPolicy["rules"]>(row.rules),
    };
  }

  async listAccessRequests() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM access_requests ORDER BY created_at DESC`;
    return rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
      agentClass: row.agent_class,
      integrationKey: row.integration_key,
      functionName: row.function_name,
      scopes: parseJson<string[]>(row.scopes),
      requestedMinutes: row.requested_minutes,
      channels: parseJson<AccessRequest["channels"]>(row.channels),
      notificationTargets: parseJson<Record<string, string>>(row.notification_targets),
      justification: row.justification,
      createdAt: new Date(row.created_at).toISOString(),
      status: row.status,
      decidedAt: row.decided_at ? new Date(row.decided_at).toISOString() : undefined,
      decidedBy: row.decided_by ?? undefined,
    }));
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
        requested_minutes, channels, notification_targets, justification,
        created_at, status, decided_at, decided_by
      ) VALUES (
        ${request.id}, ${request.agentId}, ${request.agentClass}, ${request.integrationKey}, ${request.functionName}, ${JSON.stringify(request.scopes)},
        ${request.requestedMinutes}, ${JSON.stringify(request.channels)}, ${JSON.stringify(request.notificationTargets)}, ${request.justification ?? ""},
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
        agent_id = ${request.agentId},
        agent_class = ${request.agentClass},
        integration_key = ${request.integrationKey},
        function_name = ${request.functionName},
        scopes = ${JSON.stringify(request.scopes)},
        requested_minutes = ${request.requestedMinutes},
        channels = ${JSON.stringify(request.channels)},
        notification_targets = ${JSON.stringify(request.notificationTargets)},
        justification = ${request.justification ?? ""},
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
    return rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
      agentClass: row.agent_class,
      integrationKey: row.integration_key,
      functionName: row.function_name,
      scopes: parseJson<string[]>(row.scopes),
      grantedBy: row.granted_by,
      createdAt: new Date(row.created_at).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString(),
    }));
  }

  async saveTemporaryGrant(grant: TemporaryGrant) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO temporary_grants (
        id, agent_id, agent_class, integration_key, function_name, scopes, granted_by, created_at, expires_at
      ) VALUES (
        ${grant.id}, ${grant.agentId}, ${grant.agentClass}, ${grant.integrationKey}, ${grant.functionName}, ${JSON.stringify(grant.scopes)}, ${grant.grantedBy}, ${grant.createdAt}, ${grant.expiresAt}
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

  async listNotifications() {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM notifications ORDER BY created_at DESC`;
    return rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      recipient: row.recipient,
      subject: row.subject,
      body: row.body,
      metadata: parseJson<Record<string, unknown>>(row.metadata),
      createdAt: new Date(row.created_at).toISOString(),
    }));
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
    return {
      ownerId: row.owner_id,
      apiKey: row.api_key,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } satisfies AgentApiKeyRecord;
  }

  async findAgentApiKey(apiKey: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM agent_api_keys WHERE api_key = ${apiKey}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      ownerId: row.owner_id,
      apiKey: row.api_key,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } satisfies AgentApiKeyRecord;
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
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      logoUrl: row.logo_url ?? undefined,
      appUrl: row.app_url ?? undefined,
      docsUrl: row.docs_url ?? undefined,
      categories: parseJson<string[]>(row.categories),
      authModes: parseJson<ManagedConnectorRecord["authModes"]>(row.auth_modes),
      authStrategy: row.auth_strategy,
      provider: row.provider ?? undefined,
      oauthConfigured: Boolean(row.encrypted_oauth_client),
      credentialLabel: row.credential_label,
      credentialPlaceholder: row.credential_placeholder,
      credentialHelp: row.credential_help,
      apiBaseUrl: row.api_base_url,
      serverUrl: row.server_url ?? undefined,
      openApiUrl: row.open_api_url ?? undefined,
      oauthConfig: row.oauth_config
        ? parseJson<ManagedConnectorRecord["oauthConfig"]>(row.oauth_config)
        : undefined,
      encryptedOAuthClient: row.encrypted_oauth_client ?? undefined,
      functions: parseJson<ManagedConnectorRecord["functions"]>(row.functions),
      enabled: row.enabled,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } satisfies ManagedConnectorRecord));
  }

  async getManagedConnector(slug: string) {
    await this.ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM managed_connectors WHERE slug = ${slug}`;
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      logoUrl: row.logo_url ?? undefined,
      appUrl: row.app_url ?? undefined,
      docsUrl: row.docs_url ?? undefined,
      categories: parseJson<string[]>(row.categories),
      authModes: parseJson<ManagedConnectorRecord["authModes"]>(row.auth_modes),
      authStrategy: row.auth_strategy,
      provider: row.provider ?? undefined,
      oauthConfigured: Boolean(row.encrypted_oauth_client),
      credentialLabel: row.credential_label,
      credentialPlaceholder: row.credential_placeholder,
      credentialHelp: row.credential_help,
      apiBaseUrl: row.api_base_url,
      serverUrl: row.server_url ?? undefined,
      openApiUrl: row.open_api_url ?? undefined,
      oauthConfig: row.oauth_config
        ? parseJson<ManagedConnectorRecord["oauthConfig"]>(row.oauth_config)
        : undefined,
      encryptedOAuthClient: row.encrypted_oauth_client ?? undefined,
      functions: parseJson<ManagedConnectorRecord["functions"]>(row.functions),
      enabled: row.enabled,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } satisfies ManagedConnectorRecord;
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
        ${record.credentialHelp}, ${record.apiBaseUrl}, ${record.serverUrl ?? null}, ${record.openApiUrl ?? null}, ${record.oauthConfig ? JSON.stringify(record.oauthConfig) : null},
        ${record.encryptedOAuthClient ?? null}, ${JSON.stringify(record.functions)}, ${record.enabled}, ${record.createdAt}, ${record.updatedAt}
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
    return rows.map((row) => ({
      ownerId: row.owner_id,
      integrationKey: row.integration_key,
      provider: row.provider,
      authStrategy: row.auth_strategy,
      encryptedCredentials: row.encrypted_credentials,
      tokenType: row.token_type ?? undefined,
      scopes: parseJson<string[]>(row.scopes),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
      externalAccountId: row.external_account_id ?? undefined,
      externalWorkspaceId: row.external_workspace_id ?? undefined,
      displayName: row.display_name ?? undefined,
      metadata: parseJson<Record<string, unknown>>(row.metadata),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } satisfies IntegrationConnectionRecord));
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
    return {
      ownerId: row.owner_id,
      integrationKey: row.integration_key,
      provider: row.provider,
      authStrategy: row.auth_strategy,
      encryptedCredentials: row.encrypted_credentials,
      tokenType: row.token_type ?? undefined,
      scopes: parseJson<string[]>(row.scopes),
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
      externalAccountId: row.external_account_id ?? undefined,
      externalWorkspaceId: row.external_workspace_id ?? undefined,
      displayName: row.display_name ?? undefined,
      metadata: parseJson<Record<string, unknown>>(row.metadata),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    } satisfies IntegrationConnectionRecord;
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
    return {
      state: row.state,
      ownerId: row.owner_id,
      integrationKey: row.integration_key,
      provider: row.provider,
      codeVerifier: row.code_verifier ?? undefined,
      redirectTo: row.redirect_to,
      redirectUri: row.redirect_uri ?? undefined,
      callbackUrl: row.callback_url ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString(),
    } satisfies OAuthStateRecord;
  }

  async deleteOAuthState(state: string) {
    await this.ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM oauth_states WHERE state = ${state}`;
  }
}
