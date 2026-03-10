import { afterEach, describe, expect, it, vi } from "vitest";

import { MemoryRepository } from "@/src/lib/db/memory-repository";

const resetRuntimeService = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

const setRuntimeRepository = (repository: MemoryRepository) => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  runtime.contextLayerRepository = repository;
  delete runtime.contextLayerService;
};

const saveOAuthState = async (repository: MemoryRepository) => {
  await repository.saveOAuthState({
    state: "state-123",
    ownerId: "dev@localhost",
    integrationKey: "notion",
    provider: "notion",
    redirectTo: "/admin?section=integrations",
    redirectUri: "https://openhands-context-layer.vercel.app/api/oauth/notion/callback",
    callbackUrl: "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback",
    createdAt: "2026-03-09T00:00:00.000Z",
    expiresAt: "2999-03-09T00:10:00.000Z",
  });
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  resetRuntimeService();
});

describe("GET /api/oauth/[provider]/callback", () => {
  it("proxies stable-domain callbacks back to the preview deployment callback URL", async () => {
    vi.stubEnv("AUTH_REDIRECT_PROXY_URL", "https://openhands-context-layer.vercel.app/api/auth");

    const repository = new MemoryRepository();
    await saveOAuthState(repository);
    setRuntimeRepository(repository);

    const { GET } = await import("./route");

    const response = await GET(
      new Request(
        "https://openhands-context-layer.vercel.app/api/oauth/notion/callback?code=code-123&state=state-123",
      ),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback?code=code-123&state=state-123",
    );
    expect(await repository.getOAuthState("state-123")).toMatchObject({
      callbackUrl: "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback",
    });
  });

  it("exchanges the code with the stable redirect URI after the preview callback resumes", async () => {
    vi.stubEnv("AUTH_REDIRECT_PROXY_URL", "https://openhands-context-layer.vercel.app/api/auth");
    vi.stubEnv("NOTION_CLIENT_ID", "notion-client-id");
    vi.stubEnv("NOTION_CLIENT_SECRET", "notion-client-secret");

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "access-123",
          token_type: "Bearer",
          workspace_name: "Team Notion",
          workspace_id: "workspace-123",
          bot_id: "bot-123",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const repository = new MemoryRepository();
    await saveOAuthState(repository);
    setRuntimeRepository(repository);

    const { GET } = await import("./route");

    const response = await GET(
      new Request(
        "https://context-layer-git-feature.vercel.app/api/oauth/notion/callback?code=code-123&state=state-123",
      ),
      {
        params: Promise.resolve({ provider: "notion" }),
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/admin?section=integrations&oauth_provider=notion&oauth_status=connected",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      code: "code-123",
      redirect_uri: "https://openhands-context-layer.vercel.app/api/oauth/notion/callback",
      grant_type: "authorization_code",
    });
    expect(await repository.getOAuthState("state-123")).toBeNull();
  });
});
