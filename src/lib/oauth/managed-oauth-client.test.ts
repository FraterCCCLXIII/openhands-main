import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContextLayerError } from "@/src/lib/core/errors";
import {
  encryptManagedOAuthClient,
  readManagedOAuthClient,
  registerManagedOAuthClient,
  requireManagedOAuthClient,
  usesDynamicOAuthClientRegistration,
} from "@/src/lib/oauth/managed-oauth-client";
import type { GenericOAuthConfig, ManagedConnectorRecord } from "@/src/types/context-layer";

const createConnector = (
  overrides: Partial<Pick<ManagedConnectorRecord, "name" | "oauthConfig" | "encryptedOAuthClient">> = {},
) => ({
  name: "Webflow",
  oauthConfig: {
    authorizationUrl: "https://mcp.webflow.com/oauth/authorize",
    tokenUrl: "https://mcp.webflow.com/oauth/token",
    registrationUrl: "https://mcp.webflow.com/oauth/register",
    scopes: [],
    clientAuthentication: "none",
  } satisfies GenericOAuthConfig,
  encryptedOAuthClient: undefined,
  ...overrides,
});

describe("managed-oauth-client", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    vi.stubEnv("AUTH_REDIRECT_PROXY_URL", "https://stable.example.dev/preview");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("detects when dynamic OAuth client registration is supported", () => {
    expect(usesDynamicOAuthClientRegistration(undefined)).toBe(false);
    expect(
      usesDynamicOAuthClientRegistration({
        clientAuthentication: "basic",
        registrationUrl: "https://mcp.webflow.com/oauth/register",
      }),
    ).toBe(false);
    expect(
      usesDynamicOAuthClientRegistration({
        clientAuthentication: "none",
      }),
    ).toBe(false);
    expect(
      usesDynamicOAuthClientRegistration({
        clientAuthentication: "none",
        registrationUrl: "https://mcp.webflow.com/oauth/register",
      }),
    ).toBe(true);
  });

  it("reads stored client credentials, trimming blank secret values", () => {
    const connector = createConnector({
      encryptedOAuthClient: encryptManagedOAuthClient({
        clientId: " webflow-client ",
        clientSecret: "   ",
      }),
    });

    expect(readManagedOAuthClient(connector)).toEqual({ clientId: "webflow-client" });
  });

  it("returns null when no stored managed OAuth client exists", () => {
    expect(readManagedOAuthClient(createConnector())).toBeNull();
  });

  it("rejects stored OAuth clients without a client id", () => {
    const connector = createConnector({
      encryptedOAuthClient: encryptManagedOAuthClient({ clientId: "   " }),
    });

    expect(() => readManagedOAuthClient(connector)).toThrowError(
      new ContextLayerError("Webflow is missing stored OAuth client credentials.", 500),
    );
  });

  it("requires stored credentials and a secret for confidential clients", () => {
    expect(() =>
      requireManagedOAuthClient(
        createConnector({
          encryptedOAuthClient: undefined,
        }),
      ),
    ).toThrowError(new ContextLayerError("Webflow is missing stored OAuth client credentials.", 500));

    expect(
      requireManagedOAuthClient(
        createConnector({
          encryptedOAuthClient: encryptManagedOAuthClient({ clientId: "public-client" }),
        }),
      ),
    ).toEqual({ clientId: "public-client" });

    expect(() =>
      requireManagedOAuthClient(
        createConnector({
          oauthConfig: {
            authorizationUrl: "https://accounts.example.com/oauth/authorize",
            tokenUrl: "https://accounts.example.com/oauth/token",
            scopes: ["profile.read"],
            clientAuthentication: "basic",
          },
          encryptedOAuthClient: encryptManagedOAuthClient({ clientId: "confidential-client" }),
        }),
      ),
    ).toThrowError(new ContextLayerError("Webflow is missing stored OAuth client credentials.", 500));
  });

  it("rejects automatic registration for connectors without dynamic OAuth support", async () => {
    await expect(
      registerManagedOAuthClient({
        connectorName: "Notion",
        slug: "notion",
        oauthConfig: {
          authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
          tokenUrl: "https://api.notion.com/v1/oauth/token",
          scopes: ["read"],
          clientAuthentication: "basic",
        },
      }),
    ).rejects.toThrowError(
      new ContextLayerError("Notion does not support automatic OAuth client registration.", 500),
    );
  });

  it("registers a public managed OAuth client using the stable callback origin", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          client_id: "webflow-public-client",
          client_secret: "   ",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      registerManagedOAuthClient({
        connectorName: "Webflow",
        slug: "webflow",
        oauthConfig: createConnector().oauthConfig as GenericOAuthConfig,
      }),
    ).resolves.toEqual({ clientId: "webflow-public-client" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://mcp.webflow.com/oauth/register");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(init.body))).toEqual({
      client_name: "OpenHands Context Layer (Webflow)",
      redirect_uris: ["https://stable.example.dev/api/oauth/webflow/callback"],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    });
  });

  it("normalizes dynamic registration failures and invalid responses", async () => {
    const fetchMock = vi
      .fn(async () => new Response("", { status: 400, statusText: "Bad Request" }))
      .mockImplementationOnce(
        async () => new Response("", { status: 400, statusText: "Bad Request" }),
      )
      .mockImplementationOnce(async () => new Response("not-json", { status: 200 }))
      .mockImplementationOnce(async () => new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      registerManagedOAuthClient({
        connectorName: "Webflow",
        slug: "webflow",
        oauthConfig: createConnector().oauthConfig as GenericOAuthConfig,
      }),
    ).rejects.toThrowError(
      new ContextLayerError("Webflow OAuth client registration failed (400): Bad Request", 502),
    );

    await expect(
      registerManagedOAuthClient({
        connectorName: "Webflow",
        slug: "webflow",
        oauthConfig: createConnector().oauthConfig as GenericOAuthConfig,
      }),
    ).rejects.toThrowError(
      new ContextLayerError("Webflow OAuth client registration returned an invalid response.", 502),
    );

    await expect(
      registerManagedOAuthClient({
        connectorName: "Webflow",
        slug: "webflow",
        oauthConfig: createConnector().oauthConfig as GenericOAuthConfig,
      }),
    ).rejects.toThrowError(
      new ContextLayerError("Webflow OAuth client registration did not return a client_id.", 502),
    );
  });
});
