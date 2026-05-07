/**
 * standard pg driver adapter that provides a Neon-compatible interface using the standard `pg` driver.
 *
 * This allows local development with a plain Docker Postgres container instead of
 * requiring the Neon serverless driver's HTTP/WebSocket transport.
 *
 * The interface mirrors what `neon()` returns: a tagged-template sql function
 * with a `.transaction()` method.
 */

import pg from "pg";

const { Pool } = pg;

type RowArray = Record<string, unknown>[];

// Query object that can be collected for transactions before execution
interface PendingQuery extends Promise<RowArray> {
  _standardPgMeta?: { text: string; params: unknown[] };
}

/**
 * Build a parameterized SQL string from a tagged template literal.
 *
 * `sql`SELECT * FROM t WHERE id = ${1} AND name = ${"a"}``
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
 * Create a Neon-compatible SQL interface backed by the standard pg driver.
 *
 * Returns a function typed as `any` to avoid TypeScript conflicts with the Neon
 * driver's complex generic types. The runtime behavior matches what Neon expects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createStandardPgSql = (connectionString: string): any => {
  const pool = new Pool({ connectionString });

  const sql = Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]): PendingQuery => {
      const { text, params } = buildQuery(strings, values);

      // Create a promise that executes the query
      const promise = pool.query(text, params).then((result) => result.rows as RowArray) as PendingQuery;

      // Attach metadata so transaction() can re-execute within transaction context
      promise._standardPgMeta = { text, params };

      return promise;
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction: async (queries: any[]): Promise<RowArray[]> => {
        const client = await pool.connect();
        const results: RowArray[] = [];

        try {
          await client.query("BEGIN");

          for (const query of queries) {
            const meta = query._standardPgMeta as { text: string; params: unknown[] } | undefined;
            if (meta) {
              const result = await client.query(meta.text, meta.params);
              results.push(result.rows as RowArray);
            } else {
              // Fallback: query was already resolved (shouldn't happen normally)
              results.push(await query);
            }
          }

          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }

        return results;
      },
    },
  );

  return sql;
};
