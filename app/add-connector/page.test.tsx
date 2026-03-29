import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "dev@localhost" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

import AdminIntegrationsPage from "../admin-integrations/page";

let testCleanup: () => Promise<void>;
beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://add-connector-page-test");
});
beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "dev@localhost" } });
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
  await testCleanup();
});

describe("AdminIntegrationsPage", () => {
  it("renders the dashboard sidebar chrome for signed-in regular users", async () => {
    vi.stubEnv("ADMIN_EMAIL", "");

    const html = renderToStaticMarkup(await AdminIntegrationsPage());

    expect(html).toContain("OpenHands");
    expect(html).toContain("Context Layer");
    expect(html).toContain('href="/integrations"');
    expect(html).toContain('href="/agent-connection"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain('href="/admin-integrations"');
    expect(html).not.toContain('href="/home"');
    expect(html).toContain("Signed in as");
    expect(html).toContain("Admin integrations");
    expect(html).toContain("For users");
    expect(html).toContain("contact an admin");
    expect(html).toContain("Popular official provider options");
    expect(html).toContain("Search curated adaptors");
    expect(html).toContain('href="/integrations?showIntegrationWizard=1"');
    expect(html).not.toContain("For admins");
    expect(html).not.toContain("Registered managed connectors");
    expect(html).not.toContain("APP_ADMIN_EMAILS");
    expect(html).not.toContain("POST /api/managed-connectors");
  });

  it("shows the configured admin email when ADMIN_EMAIL is set", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

    const html = renderToStaticMarkup(await AdminIntegrationsPage());

    expect(html).toContain("Contact admin@example.com");
    expect(html).toContain("please contact admin@example.com");
  });

  it("shows only the admin guidance card and connector controls to allowlisted admins", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const html = renderToStaticMarkup(await AdminIntegrationsPage());

    expect(html).toContain("OpenHands");
    expect(html).toContain("Context Layer");
    expect(html).toContain("For admins");
    expect(html).not.toContain("For users");
    expect(html).toContain("Registered managed connectors");
    expect(html).toContain("POST /api/managed-connectors");
    expect(html).toContain("/api/managed-connectors/openapi");
    expect(html).toContain("endpoint schema doc");
    expect(html).toContain("service-level admin action");
    expect(html).toContain("official vendor-hosted MCP URL");
    expect(html).toContain("official REST API/OpenAPI default");
    expect(html).toContain("provider&#x27;s own docs");
    expect(html).toContain("authentication setup docs");
    expect(html).toContain("AUTH_REDIRECT_PROXY_URL");
    expect(html).toContain("stable deployment origin instead of the preview URL");
    expect(html).toContain("Connect");
    expect(html).toContain("Discover functions");
    expect(html).toContain("managed remote MCP or managed HTTP connector");
    expect(html).toContain("APP_ADMIN_EMAILS");
    expect(html).toContain("src/lib/integrations/oauth-provider-registration-defaults.ts");
    expect(html).toContain("src/lib/integrations/oauth-provider-catalog.ts");
    expect(html).toContain("ElevenLabs");
    expect(html).toContain("Ordinal");
    expect(html).not.toContain("No managed connectors are registered yet.");
    expect(html).not.toContain("Legacy shared OAuth credential cleanup");
    expect(html).not.toContain("Safe summaries only");
    expect(html).not.toContain("Composio-hosted MCP URL pattern");
    expect(html).not.toContain("customerId=replace-me");
    expect(html).not.toContain("app/api/mcp/&lt;provider&gt;/route.ts");
    expect(html).not.toContain("src/lib/oauth/providers.ts");
    expect(html).not.toContain("Submit provider information");
  });

  it("shows database setup instructions to admins when persistent storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("POSTGRES_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const html = renderToStaticMarkup(await AdminIntegrationsPage());

    expect(html).toContain("Service unavailable");
    expect(html).toContain("How to set up the database");
    expect(html).toContain("POSTGRES_URL");
    expect(html).toContain("DATABASE_URL");
    expect(html).not.toContain("Popular official provider options");
  });
});
