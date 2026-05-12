/**
 * PGlite-backed neon-compatible SQL wrapper for tests.
 *
 * Creates a tagged-template `sql` function that behaves like the one returned
 * by `neon()` from `@neondatabase/serverless`, but executes against an
 * in-process PGlite (WASM Postgres) instance.
 *
 * Also exports `createTestRepository()` — the standard way to get a real
 * `PostgresRepository` backed by an ephemeral in-process Postgres for any
 * test that needs one.
 *
 * Note: Production schema is managed by Alembic migrations (backend/alembic/).
 * Tests initialize schema directly via initializeTestSchema() for isolation.
 */

import { PGlite } from "@electric-sql/pglite";

import type { ContextRepository } from "@/src/lib/core/repository";

/**
 * Initialize the database schema for tests.
 *
 * This mirrors the Alembic migration (backend/alembic/versions/20250512_0001_initial_schema.py)
 * but runs directly against PGlite for test isolation.
 *
 * WARNING: This schema must be manually kept in sync with Alembic migrations.
 *
 * When adding a new migration:
 * 1. Apply the same schema changes here
 * 2. Verify tests still pass
 * 3. Document any schema-dependent test assumptions
 *
 * This duplication is intentional for test isolation (no Alembic dependency in tests).
 */
export const initializeTestSchema = async (pglite: PGlite): Promise<void> => {
  await pglite.exec(`
    DROP TABLE IF EXISTS integrations;

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
    );

    CREATE TABLE IF NOT EXISTS agent_class_policies (
      agent_class TEXT PRIMARY KEY,
      rules JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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
    );

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
    );

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
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_api_keys (
      owner_id TEXT PRIMARY KEY,
      api_key TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_api_keys (
      owner_id TEXT PRIMARY KEY,
      api_key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      key_suffix TEXT NOT NULL DEFAULT '',
      encrypted_api_key TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_api_keys (
      owner_id TEXT PRIMARY KEY,
      api_key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      key_suffix TEXT NOT NULL DEFAULT '',
      encrypted_api_key TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

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
    );

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
    );

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
    );
  `);
};

export interface PgliteTestContext {
  /** PGlite instance – direct access when needed. */
  pglite: PGlite;
  /** neon-compatible tagged-template sql function. */
  sql: NeonCompatSql;
  /** Shut down the PGlite instance. */
  close: () => Promise<void>;
}

type RowArray = Record<string, unknown>[] & {
  _pgliteQuery?: { text: string; params: unknown[] };
};

interface NeonCompatSql {
  (strings: TemplateStringsArray, ...values: unknown[]): RowArray & PromiseLike<RowArray>;
  transaction: (queries: RowArray[]) => Promise<RowArray[]>;
}

/**
 * Build a parameterized SQL string from a tagged template literal.
 *
 * `sql\`SELECT * FROM t WHERE id = ${1} AND name = ${"a"}\``
 *   → { text: "SELECT * FROM t WHERE id = $1 AND name = $2", params: [1, "a"] }
 */
const buildQuery = (strings: TemplateStringsArray, values: unknown[]) => {
  let text = "";
  const params: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  }
  return { text, params };
};

/**
 * Create a fresh PGlite-backed test context.
 *
 * The returned `sql` function is API-compatible with neon's tagged-template
 * helper (default mode, no `fullResults`, no `arrayMode`).
 */
export const createPgliteTestContext = async (): Promise<PgliteTestContext> => {
  const pglite = new PGlite();

  const execQuery = async (text: string, params: unknown[]): Promise<RowArray> => {
    const result = await pglite.query(text, params);
    return result.rows as RowArray;
  };

  const sql: NeonCompatSql = Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => {
      const { text, params } = buildQuery(strings, values);

      // Return an array-like thenable that lazily executes when awaited,
      // but can also be collected by `sql.transaction()`.
      const placeholder: RowArray = Object.assign([] as Record<string, unknown>[], {
        _pgliteQuery: { text, params },
      });

      const promise = execQuery(text, params);

      // Make it thenable so `await sql\`...\`` works
      Object.defineProperty(placeholder, "then", {
        value: (
          onFulfilled?: (value: RowArray) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) => promise.then(onFulfilled, onRejected),
        enumerable: false,
      });

      return placeholder as RowArray & PromiseLike<RowArray>;
    },
    {
      transaction: async (queries: RowArray[]): Promise<RowArray[]> => {
        const results: RowArray[] = [];
        await pglite.exec("BEGIN");
        try {
          for (const query of queries) {
            const meta = query._pgliteQuery;
            if (meta) {
              results.push(await execQuery(meta.text, meta.params));
            } else {
              // Already resolved promise-like (shouldn't happen in normal usage)
              results.push(await (query as unknown as PromiseLike<RowArray>));
            }
          }
          await pglite.exec("COMMIT");
        } catch (err) {
          await pglite.exec("ROLLBACK");
          throw err;
        }
        return results;
      },
    },
  );

  return {
    pglite,
    sql,
    close: () => pglite.close(),
  };
};

// ---------------------------------------------------------------------------
// Shared test-repository factory
// ---------------------------------------------------------------------------

/** Active PGlite context for the current test – swapped per beforeEach. */
let activeCtx: PgliteTestContext | null = null;

/**
 * Return the active PGlite sql function.  Called by the vi.mock of
 * `@neondatabase/serverless` that each consuming test file installs.
 */
export const getActiveSql = () => {
  if (!activeCtx) {
    throw new Error("No active PGlite context – call createTestRepository() in beforeEach first.");
  }
  return activeCtx.sql;
};

/**
 * Create a fresh PGlite-backed `PostgresRepository` for use in a single test.
 *
 * Call this in `beforeEach`.  The returned `cleanup` function should be called
 * in `afterEach` to close the PGlite instance.
 *
 * **Prerequisite**: the test file must mock `@neondatabase/serverless` so that
 * `neon()` delegates to `getActiveSql()`:
 *
 * ```ts
 * import { getActiveSql } from "@/src/lib/db/pglite-test-utils";
 * vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));
 * ```
 */
export const createTestRepository = async (): Promise<{
  repository: ContextRepository;
  cleanup: () => Promise<void>;
}> => {
  // Close any leftover context (safety net).
  if (activeCtx) {
    await activeCtx.close();
  }

  activeCtx = await createPgliteTestContext();

  // Initialize schema directly for test isolation (production uses Alembic migrations).
  await initializeTestSchema(activeCtx.pglite);

  // Lazy-import to avoid circular deps and to pick up the vi.mock override.
  const { PostgresRepository } = await import("./postgres-repository");
  const repository = new PostgresRepository();

  return {
    repository,
    cleanup: async () => {
      if (activeCtx) {
        await activeCtx.close();
        activeCtx = null;
      }
    },
  };
};
