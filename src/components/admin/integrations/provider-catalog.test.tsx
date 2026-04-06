// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProviderCatalog } from "@/src/components/admin/integrations/provider-catalog";
import type {
  BuiltInConnectorOption,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const readyBuiltInConnectors: BuiltInConnectorOption[] = [
  {
    slug: "github",
    name: "GitHub",
    description: "GitHub connector",
    toolCount: 4,
    categories: ["Engineering"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "Connect GitHub",
    credentialPlaceholder: "Connect GitHub",
    credentialHelp: "Connect GitHub with OAuth.",
  },
];

const oauthCallbackBaseUrl = "https://openhands-context-layer.vercel.app/api/oauth";

const providerCatalog: OAuthProviderCatalogOption[] = [
  {
    slug: "github",
    name: "GitHub",
    description: "GitHub repositories and pull requests",
    categories: ["Engineering"],
    authStrategy: "oauth2",
    availability: "oauth_ready",
    builtInSlug: "github",
    appUrl: "https://github.com",
    docsUrl: "https://docs.github.com/apps/oauth-apps",
    notes: "Available now as a built-in connector.",
    popularityRank: 1,
  },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Calendar events and schedules",
    categories: ["Productivity"],
    authStrategy: "oauth2",
    availability: "planned",
    docsUrl: "https://developers.google.com/identity/protocols/oauth2",
    notes: "Useful for scheduling workflows.",
    popularityRank: 2,
    registrationDefaults: {
      provider: "http",
      apiBaseUrl: "https://www.googleapis.com/calendar/v3",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      toolName: "list_events",
      toolDescription: "List events from the user's primary Google Calendar.",
      requestMethod: "GET",
      requestPath: "/calendars/primary/events",
    },
  },
  {
    slug: "notion",
    name: "Notion",
    description: "Workspace search, pages, databases, and knowledge management",
    categories: ["Knowledge base"],
    authStrategy: "oauth2",
    availability: "oauth_ready",
    builtInSlug: "notion",
    docsUrl: "https://developers.notion.com/docs/authorization",
    notes: "Uses the official REST OpenAPI schema.",
    popularityRank: 3,
    registrationDefaults: {
      provider: "http",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      scopes: [],
    },
  },
  {
    slug: "slack",
    name: "Slack",
    description: "Channels, messaging, workflows, canvases, and operational collaboration",
    categories: ["Communication", "Operations"],
    authStrategy: "oauth2",
    availability: "oauth_ready",
    builtInSlug: "slack",
    docsUrl: "https://docs.slack.dev/ai/slack-mcp-server",
    notes: "Uses Slack's official hosted MCP server with confidential OAuth user-token auth.",
    popularityRank: 4,
    registrationDefaults: {
      provider: "mcp",
      serverUrl: "https://mcp.slack.com/mcp",
      authorizationUrl: "https://slack.com/oauth/v2_user/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.user.access",
      scopes: [
        "search:read.public",
        "search:read.private",
        "search:read.mpim",
        "search:read.im",
        "search:read.files",
        "search:read.users",
        "chat:write",
        "channels:history",
        "groups:history",
        "mpim:history",
        "im:history",
        "canvases:read",
        "canvases:write",
        "users:read",
        "users:read.email",
      ],
      clientAuthentication: "body",
      pkce: true,
    },
  },
  {
    slug: "webflow",
    name: "Webflow",
    description: "CMS items, sites, and web publishing workflows.",
    categories: ["CMS", "Marketing"],
    authStrategy: "oauth2",
    availability: "oauth_ready",
    builtInSlug: "webflow",
    docsUrl: "https://developers.webflow.com/mcp/reference/getting-started",
    notes: "Uses Webflow's hosted MCP server and deployment-scoped OAuth registration.",
    popularityRank: 5,
    registrationDefaults: {
      provider: "mcp",
      serverUrl: "https://mcp.webflow.com/mcp",
      authorizationUrl: "https://mcp.webflow.com/oauth/authorize",
      tokenUrl: "https://mcp.webflow.com/oauth/token",
      registrationUrl: "https://mcp.webflow.com/oauth/register",
      clientAuthentication: "none",
      pkce: true,
      scopes: [],
    },
  },

  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    description: "Text to speech, voices, transcription, audio generation, and agents",
    categories: ["Audio", "AI"],
    authStrategy: "api_key",
    availability: "manual_token",
    builtInSlug: "elevenlabs",
    docsUrl: "https://elevenlabs.io/docs/api-reference/introduction",
    notes: "Uses the published API schema and user API keys.",
    popularityRank: 5,
    registrationDefaults: {
      provider: "http",
      authModes: ["api_key"],
      authStrategy: "api_key",
      credentialLabel: "ElevenLabs API key",
      credentialPlaceholder: "Paste your ElevenLabs API key",
      credentialHelp: "Personal or workspace ElevenLabs API key sent in the xi-api-key header.",
      apiBaseUrl: "https://api.elevenlabs.io",
      openApiUrl: "https://api.elevenlabs.io/openapi.json",
      apiKeyHeaderName: "xi-api-key",
    },
  },
];

