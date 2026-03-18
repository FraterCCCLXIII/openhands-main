/**
 * PGlite-backed neon-compatible SQL wrapper for e2e tests.
 *
 * Creates a tagged-template `sql` function that behaves like the one returned
 * by `neon()` from `@neondatabase/serverless`, but executes against an
 * in-process PGlite (WASM Postgres) instance.
 */

import { PGlite } from "@electric-sql/pglite";

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
