import { beforeEach, describe, expect, it, vi } from "vitest";

const { discoverIntegrationMock, getCurrentUserIdentityMock } = vi.hoisted(() => ({
  discoverIntegrationMock: vi.fn(async () => ({ tools: {} })),
  getCurrentUserIdentityMock: vi.fn(async () => ({
    ownerId: "user@example.com",
    user: { email: "user@example.com", name: "User" },
  })),
}));

vi.mock("@/src/lib/current-user", () => ({
  getCurrentUserIdentity: getCurrentUserIdentityMock,
}));

vi.mock("@/src/lib/integrations/discovery", () => ({
  discoverIntegration: discoverIntegrationMock,
}));

vi.mock("@/src/lib/core/runtime", () => ({
  getContextLayerRepository: () => ({ mocked: true }),
}));

import { POST } from "./route";

describe("POST /api/integrations/discover", () => {
  beforeEach(() => {
    discoverIntegrationMock.mockClear();
    getCurrentUserIdentityMock.mockReset();
    getCurrentUserIdentityMock.mockResolvedValue({
      ownerId: "user@example.com",
      user: { email: "user@example.com", name: "User" },
    });
  });

  it("rejects non-admin discovery of raw MCP servers", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const response = await POST(
      new Request("https://example.com/api/integrations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "custom-mcp",
          kind: "mcp",
          config: { serverUrl: "https://tenant-controlled.example/mcp" },
          credentials: {},
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail:
        "Only app administrators can discover tools from arbitrary MCP server URLs. Ask an administrator to register a managed connector instead.",
    });
    expect(discoverIntegrationMock).not.toHaveBeenCalled();
  });
});
