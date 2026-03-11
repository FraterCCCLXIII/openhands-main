// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CuratedProviderList } from "@/src/components/admin/curated-provider-list";
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
      serverUrl:
        "https://mcp.composio.dev/partner/composio/google-calendar/mcp?customerId=replace-me",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
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

describe("CuratedProviderList", () => {
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
        <CuratedProviderList
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
      "Enter the OAuth-backed MCP details below to register this connector once for the whole service.",
    );
    expect(container.textContent).toContain("Register connector");
    expect(container.textContent).toContain("How to create Google Calendar OAuth credentials");
    expect(container.textContent).toContain(
      `${oauthCallbackBaseUrl}/google-calendar/callback`,
    );
    expect(container.textContent).toContain(
      "The standard OAuth URLs and scopes for Google Calendar are already filled in.",
    );
    expect(container.textContent).not.toContain("OAuth docs");
    expect(container.textContent).not.toContain("Scopes (comma separated)");
    expect(container.textContent).not.toContain("Authorization URL");
    expect(container.textContent).not.toContain("Token URL");
    expect(container.textContent).not.toContain("Starts with a researched");

    const urlInputs = Array.from(container.querySelectorAll('input[type="url"]'));
    expect(urlInputs).toHaveLength(1);
    expect((urlInputs[0] as HTMLInputElement | undefined)?.value).toBe(
      "https://mcp.composio.dev/partner/composio/google-calendar/mcp?customerId=replace-me",
    );
    expect(container.textContent).not.toContain("Function name");
    expect(container.textContent).not.toContain("Request path");

    await act(async () => {
      setInputValue(urlInputs[0] ?? null, "https://mcp.calendar.test/mcp");
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
      serverUrl: string;
      oauthConfig: {
        authorizationUrl: string;
        tokenUrl: string;
        scopes: string[];
      };
      oauthClientId: string;
      oauthClientSecret: string;
      functions: Array<unknown>;
    };
    expect(body.slug).toBe("google-calendar");
    expect(body.provider).toBe("mcp");
    expect(body.serverUrl).toBe("https://mcp.calendar.test/mcp");
    expect(body.oauthConfig.authorizationUrl).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(body.oauthConfig.tokenUrl).toBe("https://oauth2.googleapis.com/token");
    expect(body.oauthConfig.scopes).toEqual([
      "https://www.googleapis.com/auth/calendar.readonly",
    ]);
    expect(body.oauthClientId).toBe("calendar-client-id");
    expect(body.oauthClientSecret).toBe("calendar-client-secret");
    expect(body.functions).toEqual([]);
    expect(container.textContent).toContain("Ready now");
    expect(container.textContent).toContain("Use Google Calendar");
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
        <CuratedProviderList
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

    expect(container.textContent).toContain("Enter the OAuth-backed REST API details below");
    expect(container.textContent).toContain("OpenAPI schema source:");
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
      functions: Array<unknown>;
    };
    expect(body).toMatchObject({
      slug: "notion",
      provider: "http",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
      functions: [],
    });
    expect(body.serverUrl).toBeUndefined();
  });


  it("requires replacing researched MCP templates before registration", async () => {
    await act(async () => {
      root.render(
        <CuratedProviderList
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

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "Replace customerId=replace-me in the MCP server URL with the generated customer-specific value before registering this connector.",
    );
  });

  it("requires OAuth client credentials before registering a connector", async () => {
    await act(async () => {
      root.render(
        <CuratedProviderList
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
      setInputValue(urlInput, "https://mcp.calendar.test/mcp");
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
        <CuratedProviderList
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
