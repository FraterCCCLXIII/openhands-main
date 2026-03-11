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

import { IntegrationWizard } from "@/src/components/admin/integration-wizard";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

  it("shows only ready built-in connectors and links users to add-connector", async () => {
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

    const addConnectorLink = container.querySelector('a[href="/add-connector"]');
    expect(addConnectorLink?.textContent).toContain("Click here");
    expect(container.textContent).not.toContain("Notion (notion)");
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
      (button) => button.textContent?.includes("Discover functions"),
    );
    expect(discoverButton).toBeTruthy();
    expect(discoverButton?.hasAttribute("disabled")).toBe(false);

    await act(async () => {
      discoverButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });

    expect(container.textContent).toContain("1 functions discovered for Notion");
    expect(container.textContent).toContain("searchPages");
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
      (button) => button.textContent?.includes("Discover functions"),
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
    expect(container.textContent).toContain("Connect and discover functions");
  });


});
