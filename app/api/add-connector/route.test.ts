import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

import { GET as getNotifications } from "@/app/api/notifications/route";
import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

import { POST } from "./route";

let testCleanup: () => Promise<void>;
beforeAll(() => { vi.stubEnv("POSTGRES_URL", "pglite://add-connector-test"); });
beforeEach(async () => {
  const ctx = await createTestRepository();
  testCleanup = ctx.cleanup;
});

const resetRuntimeService = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

afterEach(async () => {
  resetRuntimeService();
  await testCleanup();
});

describe("POST /api/add-connector", () => {
  it("stores submitted provider information as an in-app notification", async () => {
    vi.stubEnv("ADMIN_EMAIL", "ops@example.com");

    const response = await POST(
      new Request("http://localhost:3000/api/add-connector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterName: "Casey",
          requesterEmail: "casey@example.com",
          providerName: "HubSpot",
          providerSlug: "hubspot",
          providerUrl: "https://app.hubspot.com",
          docsUrl: "https://developers.hubspot.com/docs/api/oauth-quickstart-guide",
          authorizationUrl: "https://app.hubspot.com/oauth/authorize",
          tokenUrl: "https://api.hubapi.com/oauth/v1/token",
          scopes: "crm.objects.contacts.read, crm.objects.contacts.write",
          useCase: "Create follow-up tasks after support calls.",
          notes: "Needs sandbox and production tenants.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      detail: string;
      notification: { recipient: string; metadata: { scopes: string[] } };
    };
    expect(body.detail).toContain("contact ops@example.com");
    expect(body.notification.recipient).toBe("ops@example.com");
    expect(body.notification.metadata.scopes).toEqual([
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
    ]);

    const notificationsResponse = await getNotifications();
    const notifications = (await notificationsResponse.json()) as Array<{
      recipient: string;
      subject: string;
      metadata: { providerName: string; useCase: string };
    }>;

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      recipient: "ops@example.com",
      subject: "Connector request: HubSpot",
      metadata: {
        providerName: "HubSpot",
        useCase: "Create follow-up tasks after support calls.",
      },
    });
  });
});
