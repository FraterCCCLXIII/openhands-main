import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "dev@localhost" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import AddConnectorPage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "dev@localhost" } });
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
});

describe("AddConnectorPage", () => {
  it("falls back to generic admin guidance when ADMIN_EMAIL is not set", async () => {
    vi.stubEnv("ADMIN_EMAIL", "");

    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html).toContain("contact an admin");
    expect(html).toContain("Popular official provider options");
    expect(html).toContain("How to add a provider that is not currently showing up.");
    expect(html).toContain("POST /api/managed-connectors");
    expect(html).toContain("/api/managed-connectors/openapi");
    expect(html).toContain("endpoint schema doc");
    expect(html).toContain("Search curated adaptors");
    expect(html).toContain("service-level admin action");
    expect(html).toContain("official vendor-hosted MCP URL");
    expect(html).toContain("official REST API/OpenAPI default");
    expect(html).toContain("provider&#x27;s own docs");
    expect(html).toContain("authentication setup docs");
    expect(html).not.toContain("Composio-hosted MCP URL pattern");
    expect(html).not.toContain("customerId=replace-me");
    expect(html).toContain("AUTH_REDIRECT_PROXY_URL");
    expect(html).toContain("stable deployment origin instead of the preview URL");
    expect(html).toContain("Connect");
    expect(html).toContain("Discover functions");
    expect(html).toContain("managed remote MCP or managed HTTP connector");
    expect(html).toContain("APP_ADMIN_EMAILS");
    expect(html).toContain("src/lib/integrations/oauth-provider-registration-defaults.ts");
    expect(html).toContain("src/lib/integrations/oauth-provider-catalog.ts");
    expect(html).not.toContain("app/api/mcp/&lt;provider&gt;/route.ts");
    expect(html).not.toContain("src/lib/oauth/providers.ts");
    expect(html).not.toContain("Submit provider information");
  });

  it("shows the configured admin email when ADMIN_EMAIL is set", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html).toContain("Contact admin@example.com");
    expect(html).toContain("please contact admin@example.com");
  });


  it("shows registered managed connector controls to allowlisted admins", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html).toContain("Registered managed connectors");
    expect(html).toContain("Edit stale service-level connector settings in place or delete a connector before re-registering it with a new provider type.");
    expect(html).toContain("No managed connectors are registered yet.");
  });


  it("renders users before admins", async () => {
    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html.indexOf("For users")).toBeLessThan(html.indexOf("For admins"));
  });


  it("shows database setup instructions to admins when persistent storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html).toContain("Service unavailable");
    expect(html).toContain("How to set up the database");
    expect(html).toContain("POSTGRES_URL");
    expect(html).toContain("DATABASE_URL");
    expect(html).not.toContain("Popular official provider options");
  });

});
