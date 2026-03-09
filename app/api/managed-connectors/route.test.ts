import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as getBuiltInConnectors } from "@/app/api/integrations/built-in-connectors/route";

import { GET, POST } from "./route";

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerRepository?: unknown;
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerRepository;
  delete runtime.contextLayerService;
};

afterEach(() => {
  vi.unstubAllEnvs();
  resetRuntime();
});

describe("/api/managed-connectors", () => {
  it("stores a managed connector and exposes it through the built-in catalog", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/managed-connectors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: "acme-crm",
          name: "Acme CRM",
          description: "Configurable CRM connector",
          categories: ["CRM"],
          authStrategy: "oauth2",
          credentialLabel: "Connect Acme CRM",
          credentialPlaceholder: "Connect Acme CRM",
          credentialHelp: "Use OAuth to connect Acme CRM.",
          apiBaseUrl: "https://api.acme.test/v1",
          oauthConfig: {
            authorizationUrl: "https://auth.acme.test/authorize",
            tokenUrl: "https://auth.acme.test/token",
            scopes: ["contacts.read"],
          },
          oauthClientId: "acme-client-id",
          oauthClientSecret: "acme-client-secret",
          functions: [
            {
              name: "list_contacts",
              description: "List contacts",
              defaultScopes: ["contacts.read"],
              request: {
                method: "GET",
                path: "/contacts",
              },
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      slug: string;
      oauthConfigured?: boolean;
      encryptedOAuthClient?: string;
    };
    expect(body).toMatchObject({
      slug: "acme-crm",
      oauthConfigured: true,
    });
    expect(body.encryptedOAuthClient).toBeUndefined();

    const listResponse = await GET();
    const connectors = (await listResponse.json()) as Array<{ slug: string }>;
    expect(connectors.some((connector) => connector.slug === "acme-crm")).toBe(true);

    const builtInResponse = await getBuiltInConnectors();
    const builtIns = (await builtInResponse.json()) as Array<{
      slug: string;
      oauthConfigured?: boolean;
    }>;
    expect(builtIns).toContainEqual(
      expect.objectContaining({
        slug: "acme-crm",
        oauthConfigured: true,
      }),
    );
  });
});
