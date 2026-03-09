import { neon } from "@neondatabase/serverless";

import type {
  AccessRequest,
  AgentApiKeyRecord,
  AgentClassPolicy,
  IntegrationSpec,
  NotificationRecord,
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

export class PostgresRepository implements ContextRepository {
  private schemaReady = false;

  async ensureSchema() {
    if (this.schemaReady) {
      return;
    }

    const sql = getSql();

    await sql`
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
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS agent_class_policies (
        agent_class TEXT PRIMARY KEY,
        rules JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
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
    `;

    await sql`
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
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS agent_api_keys (
        owner_id TEXT PRIMARY KEY,
        api_key TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `;

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
}
