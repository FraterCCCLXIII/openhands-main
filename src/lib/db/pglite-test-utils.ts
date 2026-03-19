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
 */

import { PGlite } from "@electric-sql/pglite";

import type { ContextRepository } from "@/src/lib/core/repository";

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

  // Lazy-import to avoid circular deps and to pick up the vi.mock override.
  const { PostgresRepository } = await import("./postgres-repository");
  const repository = new PostgresRepository();
  await repository.ensureSchema();

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
