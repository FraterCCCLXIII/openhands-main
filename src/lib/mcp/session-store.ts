import { neon } from "@neondatabase/serverless";

import { hasPersistentContextLayerStorage } from "@/src/lib/persistence";

export type McpSessionDefaults = {
  agentId: string;
  agentClass: string;
};

export type McpSessionRecord = {
  sessionId: string;
  ownerId: string;
  defaults: McpSessionDefaults;
};

const SESSION_SCHEMA_LOCK_ID = 482190318;
const SESSION_TTL_SQL = "INTERVAL '12 hours'";

const inMemorySessions = new Map<string, McpSessionRecord>();

const shouldUsePersistentSessionStore = () =>
  hasPersistentContextLayerStorage() && process.env.NODE_ENV !== "test";

const getSql = () => {
  const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("POSTGRES_URL or DATABASE_URL must be configured for MCP session storage.");
  }

  return neon(databaseUrl);
};

let sessionSchemaReady = false;
let sessionSchemaInitPromise: Promise<void> | undefined;

const ensureSessionSchema = async () => {
  if (!shouldUsePersistentSessionStore() || sessionSchemaReady) {
    return;
  }

  if (!sessionSchemaInitPromise) {
    sessionSchemaInitPromise = (async () => {
      const sql = getSql();

      await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(${SESSION_SCHEMA_LOCK_ID})`,
        sql`
          CREATE TABLE IF NOT EXISTS mcp_sessions (
            session_id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            agent_id TEXT NOT NULL DEFAULT '',
            agent_class TEXT NOT NULL DEFAULT '',
            expires_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `,
      ]);

      sessionSchemaReady = true;
    })().finally(() => {
      sessionSchemaInitPromise = undefined;
    });
  }

  await sessionSchemaInitPromise;
};

export const getMcpSession = async (sessionId: string) => {
  if (!shouldUsePersistentSessionStore()) {
    return inMemorySessions.get(sessionId) ?? null;
  }

  await ensureSessionSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT session_id, owner_id, agent_id, agent_class
    FROM mcp_sessions
    WHERE session_id = ${sessionId}
      AND expires_at > NOW()
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    await sql`DELETE FROM mcp_sessions WHERE session_id = ${sessionId}`;
    return null;
  }

  return {
    sessionId: row.session_id,
    ownerId: row.owner_id,
    defaults: {
      agentId: row.agent_id,
      agentClass: row.agent_class,
    },
  } satisfies McpSessionRecord;
};

export const upsertMcpSession = async (record: McpSessionRecord) => {
  if (!shouldUsePersistentSessionStore()) {
    inMemorySessions.set(record.sessionId, record);
    return;
  }

  await ensureSessionSchema();
  const sql = getSql();

  await sql.query(
    `
      INSERT INTO mcp_sessions (session_id, owner_id, agent_id, agent_class, expires_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW() + ${SESSION_TTL_SQL}, NOW())
      ON CONFLICT (session_id)
      DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        agent_id = EXCLUDED.agent_id,
        agent_class = EXCLUDED.agent_class,
        expires_at = NOW() + ${SESSION_TTL_SQL},
        updated_at = NOW()
    `,
    [record.sessionId, record.ownerId, record.defaults.agentId, record.defaults.agentClass],
  );
};

export const deleteMcpSession = async (sessionId: string) => {
  if (!shouldUsePersistentSessionStore()) {
    inMemorySessions.delete(sessionId);
    return;
  }

  await ensureSessionSchema();
  const sql = getSql();
  await sql`DELETE FROM mcp_sessions WHERE session_id = ${sessionId}`;
};

export const resetMcpSessionsForTests = async () => {
  inMemorySessions.clear();
};
