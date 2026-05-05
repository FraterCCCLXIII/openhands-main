// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { findHeading, renderStaticDocument } from "@/src/test-utils/static-dom";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "dev@localhost" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { nowIso } from "@/src/lib/core/date";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

import AdminOverviewPage from "./page";

const renderDocument = async () => renderStaticDocument(await AdminOverviewPage());

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    integrationsHubRepository?: unknown;
    integrationsHubService?: unknown;
  };
  delete runtime.integrationsHubRepository;
  delete runtime.integrationsHubService;
};

let testCleanup: () => Promise<void>;

beforeAll(() => {
  vi.stubEnv("POSTGRES_URL", "pglite://admin-overview-page-test");
});

beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

afterEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "dev@localhost" } });
  resetRuntime();
  await testCleanup();
});

describe("app/admin-overview/page", () => {
  it("renders a single full-width user browser card with expandable user rows for admins", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const service = getIntegrationsHubService();
    await service.saveOAuthConnection(
      "owner-a@example.com",
      "github",
      "github",
      { accessToken: "token-a" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-b@example.com",
      "github",
      "github",
      { accessToken: "token-b" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["repo"],
        externalAccountId: "xingyaoww",
        displayName: "xingyaoww",
        metadata: { login: "xingyaoww" },
      },
    );
    await service.saveOAuthConnection(
      "owner-c@example.com",
      "slack",
      "slack",
      { accessToken: "token-c" },
      {
        authStrategy: "oauth2",
        tokenType: "Bearer",
        scopes: ["chat:write"],
        externalAccountId: "U123",
        displayName: "workspace-bot",
        metadata: { team: "Workspace" },
      },
    );
    await service.upsertManagedConnector({
      slug: "test-http",
      name: "Test HTTP",
      description: "Test managed connector",
      categories: ["test"],
      authStrategy: "api_key",
      credentialLabel: "API key",
      credentialPlaceholder: "sk_test",
      credentialHelp: "Paste a key.",
      apiBaseUrl: "https://example.com",
      enabled: true,
    });
    await service.createAccessRequest({
      agentId: "agent-1",
      agentClass: "assistant",
      integrationKey: "github",
      toolName: "list_repos",
      scopes: ["repo"],
      requestedMinutes: 30,
      channels: ["in_app"],
      notificationTargets: { in_app: "owner-a@example.com" },
      justification: "Need read access",
      agentData: {},
    });
    await service.createNotification({
      id: "notif-1",
      channel: "in_app",
      recipient: "owner-a@example.com",
      subject: "Approval required",
      body: "A request is waiting for review.",
      metadata: {},
      createdAt: nowIso(),
    });

    const document = await renderDocument();
    const userRows = document.querySelectorAll('[data-testid="admin-overview-user-row"]');

    expect(findHeading(document, 1, "Operational overview")).toBeTruthy();
    expect(document.querySelector('[data-testid="admin-overview-users-card"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Browse users");
    expect(document.body.textContent).toContain("Deployment-wide user summaries");
    expect(document.body.textContent).toContain("3 users");
    expect(userRows).toHaveLength(3);
    expect(document.body.textContent).toContain("owner-a@example.com");
    expect(document.body.textContent).toContain("owner-b@example.com");
    expect(document.body.textContent).toContain("owner-c@example.com");
    expect(document.body.textContent).toContain("View details");
    expect(document.body.textContent).toContain("Saved identities");
    expect(document.body.textContent).toContain("Duplicate external-account groups");
    expect(document.body.textContent).toContain("github");
    expect(document.body.textContent).toContain("slack");
    expect(document.body.textContent).not.toContain("overview-stat-card-totalConnections");
    expect(document.querySelector('a[href="/api/admin/openapi"]')).toBeTruthy();
  });

  it("shows an admin access gate instead of deployment-wide metrics for non-admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const document = await renderDocument();

    expect(document.querySelector('[data-testid="admin-overview-gated-card"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Admin access required");
    expect(document.body.textContent).toContain("APP_ADMIN_EMAILS");
    expect(document.querySelector('[data-testid="admin-overview-users-card"]')).toBeFalsy();
    expect(document.querySelector('[data-testid="admin-overview-user-row"]')).toBeFalsy();
    expect(document.querySelector('a[href="/admin-integrations"]')).toBeTruthy();
  });

  it("shows database setup instructions to admins when persistent storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("POSTGRES_URL", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const document = await renderDocument();

    expect(findHeading(document, 1, "Service unavailable")).toBeTruthy();
    expect(findHeading(document, 2, "How to set up the database")).toBeTruthy();
    expect(findHeading(document, 1, "Operational overview")).toBeFalsy();
  });
});
