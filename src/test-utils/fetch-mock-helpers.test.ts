import { describe, expect, it } from "vitest";

import type {
  AccessRequest,
  IntegrationSpec,
  ManagedConnectorOption,
  NotificationRecord,
} from "@/src/types/integrations-hub";

import { createDashboardFetchMock } from "@/src/test-utils/fetch-mock-helpers";

const sampleIntegration: IntegrationSpec = {
  key: "github",
  name: "GitHub",
  kind: "mcp",
  provider: "mcp",
  authStrategy: "bearer",
  enabled: true,
  fineGrainedPermissions: true,
  config: {},
  credentials: {},
  tools: {},
};

const sampleManagedConnector: ManagedConnectorOption = {
  slug: "github",
  name: "GitHub",
  description: "Source control and pull requests.",
  appUrl: "https://github.com",
  toolCount: 12,
  categories: ["Engineering"],
  authModes: ["bearer"],
  authStrategy: "bearer",
  credentialLabel: "Token",
  credentialPlaceholder: "ghp_...",
  credentialHelp: "Personal access token.",
};

const sampleAccessRequest: AccessRequest = {
  id: "req-1",
  agentId: "agent-1",
  agentClass: "assistant",
  integrationKey: "github",
  toolName: "create_issue",
  scopes: ["issues:write"],
  requestedMinutes: 240,
  channels: ["in_app"],
  notificationTargets: { in_app: "owner@example.com" },
  createdAt: "2026-03-01T09:00:00.000Z",
  status: "pending",
};

const sampleNotification: NotificationRecord = {
  id: "n-1",
  channel: "in_app",
  recipient: "owner@example.com",
  subject: "subject",
  body: "body",
  metadata: {},
  createdAt: "2026-03-01T09:00:00.000Z",
};

const readJson = async (response: Response) => JSON.parse(await response.text());

describe("createDashboardFetchMock", () => {
  it("returns the supplied integrations payload from /api/integrations", async () => {
    const fetchMock = createDashboardFetchMock({ integrations: [sampleIntegration] });

    const response = await fetchMock("/api/integrations");

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual([sampleIntegration]);
  });

  it("evaluates the integrations thunk on each call so callers can mutate state", async () => {
    let integrations: IntegrationSpec[] = [];
    const fetchMock = createDashboardFetchMock({
      integrations: () => integrations,
    });

    const first = await fetchMock("/api/integrations");
    expect(await readJson(first)).toEqual([]);

    integrations = [sampleIntegration];

    const second = await fetchMock("/api/integrations");
    expect(await readJson(second)).toEqual([sampleIntegration]);
  });

  it("returns the standard managed-connectors, approvals, and notifications payloads", async () => {
    const fetchMock = createDashboardFetchMock({
      managedConnectors: [sampleManagedConnector],
      accessRequests: [sampleAccessRequest],
      notifications: [sampleNotification],
    });

    const managed = await fetchMock("/api/integrations?filter=enabled");
    const approvals = await fetchMock("/api/case-by-case-approvals");
    const notifications = await fetchMock("/api/notifications");

    expect(await readJson(managed)).toEqual([sampleManagedConnector]);
    expect(await readJson(approvals)).toEqual([sampleAccessRequest]);
    expect(await readJson(notifications)).toEqual([sampleNotification]);
  });

  it("falls back to empty arrays for routes the caller did not configure", async () => {
    const fetchMock = createDashboardFetchMock();

    const integrations = await fetchMock("/api/integrations");
    const managed = await fetchMock("/api/integrations?filter=enabled");
    const approvals = await fetchMock("/api/case-by-case-approvals");
    const notifications = await fetchMock("/api/notifications");

    expect(await readJson(integrations)).toEqual([]);
    expect(await readJson(managed)).toEqual([]);
    expect(await readJson(approvals)).toEqual([]);
    expect(await readJson(notifications)).toEqual([]);
  });

  it("lets routeHandler intercept standard routes before the fallbacks run", async () => {
    const fetchMock = createDashboardFetchMock({
      integrations: [sampleIntegration],
      routeHandler: (url, method) => {
        if (url === "/api/integrations" && method === "GET") {
          return new Response(JSON.stringify("intercepted"), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return null;
      },
    });

    const intercepted = await fetchMock("/api/integrations");
    expect(await readJson(intercepted)).toBe("intercepted");

    // Returning null falls through to the standard handler.
    const fallback = await fetchMock("/api/notifications");
    expect(await readJson(fallback)).toEqual([]);
  });

  it("forwards method and init to the routeHandler so tests can branch on verbs", async () => {
    const fetchMock = createDashboardFetchMock({
      routeHandler: (url, method, init) => {
        if (url === "/api/integrations/github" && method === "DELETE") {
          return new Response(JSON.stringify({ deleted: true, body: init?.body ?? null }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return null;
      },
    });

    const response = await fetchMock("/api/integrations/github", { method: "DELETE" });
    expect(await readJson(response)).toEqual({ deleted: true, body: null });
  });

  it("throws for unexpected fetches so tests cannot silently drift into untested routes", async () => {
    const fetchMock = createDashboardFetchMock();

    await expect(fetchMock("/api/unexpected")).rejects.toThrow(
      "Unexpected fetch: GET /api/unexpected",
    );
  });
});
