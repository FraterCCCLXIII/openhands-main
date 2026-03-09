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
});

describe("AddConnectorPage", () => {
  it("falls back to generic admin guidance when ADMIN_EMAIL is not set", async () => {
    vi.stubEnv("ADMIN_EMAIL", "");

    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html).toContain("contact an admin");
    expect(html).toContain("Popular OAuth-ready provider options");
    expect(html).toContain("How to add a provider that is not currently showing up.");
    expect(html).toContain("POST /api/managed-connectors");
    expect(html).toContain("/api/managed-connectors/openapi");
    expect(html).toContain("OpenAPI doc");
    expect(html).toContain("Search curated adaptors");
    expect(html).toContain("managed connector record in the database");
    expect(html).toContain("APP_ADMIN_EMAILS");
    expect(html).not.toContain("src/lib/oauth/providers.ts");
    expect(html).not.toContain("Submit provider information");
  });

  it("shows the configured admin email when ADMIN_EMAIL is set", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html).toContain("Contact admin@example.com");
    expect(html).toContain("please contact admin@example.com");
  });

  it("renders users before admins", async () => {
    const html = renderToStaticMarkup(await AddConnectorPage());

    expect(html.indexOf("For users")).toBeLessThan(html.indexOf("For admins"));
  });
});
