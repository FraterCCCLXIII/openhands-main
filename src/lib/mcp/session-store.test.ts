import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPgliteTestContext,
  type PgliteTestContext,
} from "@/src/lib/db/pglite-test-utils";

let ctx: PgliteTestContext | null = null;

vi.mock("@neondatabase/serverless", () => ({
  neon: () => {
    if (!ctx) {
      throw new Error("No active PGlite context for MCP session-store tests.");
    }

    return Object.assign(ctx.sql, {
      query: async (text: string, params: unknown[]) => {
        const result = await ctx!.pglite.query(text, params);
        return result.rows as Record<string, unknown>[];
      },
    });
  },
}));

const loadSessionStore = async () => {
  vi.resetModules();
  return import("@/src/lib/mcp/session-store");
};

afterEach(async () => {
  if (ctx) {
    await ctx.close();
    ctx = null;
  }
  vi.unstubAllEnvs();
});

describe("mcp session store", () => {
  it("uses the in-memory fallback when persistent storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const { deleteMcpSession, getMcpSession, resetMcpSessionsForTests, upsertMcpSession } =
      await loadSessionStore();

    await upsertMcpSession({
      sessionId: "session-memory",
      ownerId: "owner@example.com",
      defaults: {
        agentId: "agent-memory",
        agentClass: "assistant",
        agentData: { conversationLink: "https://chat.example/session-memory" },
      },
    });

    await expect(getMcpSession("session-memory")).resolves.toEqual({
      sessionId: "session-memory",
      ownerId: "owner@example.com",
      defaults: {
        agentId: "agent-memory",
        agentClass: "assistant",
        agentData: { conversationLink: "https://chat.example/session-memory" },
      },
    });

    await deleteMcpSession("session-memory");
    await expect(getMcpSession("session-memory")).resolves.toBeNull();

    await upsertMcpSession({
      sessionId: "session-memory-2",
      ownerId: "owner@example.com",
      defaults: {
        agentId: null,
        agentClass: null,
        agentData: {},
      },
    });
    await resetMcpSessionsForTests();
    await expect(getMcpSession("session-memory-2")).resolves.toBeNull();
  });

  it("persists sessions in Postgres and normalizes stored agent defaults on read", async () => {
    vi.stubEnv("POSTGRES_URL", "pglite://mcp-session-store");
    vi.stubEnv("NODE_ENV", "development");
    ctx = await createPgliteTestContext();

    const { deleteMcpSession, getMcpSession, upsertMcpSession } = await loadSessionStore();

    await upsertMcpSession({
      sessionId: "session-db",
      ownerId: "owner@example.com",
      defaults: {
        agentId: "  agent-db  ",
        agentClass: "  reviewer  ",
        agentData: { conversationLink: "https://chat.example/session-db" },
      },
    });

    await expect(getMcpSession("session-db")).resolves.toEqual({
      sessionId: "session-db",
      ownerId: "owner@example.com",
      defaults: {
        agentId: "agent-db",
        agentClass: "reviewer",
        agentData: { conversationLink: "https://chat.example/session-db" },
      },
    });

    await deleteMcpSession("session-db");
    await expect(getMcpSession("session-db")).resolves.toBeNull();
  });

  it("drops expired persistent sessions after reading them", async () => {
    vi.stubEnv("POSTGRES_URL", "pglite://mcp-session-store");
    vi.stubEnv("NODE_ENV", "development");
    ctx = await createPgliteTestContext();

    const { getMcpSession, upsertMcpSession } = await loadSessionStore();

    await upsertMcpSession({
      sessionId: "session-expired",
      ownerId: "owner@example.com",
      defaults: {
        agentId: "agent-expired",
        agentClass: null,
        agentData: {},
      },
    });

    const sql = ctx!.sql;
    await sql`
      UPDATE mcp_sessions
      SET expires_at = NOW() - INTERVAL '1 minute'
      WHERE session_id = ${"session-expired"}
    `;

    await expect(getMcpSession("session-expired")).resolves.toBeNull();
    const remainingRows = await sql`
      SELECT session_id FROM mcp_sessions WHERE session_id = ${"session-expired"}
    `;
    expect(remainingRows).toHaveLength(0);
  });

  it("uses DATABASE_URL when POSTGRES_URL is absent and preserves normalized null defaults", async () => {
    vi.stubEnv("DATABASE_URL", "pglite://mcp-session-store-database-url");
    vi.stubEnv("NODE_ENV", "development");
    ctx = await createPgliteTestContext();

    const { getMcpSession, upsertMcpSession } = await loadSessionStore();

    await upsertMcpSession({
      sessionId: "session-database-url",
      ownerId: "owner@example.com",
      defaults: {
        agentId: "   ",
        agentClass: null,
        agentData: {},
      },
    });

    await expect(getMcpSession("session-database-url")).resolves.toEqual({
      sessionId: "session-database-url",
      ownerId: "owner@example.com",
      defaults: {
        agentId: null,
        agentClass: null,
        agentData: {},
      },
    });
  });

});
