// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { findHeading, getCodeValues, renderStaticDocument } from "@/src/test-utils/static-dom";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "dev@localhost" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

import AdminIntegrationsPage from "./page";

const renderDocument = async () => renderStaticDocument(await AdminIntegrationsPage());

let testCleanup: () => Promise<void>;
beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://admin-integrations-page-test");
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

describe("app/admin-integrations/page", () => {
  it("renders the dashboard sidebar chrome for signed-in regular users", async () => {
    vi.stubEnv("ADMIN_EMAIL", "");

    const document = await renderDocument();
    const navHrefs = Array.from(document.querySelectorAll("nav a")).map((link) =>
      link.getAttribute("href"),
    );

    expect(navHrefs).toEqual(
      expect.arrayContaining([
        "/integrations",
        "/case-by-case-approvals",
        "/agent-connection",
        "/profile",
      ]),
    );
    expect(document.querySelector('a[href="/admin-integrations"]')).toBeTruthy();
    expect(document.querySelector('a[href="/home"]')).toBeFalsy();
    expect(document.body.textContent).toContain("Signed in as");
    expect(document.querySelector('[data-testid="user-guidance-card"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="admin-guidance-card"]')).toBeFalsy();
    expect(findHeading(document, 2, "Popular official provider options")).toBeTruthy();
    expect(findHeading(document, 2, "Registered managed connectors")).toBeFalsy();
    expect(document.querySelector('a[href="/integrations?showIntegrationWizard=1"]')).toBeTruthy();
    expect(document.body.textContent).toContain("contact an admin");
  });

  it("shows the configured admin email when ADMIN_EMAIL is set", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

    const document = await renderDocument();
    const mailLink = document.querySelector('a[href="mailto:admin@example.com"]');

    expect(mailLink).toBeTruthy();
    expect(mailLink?.textContent).toContain("Contact admin@example.com");
    expect(document.body.textContent).toContain("please contact admin@example.com");
  });

  it("shows only the admin guidance card and connector controls to allowlisted admins", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const document = await renderDocument();
    const codeValues = getCodeValues(document);

    expect(document.querySelector('[data-testid="admin-guidance-card"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="user-guidance-card"]')).toBeFalsy();
    expect(findHeading(document, 2, "Registered managed connectors")).toBeTruthy();
    expect(findHeading(document, 2, "Popular official provider options")).toBeTruthy();
    expect(document.querySelector('a[href="/api/managed-connectors/openapi"]')).toBeTruthy();
    expect(codeValues).toEqual(
      expect.arrayContaining([
        "APP_ADMIN_EMAILS",
        "POST /api/managed-connectors",
        "AUTH_REDIRECT_PROXY_URL",
        "src/lib/integrations/oauth-provider-registration-defaults.ts",
        "src/lib/integrations/oauth-provider-catalog.ts",
      ]),
    );
    expect(document.body.textContent).toContain("service-level admin action");
    expect(document.body.textContent).toContain("Connect");
    expect(document.body.textContent).toContain("Discover tools");
    expect(document.body.textContent).toContain("ElevenLabs");
    expect(document.body.textContent).toContain("Ordinal");
  });

  it("shows database setup instructions to admins when persistent storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("POSTGRES_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const document = await renderDocument();
    const codeValues = getCodeValues(document);

    expect(findHeading(document, 1, "Service unavailable")).toBeTruthy();
    expect(findHeading(document, 2, "How to set up the database")).toBeTruthy();
    expect(codeValues).toEqual(expect.arrayContaining(["POSTGRES_URL", "DATABASE_URL"]));
    expect(findHeading(document, 2, "Popular official provider options")).toBeFalsy();
  });
});
