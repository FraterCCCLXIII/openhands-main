import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { neonMock, transactionMock } = vi.hoisted(() => {
  const transactionMock = vi.fn(async (queries: unknown[]) => queries);
  const sqlMock = vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    text: strings.join("?"),
    values,
  }));
  Object.assign(sqlMock, { transaction: transactionMock });

  return {
    neonMock: vi.fn(() => sqlMock),
    sqlMock,
    transactionMock,
  };
});

vi.mock("@neondatabase/serverless", () => ({
  neon: neonMock,
}));

import { PostgresRepository } from "@/src/lib/db/postgres-repository";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.stubEnv("POSTGRES_URL", "postgres://user:pass@example.com:5432/context_layer");
});

describe("PostgresRepository.ensureSchema", () => {
  it("deduplicates concurrent initialization in process and acquires a schema advisory lock", async () => {
    const repository = new PostgresRepository();

    await Promise.all([
      repository.ensureSchema(),
      repository.ensureSchema(),
      repository.ensureSchema(),
    ]);

    expect(neonMock).toHaveBeenCalledTimes(1);
    expect(transactionMock).toHaveBeenCalledTimes(1);

    const queries = transactionMock.mock.calls[0]?.[0] as Array<{
      text: string;
      values: unknown[];
    }>;
    expect(queries[0]?.text).toContain("pg_advisory_xact_lock");
    expect(queries[0]?.values).toEqual([482190317]);
  });

  it("allows retries after a failed initialization attempt", async () => {
    transactionMock
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([]);

    const repository = new PostgresRepository();

    await expect(repository.ensureSchema()).rejects.toThrow("boom");
    await expect(repository.ensureSchema()).resolves.toBeUndefined();

    expect(transactionMock).toHaveBeenCalledTimes(2);
  });
});
