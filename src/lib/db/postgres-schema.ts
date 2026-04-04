type SqlQuery = unknown;

export interface PostgresSqlClient {
  (strings: TemplateStringsArray, ...values: unknown[]): SqlQuery;
  transaction(...args: unknown[]): Promise<unknown>;
}

export const SCHEMA_LOCK_ID = 482190317;

export const initializePostgresSchema = async (sql: PostgresSqlClient) => {
  await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(${SCHEMA_LOCK_ID})`,
    sql`DROP TABLE IF EXISTS integrations`,
    sql`
      CREATE TABLE IF NOT EXISTS owner_integrations (
        owner_id TEXT NOT NULL,
        key TEXT NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        provider TEXT NOT NULL,
        auth_strategy TEXT NOT NULL,
        enabled BOOLEAN NOT NULL,
        fine_grained_permissions BOOLEAN NOT NULL,
        config JSONB NOT NULL DEFAULT '{}'::jsonb,
        credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
        functions JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (owner_id, key)
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
        agent_id TEXT,
        agent_class TEXT,
        integration_key TEXT NOT NULL,
        function_name TEXT NOT NULL,
        scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
        requested_minutes INTEGER NOT NULL,
        channels JSONB NOT NULL DEFAULT '[]'::jsonb,
        notification_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
        justification TEXT NOT NULL DEFAULT '',
        agent_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL,
        decided_at TIMESTAMPTZ,
        decided_by TEXT
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS temporary_grants (
        id TEXT PRIMARY KEY,
        agent_id TEXT,
        agent_class TEXT,
        integration_key TEXT NOT NULL,
        function_name TEXT NOT NULL,
        scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
        granted_by TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS tool_invocations (
        id TEXT PRIMARY KEY,
        owner_id TEXT,
        agent_id TEXT,
        agent_class TEXT,
        integration_key TEXT NOT NULL,
        function_name TEXT NOT NULL,
        scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
        provider TEXT NOT NULL,
        kind TEXT NOT NULL,
        auth_strategy TEXT NOT NULL,
        outcome TEXT NOT NULL,
        invoked_at TIMESTAMPTZ NOT NULL,
        duration_ms INTEGER,
        payload_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
        error_message TEXT
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
      CREATE TABLE IF NOT EXISTS user_api_keys (
        owner_id TEXT PRIMARY KEY,
        api_key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        key_suffix TEXT NOT NULL DEFAULT '',
        encrypted_api_key TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS admin_api_keys (
        owner_id TEXT PRIMARY KEY,
        api_key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        key_suffix TEXT NOT NULL DEFAULT '',
        encrypted_api_key TEXT,
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
        api_base_url TEXT NOT NULL DEFAULT '',
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
    sql`ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS key_suffix TEXT NOT NULL DEFAULT ''`,
    sql`ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT`,
    sql`ALTER TABLE admin_api_keys ADD COLUMN IF NOT EXISTS key_suffix TEXT NOT NULL DEFAULT ''`,
    sql`ALTER TABLE admin_api_keys ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT`,
  ]);
};