const setInputValue = (element: Element | null, value: string) => {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("Expected HTMLInputElement");
  }

  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("ProviderCatalog", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          slug: "google-calendar",
          oauthConfigured: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("renders a compact searchable list and lets app admins register a provider in-app", async () => {
    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
        />,
      );
    });

    expect(container.textContent).toContain("Search curated adaptors");
    expect(container.textContent).toContain("GitHub(github)");
    expect(container.textContent).toContain("Show details");
    expect(container.textContent).not.toContain("Example API call");

    const searchInput = container.querySelector('input[type="search"]');
    await act(async () => {
      setInputValue(searchInput, "calendar");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("Google Calendar");
    expect(container.textContent).not.toContain("GitHub repositories and pull requests");

    const calendarButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Google Calendar"),
    );
    expect(calendarButton).toBeTruthy();

    await act(async () => {
      calendarButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Register this provider");
    expect(container.textContent).toContain(
      "Enter the REST API details below to register this connector once for the whole service.",
    );
    expect(container.textContent).toContain("Register connector");
    expect(container.textContent).toContain("How to create Google Calendar OAuth credentials");
    expect(container.textContent).toContain(
      `${oauthCallbackBaseUrl}/google-calendar/callback`,
    );
    expect(container.textContent).toContain(
      "The standard OAuth URLs and scopes for Google Calendar are already filled in.",
    );
    expect(container.textContent).toContain("Starter API tool:");
    expect(container.textContent).toContain("list_events");
    expect(container.textContent).toContain("GET /calendars/primary/events");
    expect(container.textContent).not.toContain("OAuth docs");
    expect(container.textContent).not.toContain("Scopes (comma separated)");
    expect(container.textContent).not.toContain("Authorization URL");
    expect(container.textContent).not.toContain("Token URL");

    const urlInputs = Array.from(container.querySelectorAll('input[type="url"]'));
    expect(urlInputs).toHaveLength(1);
    expect((urlInputs[0] as HTMLInputElement | undefined)?.value).toBe(
      "https://www.googleapis.com/calendar/v3",
    );
    expect(container.textContent).not.toContain("MCP server URL");

    await act(async () => {
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "",
        ) ?? null,
        "calendar-client-id",
      );
      setInputValue(container.querySelector('input[type="password"]'), "calendar-client-secret");
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/managed-connectors",
      expect.objectContaining({ method: "POST" }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as {
      slug: string;
      provider: string;
      apiBaseUrl: string;
      serverUrl?: string;
      oauthConfig: {
        authorizationUrl: string;
        tokenUrl: string;
        scopes: string[];
      };
      oauthClientId: string;
      oauthClientSecret: string;
      tools: Array<{
        name: string;
        description: string;
        defaultScopes: string[];
        request: {
          method: string;
          path: string;
        };
      }>;
    };
    expect(body.slug).toBe("google-calendar");
    expect(body.provider).toBe("http");
    expect(body.apiBaseUrl).toBe("https://www.googleapis.com/calendar/v3");
    expect(body.serverUrl).toBeUndefined();
    expect(body.oauthConfig.authorizationUrl).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(body.oauthConfig.tokenUrl).toBe("https://oauth2.googleapis.com/token");
    expect(body.oauthConfig.scopes).toEqual([
      "https://www.googleapis.com/auth/calendar.readonly",
    ]);
    expect(body.oauthClientId).toBe("calendar-client-id");
    expect(body.oauthClientSecret).toBe("calendar-client-secret");
    expect(body.tools).toEqual([
      {
        name: "list_events",
        description: "List events from the user's primary Google Calendar.",
        defaultScopes: ["https://www.googleapis.com/auth/calendar.readonly"],
        request: {
          method: "GET",
          path: "/calendars/primary/events",
        },
      },
    ]);
    expect(container.textContent).toContain("Ready now");
    expect(container.textContent).toContain("Use Google Calendar");
  });

  it("registers Slack as a managed MCP connector backed by the official hosted MCP server", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: "slack",
          oauthConfigured: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
        />,
      );
    });

    const slackButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Slack"),
    );
    expect(slackButton).toBeTruthy();

    await act(async () => {
      slackButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "Enter the MCP details below to register this connector once for the whole service.",
    );
    expect(container.textContent).toContain("How to create Slack OAuth credentials");
    expect(container.textContent).toContain(`${oauthCallbackBaseUrl}/slack/callback`);
    expect(container.textContent).toContain("MCP server URL");
    expect(container.textContent).not.toContain("API base URL");
    expect(container.textContent).not.toContain("Starter API tool:");

    const urlInputs = Array.from(container.querySelectorAll('input[type="url"]'));
    expect(urlInputs).toHaveLength(1);
    expect((urlInputs[0] as HTMLInputElement | undefined)?.value).toBe(
      "https://mcp.slack.com/mcp",
    );

    await act(async () => {
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "",
        ) ?? null,
        "slack-client-id",
      );
      setInputValue(container.querySelector('input[type="password"]'), "slack-client-secret");
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const [, requestInit] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as {
      slug: string;
      provider: string;
      apiBaseUrl: string;
      serverUrl?: string;
      oauthConfig: {
        authorizationUrl: string;
        tokenUrl: string;
        clientAuthentication?: string;
        pkce?: boolean;
        scopes: string[];
      };
      oauthClientId: string;
      oauthClientSecret: string;
      tools: Array<unknown>;
    };

    expect(body).toMatchObject({
      slug: "slack",
      provider: "mcp",
      serverUrl: "https://mcp.slack.com/mcp",
      oauthClientId: "slack-client-id",
      oauthClientSecret: "slack-client-secret",
      tools: [],
    });
    expect(body.apiBaseUrl).toBeUndefined();
    expect(body.oauthConfig).toMatchObject({
      authorizationUrl: "https://slack.com/oauth/v2_user/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.user.access",
      clientAuthentication: "body",
      pkce: true,
      scopes: [
        "search:read.public",
        "search:read.private",
        "search:read.mpim",
        "search:read.im",
        "search:read.files",
        "search:read.users",
        "chat:write",
        "channels:history",
        "groups:history",
        "mpim:history",
        "im:history",
        "canvases:read",
        "canvases:write",
        "users:read",
        "users:read.email",
      ],
    });
    expect(container.textContent).toContain("Ready now");
    expect(container.textContent).toContain("Use Slack");
  });

  it("registers Webflow with deployment-scoped MCP OAuth client registration instead of manual client secrets", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: "webflow",
          oauthConfigured: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
        />,
      );
    });

    const webflowButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Webflow"),
    );
    expect(webflowButton).toBeTruthy();

    await act(async () => {
      webflowButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "Register this connector once and the deployment will create its own Webflow MCP OAuth client automatically.",
    );
    expect(container.textContent).toContain("How Webflow MCP authorization works");
    expect(container.textContent).toContain(`${oauthCallbackBaseUrl}/webflow/callback`);
    expect(container.textContent).not.toContain("OAuth client ID");
    expect(container.textContent).not.toContain("OAuth client secret");

    const urlInputs = Array.from(container.querySelectorAll('input[type="url"]'));
    expect(urlInputs).toHaveLength(1);
    expect((urlInputs[0] as HTMLInputElement | undefined)?.value).toBe(
      "https://mcp.webflow.com/mcp",
    );

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const [, requestInit] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const webflowBody = JSON.parse(String(requestInit.body)) as {
      slug: string;
      provider: string;
      serverUrl?: string;
      oauthConfig: {
        authorizationUrl: string;
        tokenUrl: string;
        registrationUrl?: string;
        clientAuthentication?: string;
        pkce?: boolean;
        scopes: string[];
      };
      oauthClientId?: string;
      oauthClientSecret?: string;
      tools: Array<unknown>;
    };

    expect(webflowBody).toMatchObject({
      slug: "webflow",
      provider: "mcp",
      serverUrl: "https://mcp.webflow.com/mcp",
      tools: [],
    });
    expect(webflowBody.oauthConfig).toMatchObject({
      authorizationUrl: "https://mcp.webflow.com/oauth/authorize",
      tokenUrl: "https://mcp.webflow.com/oauth/token",
      registrationUrl: "https://mcp.webflow.com/oauth/register",
      clientAuthentication: "none",
      pkce: true,
      scopes: [],
    });
    expect(webflowBody.oauthClientId).toBe("");
    expect(webflowBody.oauthClientSecret).toBe("");
  });


  it("registers Notion as a managed HTTP connector backed by the official OpenAPI schema", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: "notion",
          oauthConfigured: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
        />,
      );
    });

    const notionButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Notion"),
    );
    expect(notionButton).toBeTruthy();

    await act(async () => {
      notionButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Enter the REST API details below");
    expect(container.textContent).toContain("API schema source:");
    expect(container.textContent).toContain("https://developers.notion.com/openapi.json");
    expect(container.textContent).toContain("API base URL");
    expect(container.textContent).not.toContain("MCP server URL");

    const urlInput = container.querySelector('input[type="url"]');
    expect((urlInput as HTMLInputElement | null)?.value).toBe("https://api.notion.com");

    await act(async () => {
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "",
        ) ?? null,
        "notion-client-id",
      );
      setInputValue(container.querySelector('input[type="password"]'), "notion-client-secret");
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const [, requestInit] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as {
      slug: string;
      provider: string;
      apiBaseUrl: string;
      openApiUrl: string;
      serverUrl?: string;
      tools: Array<unknown>;
    };
    expect(body).toMatchObject({
      slug: "notion",
      provider: "http",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      tools: [],
    });
    expect(body.serverUrl).toBeUndefined();
  });

  it("registers ElevenLabs without requiring service-level OAuth credentials", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: "elevenlabs",
          oauthConfigured: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
        />,
      );
    });

    const elevenLabsButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("ElevenLabs"),
    );
    expect(elevenLabsButton).toBeTruthy();

    await act(async () => {
      elevenLabsButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "This provider does not require service-level OAuth client credentials.",
    );
    expect(container.textContent).toContain("How to configure ElevenLabs");
    expect(container.textContent).toContain("API schema source:");
    expect(container.textContent).not.toContain("OAuth client ID");
    expect(container.textContent).not.toContain("OAuth client secret");
    expect(container.textContent).not.toContain(`${oauthCallbackBaseUrl}/elevenlabs/callback`);

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const [, requestInit] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as {
      slug: string;
      authModes: string[];
      authStrategy: string;
      provider: string;
      apiBaseUrl: string;
      openApiUrl: string;
      credentialLabel: string;
      oauthConfig?: unknown;
      oauthClientId?: string;
      oauthClientSecret?: string;
      tools: Array<unknown>;
    };

    expect(body).toMatchObject({
      slug: "elevenlabs",
      authModes: ["api_key"],
      authStrategy: "api_key",
      provider: "http",
      apiBaseUrl: "https://api.elevenlabs.io",
      openApiUrl: "https://api.elevenlabs.io/openapi.json",
      credentialLabel: "ElevenLabs API key",
      tools: [],
    });
    expect(body.oauthConfig).toBeUndefined();
    expect(body.oauthClientId).toBeUndefined();
    expect(body.oauthClientSecret).toBeUndefined();
  });



  it("does not render legacy Composio MCP template guidance", async () => {
    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
        />,
      );
    });

    const calendarButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Google Calendar"),
    );

    await act(async () => {
      calendarButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).not.toContain("customerId=replace-me");
    expect(container.textContent).not.toContain("mcp.composio.dev");
  });

  it("requires OAuth client credentials before registering a connector", async () => {
    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl={oauthCallbackBaseUrl}
        />,
      );
    });

    const calendarButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Google Calendar"),
    );

    await act(async () => {
      calendarButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const urlInput = container.querySelector('input[type="url"]');
    await act(async () => {
      setInputValue(urlInput, "https://www.googleapis.com/calendar/v3");
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "Paste both the OAuth client ID and client secret before registering this connector. Until those are stored, it will not appear in the integrations wizard.",
    );
  });

  it("shows an access notice instead of the registration form for non-admin users", async () => {
    await act(async () => {
      root.render(
        <ProviderCatalog
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
        />,
      );
    });

    const calendarButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Google Calendar"),
    );

    await act(async () => {
      calendarButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "Only app administrators listed in APP_ADMIN_EMAILS can register providers from this page.",
    );
    expect(container.textContent).not.toContain("Register this provider");
  });
});
