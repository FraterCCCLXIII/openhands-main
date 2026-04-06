import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, generateManagedConnectorFunctionsFromOpenApiMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "admin@example.com" } })),
  generateManagedConnectorFunctionsFromOpenApiMock: vi.fn(async () => [
    {
      name: "list_pages",
      description: "List pages",
      defaultScopes: ["pages.read"],
      request: { method: "GET", path: "/pages" },
    },
  ]),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/src/lib/managed-connectors/openapi", () => ({
  generateManagedConnectorFunctionsFromOpenApi:
    generateManagedConnectorFunctionsFromOpenApiMock,
  generateManagedConnectorToolsFromOpenApi:
    generateManagedConnectorFunctionsFromOpenApiMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { POST } from "./route";

import { getContextLayerService } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

let testCleanup: () => Promise<void>;

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://managed-connector-functions-route-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
  generateManagedConnectorFunctionsFromOpenApiMock.mockClear();
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
});

afterEach(async () => {
  resetRuntime();
  await testCleanup();
});

describe("POST /api/managed-connectors/[slug]/functions", () => {
  it("re-indexes tools for allowlisted app administrators while preserving existing access ceilings", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    const service = getContextLayerService();
    await service.upsertManagedConnector({
      slug: "notion",
      name: "Notion",
      description: "Notion REST connector",
      categories: ["Knowledge base"],
      authModes: ["oauth2"],
      authStrategy: "oauth2",
      provider: "http",
      credentialLabel: "Connect Notion",
      credentialPlaceholder: "Connect Notion",
      credentialHelp: "Connect Notion with OAuth.",
      apiBaseUrl: "https://api.notion.com/v1",
      openApiUrl: "https://developers.notion.com/openapi.json",
      oauthConfig: {
        authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        scopes: [],
      },
      oauthClientId: "client-id",
      oauthClientSecret: "client-secret",
      tools: [
        {
          name: "list_pages",
          description: "Existing pages listing",
          defaultScopes: ["pages.read"],
          accessMode: "approval_required",
          request: { method: "GET", path: "/pages" },
        },
      ],
      enabled: true,
    });
    generateManagedConnectorFunctionsFromOpenApiMock.mockClear();

    const response = await POST(
      new Request("http://localhost/api/managed-connectors/notion/functions", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ slug: "notion" }),
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      slug: string;
      tools: Array<{ name: string; accessMode?: string }>;
    };
    expect(body.slug).toBe("notion");
    expect(body.tools).toContainEqual(
      expect.objectContaining({
        name: "list_pages",
        accessMode: "approval_required",
      }),
    );
    expect(generateManagedConnectorFunctionsFromOpenApiMock).toHaveBeenCalledTimes(1);
  });

  it("rejects requests from non-admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const response = await POST(
      new Request("http://localhost/api/managed-connectors/notion/functions", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ slug: "notion" }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can manage connector tools.",
    });
  });
});
