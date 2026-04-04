// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useSearchParamsMock } = vi.hoisted(() => ({
  useSearchParamsMock: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: useSearchParamsMock,
}));

import { IntegrationWizard } from "@/src/components/integrations/wizard/wizard";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const setInputValue = (element: HTMLInputElement | undefined, value: string) => {
  if (!element) {
    throw new Error("Expected input element");
  }

  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("IntegrationWizard", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/built-in-connectors") {
        return new Response(
          JSON.stringify([
            {
              slug: "github",
              name: "GitHub",
              description: "GitHub connector",
              toolCount: 4,
              categories: ["Engineering"],
              authModes: ["bearer"],
              authStrategy: "bearer",
              oauthConfigured: true,
              credentialLabel: "GitHub token",
              credentialPlaceholder: "ghp_...",
              credentialHelp: "Use a GitHub token.",
            },
            {
              slug: "notion",
              name: "Notion",
              description: "Notion connector",
              toolCount: 3,
              categories: ["Knowledge base"],
              authModes: ["oauth2"],
              authStrategy: "oauth2",
              oauthConfigured: false,
              credentialLabel: "Connect Notion",
              credentialPlaceholder: "Connect Notion",
              credentialHelp: "Connect Notion.",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/oauth/connections") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    queryClient.clear();
    container.remove();
    vi.unstubAllGlobals();
    useSearchParamsMock.mockReset();
  });

  it("shows only ready built-in connectors and links users to admin-integrations", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <IntegrationWizard onCreated={async () => {}} onStatus={() => {}} />
        </QueryClientProvider>,
      );
    });

    const builtInButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Built-in connector"),
    );
    expect(builtInButton).toBeTruthy();

    await act(async () => {
      builtInButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/integrations/built-in-connectors",
      undefined,
    );

    const options = Array.from(container.querySelectorAll("datalist option")).map(
      (option) => option.getAttribute("value"),
    );
    expect(options).toEqual(["GitHub (github)"]);

    const addConnectorLink = container.querySelector('a[href="/admin-integrations"]');
    expect(addConnectorLink?.textContent).toContain("Click here");
    expect(container.textContent).not.toContain("Notion (notion)");
  });

  it("discovers default API-key connectors with their configured header name", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/built-in-connectors") {
        return new Response(
          JSON.stringify([
            {
              slug: "elevenlabs",
              name: "ElevenLabs",
              description: "ElevenLabs connector",
              toolCount: 0,
              categories: ["Audio", "AI"],
              authModes: ["api_key"],
              authStrategy: "api_key",
              oauthConfigured: true,
              credentialLabel: "ElevenLabs API key",
              credentialPlaceholder: "Paste your ElevenLabs API key",
              credentialHelp: "Personal or workspace ElevenLabs API key sent in the xi-api-key header.",
              apiKeyHeaderName: "xi-api-key",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/oauth/connections") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/discover") {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBeTruthy();
        expect(JSON.parse(String(init?.body))).toMatchObject({
          key: "elevenlabs",
          kind: "built_in",
          config: {
            builtInSlug: "elevenlabs",
          },
          credentials: {
            headerName: "xi-api-key",
            secret: "eleven-secret",
          },
        });

        return new Response(
          JSON.stringify({
            provider: "http",
            authStrategy: "api_key",
            config: {
              builtInSlug: "elevenlabs",
              apiBaseUrl: "https://api.elevenlabs.io",
            },
            credentials: {
              headerName: "xi-api-key",
              secret: "eleven-secret",
            },
            functions: {
              list_models: {
                name: "list_models",
                description: "List models",
                enabled: true,
                accessMode: "enabled",
                fineGrainedPermissions: true,
                defaultScopes: [],
                executionMode: "provider",
                config: {
                  request: {
                    method: "GET",
                    path: "/v1/models",
                  },
                },
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    useSearchParamsMock.mockReturnValue(new URLSearchParams("builtIn=elevenlabs"));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <IntegrationWizard onCreated={async () => {}} onStatus={() => {}} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain("xi-api-key");

    const apiKeyInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.getAttribute("placeholder") === "Paste your ElevenLabs API key",
    ) as HTMLInputElement | undefined;
    expect(apiKeyInput).toBeTruthy();

    await act(async () => {
      setInputValue(apiKeyInput, "eleven-secret");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const discoverButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Discover tools"),
    );
    expect(discoverButton).toBeTruthy();
    expect(discoverButton?.hasAttribute("disabled")).toBe(false);

    await act(async () => {
      discoverButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(container.textContent).toContain("1 tool discovered for ElevenLabs");
    expect(container.textContent).toContain("list_models");
  });


  it("refetches the connector catalog when step 2 opens even if React Query has cached data", async () => {
    queryClient.setQueryData(["built-in-connectors"], [
      {
        slug: "github",
        name: "GitHub",
        description: "GitHub connector",
        toolCount: 4,
        categories: ["Engineering"],
        authModes: ["bearer"],
        authStrategy: "bearer",
        oauthConfigured: true,
        credentialLabel: "GitHub token",
        credentialPlaceholder: "ghp_...",
        credentialHelp: "Use a GitHub token.",
      },
    ]);
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/built-in-connectors") {
        return new Response(
          JSON.stringify([
            {
              slug: "github",
              name: "GitHub",
              description: "GitHub connector",
              toolCount: 4,
              categories: ["Engineering"],
              authModes: ["bearer"],
              authStrategy: "bearer",
              oauthConfigured: true,
              credentialLabel: "GitHub token",
              credentialPlaceholder: "ghp_...",
              credentialHelp: "Use a GitHub token.",
            },
            {
              slug: "notion",
              name: "Notion",
              description: "Notion connector",
              toolCount: 3,
              categories: ["Knowledge base"],
              authModes: ["oauth2"],
              authStrategy: "oauth2",
              oauthConfigured: true,
              credentialLabel: "Connect Notion",
              credentialPlaceholder: "Connect Notion",
              credentialHelp: "Connect Notion.",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/oauth/connections") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <IntegrationWizard onCreated={async () => {}} onStatus={() => {}} />
        </QueryClientProvider>,
      );
    });

    const builtInButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Built-in connector"),
    );
    expect(builtInButton).toBeTruthy();

    await act(async () => {
      builtInButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/integrations/built-in-connectors",
      undefined,
    );

    const options = Array.from(container.querySelectorAll("datalist option")).map(
      (option) => option.getAttribute("value"),
    );
    expect(options).toEqual(["GitHub (github)", "Notion (notion)"]);
  });

  it("advances to review access defaults after discovering a connected Notion workspace", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/built-in-connectors") {
        return new Response(
          JSON.stringify([
            {
              slug: "notion",
              name: "Notion",
              description: "Notion connector",
              toolCount: 3,
              categories: ["Knowledge base"],
              authModes: ["oauth2"],
              authStrategy: "oauth2",
              oauthConfigured: true,
              credentialLabel: "Connect Notion",
              credentialPlaceholder: "Connect Notion",
              credentialHelp: "Connect Notion.",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/oauth/connections") {
        return new Response(
          JSON.stringify([
            {
              integrationKey: "notion",
              provider: "notion",
              authStrategy: "oauth2",
              scopes: [],
              metadata: {},
              displayName: "Connected Notion workspace",
              createdAt: "2026-03-09T00:00:00.000Z",
              updatedAt: "2026-03-09T00:00:00.000Z",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/integrations/discover") {
        expect(init?.method).toBe("POST");
        return new Response(
          JSON.stringify({
            provider: "mcp",
            authStrategy: "oauth2",
            config: {
              builtInSlug: "notion",
              serverUrl: "https://mcp.notion.com/mcp",
            },
            credentials: {},
            functions: {
              searchPages: {
                name: "searchPages",
                description: "Search Notion pages",
                enabled: true,
                accessMode: "enabled",
                fineGrainedPermissions: true,
                defaultScopes: [],
                executionMode: "provider",
                config: {
                  toolName: "searchPages",
                },
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    useSearchParamsMock.mockReturnValue(new URLSearchParams("builtIn=notion"));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <IntegrationWizard onCreated={async () => {}} onStatus={() => {}} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const discoverButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Discover tools"),
    );
    expect(discoverButton).toBeTruthy();
    expect(discoverButton?.hasAttribute("disabled")).toBe(false);

    await act(async () => {
      discoverButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(container.textContent).toContain("1 tool discovered for Notion");
    expect(container.textContent).toContain("searchPages");
  });

  it("renders searchable bulk access controls with alphabetized compact review rows", async () => {
    const onCreated = vi.fn(async () => {});
    let createPayload: Record<string, unknown> | null = null;

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/built-in-connectors") {
        return new Response(
          JSON.stringify([
            {
              slug: "github",
              name: "GitHub",
              description: "GitHub connector",
              toolCount: 4,
              categories: ["Engineering"],
              authModes: ["bearer"],
              authStrategy: "bearer",
              oauthConfigured: true,
              credentialLabel: "GitHub token",
              credentialPlaceholder: "ghp_...",
              credentialHelp: "Use a GitHub token.",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/oauth/connections") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/discover") {
        return new Response(
          JSON.stringify({
            provider: "mcp",
            authStrategy: "bearer",
            config: {
              builtInSlug: "github",
              serverUrl: "https://api.githubcopilot.com/mcp/",
            },
            credentials: {
              accessToken: "ghp_test_token",
            },
            functions: {
              searchPages: {
                name: "searchPages",
                description: "Search all pages",
                enabled: true,
                accessMode: "enabled",
                fineGrainedPermissions: true,
                defaultScopes: ["pages:read"],
                executionMode: "provider",
                config: { toolName: "searchPages" },
              },
              archiveDatabase: {
                name: "archiveDatabase",
                description: "Archive a database",
                enabled: true,
                accessMode: "enabled",
                fineGrainedPermissions: true,
                defaultScopes: ["databases:write"],
                executionMode: "provider",
                config: { toolName: "archiveDatabase" },
              },
              createPage: {
                name: "createPage",
                description: "Create a page",
                enabled: true,
                accessMode: "enabled",
                fineGrainedPermissions: true,
                defaultScopes: ["pages:write"],
                executionMode: "provider",
                config: { toolName: "createPage" },
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/integrations") {
        createPayload = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    useSearchParamsMock.mockReturnValue(new URLSearchParams("builtIn=github"));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <IntegrationWizard onCreated={onCreated} onStatus={() => {}} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const tokenInput = Array.from(container.querySelectorAll("input")).find(
      (input) => input.getAttribute("placeholder") === "ghp_...",
    ) as HTMLInputElement | undefined;
    expect(tokenInput).toBeTruthy();

    await act(async () => {
      setInputValue(tokenInput, "ghp_test_token");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const clickButton = async (label: string) => {
      const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
        candidate.textContent?.includes(label),
      );
      expect(button, `Missing button: ${label}`).toBeTruthy();

      await act(async () => {
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    };

    const getVisibleFunctionNames = () =>
      Array.from(container.querySelectorAll("[data-tool-name]")).map((row) =>
        row.getAttribute("data-tool-name"),
      );

    const getFunctionCheckbox = (name: string) =>
      container.querySelector(`input[aria-label="Select ${name}"]`) as
        | HTMLInputElement
        | null;

    const getFunctionMode = (name: string) =>
      container
        .querySelector(`[data-tool-name="${name}"] [data-access-mode]`)
        ?.getAttribute("data-access-mode");

    await clickButton("Discover tools");

    expect(getVisibleFunctionNames()).toEqual([
      "archiveDatabase",
      "createPage",
      "searchPages",
    ]);

    const searchInput = container.querySelector(
      'input[type="search"][aria-label="Search tools"]',
    ) as HTMLInputElement | null;
    expect(searchInput).toBeTruthy();

    await act(async () => {
      setInputValue(searchInput ?? undefined, "page");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getVisibleFunctionNames()).toEqual(["createPage", "searchPages"]);

    await clickButton("Select all matches");

    await act(async () => {
      setInputValue(searchInput ?? undefined, "");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getFunctionCheckbox("archiveDatabase")?.checked).toBe(false);
    expect(getFunctionCheckbox("createPage")?.checked).toBe(true);
    expect(getFunctionCheckbox("searchPages")?.checked).toBe(true);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "page");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await clickButton("Disable selected");
    expect(getFunctionMode("createPage")).toBe("disabled");
    expect(getFunctionMode("searchPages")).toBe("disabled");
    expect(getFunctionCheckbox("createPage")?.checked).toBe(false);
    expect(getFunctionCheckbox("searchPages")?.checked).toBe(false);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "search");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await clickButton("Select all matches");
    await clickButton("Case-by-case selected");
    expect(getFunctionMode("searchPages")).toBe("approval_required");
    expect(getFunctionCheckbox("searchPages")?.checked).toBe(false);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "archive");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await clickButton("Select all matches");
    await clickButton("Enable selected");
    expect(getFunctionCheckbox("archiveDatabase")?.checked).toBe(false);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getFunctionMode("archiveDatabase")).toBe("enabled");
    expect(getFunctionMode("createPage")).toBe("disabled");
    expect(getFunctionMode("searchPages")).toBe("approval_required");

    await clickButton("Create integration");

    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(createPayload).toMatchObject({
      key: "github",
      name: "GitHub",
      functions: {
        archiveDatabase: expect.objectContaining({
          accessMode: "enabled",
          enabled: true,
        }),
        createPage: expect.objectContaining({
          accessMode: "disabled",
          enabled: false,
        }),
        searchPages: expect.objectContaining({
          accessMode: "approval_required",
          enabled: true,
        }),
      },
    });
  });

  it("shows bearer credential input without API key header name for Ordinal", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/built-in-connectors") {
        return new Response(
          JSON.stringify([
            {
              slug: "ordinal",
              name: "Ordinal",
              description: "Social media management via Ordinal MCP",
              toolCount: 0,
              categories: ["Social media", "Analytics"],
              authModes: ["bearer"],
              authStrategy: "bearer",
              oauthConfigured: true,
              credentialLabel: "Ordinal API key",
              credentialPlaceholder: "Paste your Ordinal API key",
              credentialHelp:
                "Personal or workspace Ordinal API key from https://app.tryordinal.com.",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/oauth/connections") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    useSearchParamsMock.mockReturnValue(new URLSearchParams("builtIn=ordinal"));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <IntegrationWizard onCreated={async () => {}} onStatus={() => {}} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain("Ordinal API key");
    expect(container.textContent).not.toContain("API key header name");
  });

  it("shows inline transport diagnostics when function discovery fails", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/built-in-connectors") {
        return new Response(
          JSON.stringify([
            {
              slug: "notion",
              name: "Notion",
              description: "Notion connector",
              toolCount: 3,
              categories: ["Knowledge base"],
              authModes: ["oauth2"],
              authStrategy: "oauth2",
              oauthConfigured: true,
              credentialLabel: "Connect Notion",
              credentialPlaceholder: "Connect Notion",
              credentialHelp: "Connect Notion.",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/oauth/connections") {
        return new Response(
          JSON.stringify([
            {
              integrationKey: "notion",
              provider: "notion",
              authStrategy: "oauth2",
              scopes: [],
              metadata: {},
              displayName: "Connected Notion workspace",
              createdAt: "2026-03-09T00:00:00.000Z",
              updatedAt: "2026-03-09T00:00:00.000Z",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/integrations/discover") {
        return new Response(
          JSON.stringify({
            detail:
              "Streamable HTTP transport failed for https://mcp.notion.com/mcp: Timed out connecting. SSE transport failed for https://mcp.notion.com/sse: 401 Unauthorized.",
            debug: {
              operationName: "listTools",
              auth: {
                authStrategy: "oauth2",
                accessToken: {
                  present: true,
                  length: 212,
                  containsWhitespace: false,
                  startsWithBearerPrefix: false,
                },
              },
              attempts: [
                {
                  transport: "streamable_http",
                  url: "https://mcp.notion.com/mcp",
                  error:
                    "Streamable HTTP transport failed for https://mcp.notion.com/mcp: Timed out connecting.",
                },
                {
                  transport: "sse",
                  url: "https://mcp.notion.com/sse",
                  error:
                    "SSE transport failed for https://mcp.notion.com/sse: 401 Unauthorized.",
                },
              ],
            },
          }),
          { status: 504, headers: { "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    useSearchParamsMock.mockReturnValue(new URLSearchParams("builtIn=notion"));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <IntegrationWizard onCreated={async () => {}} onStatus={() => {}} />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const discoverButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Discover tools"),
    );
    expect(discoverButton).toBeTruthy();
    expect(discoverButton?.hasAttribute("disabled")).toBe(false);

    await act(async () => {
      discoverButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    const feedback = container.querySelector('[data-testid="discover-feedback"]');
    expect(feedback?.textContent).toContain("Discover failed:");
    expect(feedback?.textContent).toContain("Streamable HTTP transport failed");
    expect(feedback?.textContent).toContain("SSE transport failed");
    expect(feedback?.textContent).toContain("Admin diagnostics");
    expect(feedback?.textContent).toContain('"startsWithBearerPrefix": false');
    expect(feedback?.textContent).toContain('"operationName": "listTools"');
    expect(container.textContent).toContain("Connect and discover tools");
  });


});
