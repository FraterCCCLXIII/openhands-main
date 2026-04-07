// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, usePathnameMock, useRouterMock, useSearchParamsMock, signOutMock } =
  vi.hoisted(() => ({
    pushMock: vi.fn(),
    usePathnameMock: vi.fn(() => "/integrations"),
    useRouterMock: vi.fn(() => ({
      push: pushMock,
    })),
    useSearchParamsMock: vi.fn(() => new URLSearchParams()),
    signOutMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  useRouter: useRouterMock,
  useSearchParams: useSearchParamsMock,
}));

vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}));

import { DashboardWorkspace } from "@/src/components/dashboard/workspace";
import type {
  AccessRequest,
  ManagedConnectorOption,
  IntegrationSpec,
} from "@/src/types/context-layer";

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

const managedConnectors: ManagedConnectorOption[] = [
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    description: "Voice generation and audio tooling.",
    appUrl: "https://elevenlabs.io",
    toolCount: 4,
    categories: ["Audio"],
    authModes: ["api_key"],
    authStrategy: "api_key",
    credentialLabel: "API key",
    credentialPlaceholder: "Paste your ElevenLabs API key",
    credentialHelp: "Use an ElevenLabs API key.",
  },
  {
    slug: "github",
    name: "GitHub",
    description: "Source control, issues, and pull requests.",
    appUrl: "https://github.com",
    toolCount: 12,
    categories: ["Engineering"],
    authModes: ["bearer"],
    authStrategy: "bearer",
    credentialLabel: "Personal access token",
    credentialPlaceholder: "Paste your GitHub token",
    credentialHelp: "Use a GitHub token.",
  },
  {
    slug: "linear",
    name: "Linear",
    description: "Issue tracking and roadmap workflows.",
    appUrl: "https://linear.app",
    toolCount: 18,
    categories: ["Project management"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "OAuth",
    credentialPlaceholder: "Connect Linear",
    credentialHelp: "Connect your Linear account.",
  },
  {
    slug: "notion",
    name: "Notion",
    description: "Workspace search, pages, and databases.",
    appUrl: "https://www.notion.so",
    toolCount: 16,
    categories: ["Knowledge base"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "OAuth",
    credentialPlaceholder: "Connect Notion",
    credentialHelp: "Connect your Notion account.",
  },
  {
    slug: "slack",
    name: "Slack",
    description: "Channels, messaging, and workflows.",
    appUrl: "https://slack.com",
    toolCount: 14,
    categories: ["Communication"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "OAuth",
    credentialPlaceholder: "Connect Slack",
    credentialHelp: "Connect your Slack account.",
  },
];


describe("DashboardWorkspace", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    usePathnameMock.mockImplementation(() => "/integrations");
    useRouterMock.mockImplementation(() => ({
      push: pushMock,
    }));
    useSearchParamsMock.mockImplementation(() => new URLSearchParams());

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Number.POSITIVE_INFINITY,
        },
      },
    });
    fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    queryClient.clear();
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    pushMock.mockReset();
    usePathnameMock.mockReset();
    useRouterMock.mockReset();
    useSearchParamsMock.mockReset();
    signOutMock.mockReset();
  });

  it("shows an Admin sidebar link to the admin-integrations page", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    const adminLink = container.querySelector('a[href="/admin-integrations"]');
    expect(adminLink).toBeTruthy();
    expect(adminLink?.textContent).toContain("Admin integrations");
  });


  it("shows only a personal active integrations view for non-admin users", async () => {
    usePathnameMock.mockReturnValue("/integrations");
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    const integrationsState: IntegrationSpec[] = [
      {
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
        enabled: true,
        fineGrainedPermissions: true,
        config: {},
        credentials: {},
        tools: {
          slack_search_public: {
            name: "slack_search_public",
            description: "Search public Slack messages",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
          },
        },
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (
        url === "/api/integrations" ||
        url === "/api/case-by-case-approvals" ||
        url === "/api/notifications" ||
        url === "/api/integrations/managed-connectors"
      ) {
        return new Response(
          JSON.stringify(
            url === "/api/integrations"
              ? integrationsState
              : url === "/api/integrations/managed-connectors"
                ? managedConnectors
                : [],
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsState}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "User", email: "user@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            isAdmin={false}
          />
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("Your integrations");
    expect(container.textContent).not.toContain(
      "Connect accounts, enable integrations, and tune tool access for your personal key.",
    );
    const adminIntegrationLinks = Array.from(
      container.querySelectorAll('a[href="/admin-integrations"]'),
    );
    expect(
      adminIntegrationLinks.some((link) => link.textContent?.includes("Admin integrations")),
    ).toBe(false);
    expect(
      adminIntegrationLinks.some((link) => link.textContent?.includes("Click here")),
    ).toBe(true);
    expect(container.textContent).toContain("Add integration");
    expect(container.textContent).toContain("Disable");
    expect(container.textContent).toContain("Delete");
    expect(container.textContent).toContain("enabled");
  });

  it("deletes an installed integration from the your integrations list", async () => {
    let integrationsState: IntegrationSpec[] = [
      {
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
        enabled: true,
        fineGrainedPermissions: true,
        config: {},
        credentials: {},
        tools: {},
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (
        url === "/api/case-by-case-approvals" ||
        url === "/api/notifications" ||
        url === "/api/integrations/managed-connectors"
      ) {
        return new Response(
          JSON.stringify(
            url === "/api/integrations/managed-connectors" ? managedConnectors : [],
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/integrations" && method === "GET") {
        return new Response(JSON.stringify(integrationsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/slack" && method === "DELETE") {
        integrationsState = [];
        return new Response(JSON.stringify({ deleted: true, key: "slack" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    const confirmMock = vi.fn(() => true);
    vi.stubGlobal("confirm", confirmMock);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsState}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "User", email: "user@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            isAdmin={false}
          />
        </QueryClientProvider>,
      );
    });

    const deleteButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Delete"),
    );
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(confirmMock).toHaveBeenCalledWith(
      'Delete the integration "Slack"? This removes it from your personal dashboard and disconnects any saved credentials for this tool.',
    );
    expect(container.textContent).toContain("Slack deleted.");
    expect(container.querySelector('[data-integration-key="slack"]')).toBeNull();
  });

  it("renders canonical section links in the shared sidebar", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    const profileLink = Array.from(container.querySelectorAll('a[href="/profile"]')).find(
      (link) => link.textContent?.includes("User Profile"),
    );
    expect(profileLink).toBeTruthy();
    expect(profileLink?.getAttribute("href")).toBe("/profile");
  });

  it("shows integrations as the default section with a searchable add-integration panel", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/managed-connectors") {
        return new Response(JSON.stringify(managedConnectors), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(container.querySelector("h1")?.textContent).toBe("Integrations");
    expect(container.textContent).toContain("Add integration");
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).toContain("Slack");
    expect(container.querySelector('input[aria-label="Search integrations"]')).toBeTruthy();
    expect(
      Array.from(container.querySelectorAll('a[href="/admin-integrations"]')).some(
        (link) => link.textContent?.includes("Click here"),
      ),
    ).toBe(true);
    expect(container.textContent).not.toContain("Home");
    expect(container.textContent).not.toContain("Getting started");
    expect(container.textContent).not.toContain("Search popular integrations");
  });

  it("hides already installed integrations from the add integration list", async () => {
    const integrationsState: IntegrationSpec[] = [
      {
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
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/managed-connectors") {
        return new Response(JSON.stringify(managedConnectors), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations") {
        return new Response(JSON.stringify(integrationsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsState}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const addMenuSlugs = Array.from(container.querySelectorAll("[data-managed-connector-slug]")).map(
      (element) => element.getAttribute("data-managed-connector-slug"),
    );

    expect(addMenuSlugs).not.toContain("github");
    expect(addMenuSlugs).toEqual(["slack", "notion", "linear", "elevenlabs"]);
    expect(container.textContent).toContain("4 available");
  });

  it("opens the setup flow from a marketplace card and keeps the selection in the URL", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/managed-connectors") {
        return new Response(JSON.stringify(managedConnectors), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        url === "/api/integrations" ||
        url === "/api/case-by-case-approvals" ||
        url === "/api/notifications" ||
        url === "/api/oauth/connections"
      ) {
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
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const githubCard = container.querySelector('[data-managed-connector-slug="github"]');
    expect(githubCard).toBeTruthy();

    await act(async () => {
      githubCard?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Step-by-step integration setup");
    expect(pushMock).toHaveBeenCalledWith(
      "/integrations?showIntegrationWizard=1&managedConnector=github",
    );
  });

  it("keeps OAuth callback errors visible after the wizard auto-selects the connector", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations/managed-connectors") {
        return new Response(JSON.stringify(managedConnectors), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        url === "/api/integrations" ||
        url === "/api/case-by-case-approvals" ||
        url === "/api/notifications" ||
        url === "/api/oauth/connections"
      ) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        showIntegrationWizard: "1",
        managedConnector: "notion",
        oauth_provider: "webflow",
        oauth_status: "error",
        oauth_error:
          'Webflow token exchange failed (400): {"error":"invalid_client"}',
      }),
    );

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain("Step-by-step integration setup");
    expect(container.textContent).toContain(
      'Webflow token exchange failed (400): {"error":"invalid_client"}',
    );
  });

  it("shows a combined keys card with connection details on the top-level agent connection route", async () => {
    usePathnameMock.mockReturnValue("/agent-connection");

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            userApiKey={{
              keyPrefix: "clu_12345678",
              keySuffix: "mnop",
              createdAt: "2026-03-29T10:00:00.000Z",
              updatedAt: "2026-03-29T10:00:00.000Z",
            }}
            adminApiKey={{
              keyPrefix: "clad_123456",
              keySuffix: "wxyz",
              createdAt: "2026-03-29T10:00:00.000Z",
              updatedAt: "2026-03-29T10:00:00.000Z",
            }}
          />
        </QueryClientProvider>,
      );
    });

    const text = container.textContent ?? "";
    expect(text).toContain("API keys");
    expect(text).toContain("Agent key");
    expect(text).toContain("Give this key to your agent.");
    expect(text).toContain("User automation key");
    expect(text).toContain(
      "Use this key to programmatically manage user-scoped context-layer settings.",
    );
    expect(text).toContain("Admin automation key");
    expect(text).toContain(
      "Use this key for admin-only QA and operational automation surfaces.",
    );
    expect(text).toContain("Connection details");
    expect(text).toContain("Agent MCP");
    expect(text).toContain("MCP config example");
    expect(text).toContain('"transport": "streamable-http"');
    expect(text).toContain('"context-layer"');
    expect(text).toContain("Agent REST API");
    expect(text).toContain("User REST API");
    expect(text).toContain("Admin REST API");
    expect(text).toContain("https://example.com/api/mcp");
    expect(text).toContain("https://example.com/api/context/openapi");
    expect(text).toContain("https://example.com/api/user/openapi");
    expect(text).toContain("https://example.com/api/admin/openapi");
    expect(text).toContain("I have provided you with an API key in $OPENHANDS_CONTEXT_LAYER_KEY");
    expect(text).toContain("I have provided you with a user API key in $OPENHANDS_CONTEXT_LAYER_USER_KEY");
    expect(text).toContain("I have provided you with an admin API key in $OPENHANDS_CONTEXT_LAYER_ADMIN_KEY");
    expect(text).not.toContain("Works with /api/context/*");
    expect(text).not.toContain("Works with /api/user/*");
    expect(text).not.toContain("https://example.com/api/context/skill");
    expect(text).not.toContain("Generate");
    expect(text).not.toContain("Revoke");

    const copyButtons = Array.from(container.querySelectorAll("button")).filter((button) =>
      button.textContent?.includes("Copy"),
    );
    const revealButtons = Array.from(container.querySelectorAll("button")).filter((button) =>
      button.textContent?.includes("Reveal"),
    );

    expect(copyButtons).toHaveLength(3);
    expect(revealButtons).toHaveLength(3);
  });

  it("shows the integration catalog from the top-level integrations route", async () => {
    usePathnameMock.mockReturnValue("/integrations");

    let integrationsState: IntegrationSpec[] = [
      {
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
        enabled: true,
        fineGrainedPermissions: true,
        config: { managedConnectorSlug: "github" },
        credentials: {},
        tools: {
          zetaWrite: {
            name: "zetaWrite",
            description: "Disabled write tool",
            enabled: false,
            accessMode: "disabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:write"],
            executionMode: "provider",
            config: {},
          },
          alphaList: {
            name: "alphaList",
            description: "List repositories",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:read"],
            executionMode: "provider",
            config: {},
          },
          betaReview: {
            name: "betaReview",
            description: "Review pull requests",
            enabled: true,
            accessMode: "approval_required",
            fineGrainedPermissions: true,
            defaultScopes: ["pull_requests:write"],
            executionMode: "provider",
            config: {},
          },
        },
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (
        url === "/api/case-by-case-approvals" ||
        url === "/api/notifications" ||
        url === "/api/integrations/managed-connectors"
      ) {
        return new Response(
          JSON.stringify(
            url === "/api/integrations/managed-connectors" ? managedConnectors : [],
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/integrations" && method === "GET") {
        return new Response(JSON.stringify(integrationsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/github/tools/zetaWrite" && method === "PATCH") {
        const payload = JSON.parse(String(init?.body)) as {
          accessMode: "enabled" | "disabled" | "approval_required";
        };
        integrationsState = integrationsState.map((integration) => {
          const zetaWriteTool = integration.tools["zetaWrite"];
          if (!zetaWriteTool) {
            return integration;
          }

          return {
            ...integration,
            tools: {
              ...integration.tools,
              zetaWrite: {
                ...zetaWriteTool,
                accessMode: payload.accessMode,
                enabled: payload.accessMode !== "disabled",
              },
            },
          };
        });

        const updatedIntegration = integrationsState[0];
        return new Response(
          JSON.stringify(updatedIntegration?.tools["zetaWrite"] ?? null),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsState}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });


    expect(container.textContent).toContain("Add integration");
    expect(
      container.querySelector('input[type="search"][aria-label="Search integrations"]'),
    ).toBeTruthy();
    expect(
      Array.from(container.querySelectorAll('a[href="/admin-integrations"]')).some(
        (link) => link.textContent?.includes("Click here"),
      ),
    ).toBe(true);
    expect(
      container.querySelector('[data-integration-key="github"] img[alt="GitHub logo"]'),
    ).toBeTruthy();


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

    const getVisibleToolNames = () =>
      Array.from(
        container.querySelectorAll('[data-integration-key="github"] [data-tool-key]'),
      ).map((row) => row.getAttribute("data-tool-name"));

    const getToolMode = (name: string) =>
      container
        .querySelector(
          `[data-tool-key="github:${name}"] [data-access-mode]`,
        )
        ?.getAttribute("data-access-mode");

    const searchInput = container.querySelector(
      'input[type="search"][aria-label="Search integrations and tools"]',
    ) as HTMLInputElement | null;
    expect(searchInput).toBeTruthy();

    const hideDisabledInput = container.querySelector(
      'input[type="checkbox"][aria-label="Hide disabled tools"]',
    ) as HTMLInputElement | null;
    expect(hideDisabledInput?.checked).toBe(true);

    await clickButton("Show tools");

    expect(getVisibleToolNames()).toEqual(["alphaList", "betaReview"]);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "review");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getVisibleToolNames()).toEqual(["betaReview"]);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      hideDisabledInput?.click();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getVisibleToolNames()).toEqual([
      "alphaList",
      "betaReview",
      "zetaWrite",
    ]);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "zeta");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getVisibleToolNames()).toEqual(["zetaWrite"]);
    expect(getToolMode("zetaWrite")).toBe("disabled");

    const caseByCaseButton = container.querySelector(
      'button[aria-label="Case-by-case access for zetaWrite"]',
    ) as HTMLButtonElement | null;
    expect(caseByCaseButton).toBeTruthy();

    await act(async () => {
      caseByCaseButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getToolMode("zetaWrite")).toBe("approval_required");

    await act(async () => {
      hideDisabledInput?.click();
      setInputValue(searchInput ?? undefined, "");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getVisibleToolNames()).toEqual([
      "alphaList",
      "betaReview",
      "zetaWrite",
    ]);
  });

  it("bulk disables only tracked unused tools from the integrations page", async () => {
    usePathnameMock.mockReturnValue("/integrations");

    let integrationsState: IntegrationSpec[] = [
      {
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
        enabled: true,
        fineGrainedPermissions: true,
        config: { managedConnectorSlug: "github" },
        credentials: {},
        tools: {
          staleRead: {
            name: "staleRead",
            description: "Old tracked tool",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:read"],
            executionMode: "provider",
            config: {},
            lastInvokedAt: "2026-01-01T00:00:00.000Z",
            lastInvocationOutcome: "success",
            invocationCount: 3,
          },
          freshWrite: {
            name: "freshWrite",
            description: "Recently used tool",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: ["repo:write"],
            executionMode: "provider",
            config: {},
            lastInvokedAt: "2026-03-25T00:00:00.000Z",
            lastInvocationOutcome: "success",
            invocationCount: 1,
          },
          noHistory: {
            name: "noHistory",
            description: "No tracked usage yet",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
          },
        },
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (
        url === "/api/case-by-case-approvals" ||
        url === "/api/notifications" ||
        url === "/api/integrations/managed-connectors"
      ) {
        return new Response(
          JSON.stringify(
            url === "/api/integrations/managed-connectors" ? managedConnectors : [],
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/integrations" && method === "GET") {
        return new Response(JSON.stringify(integrationsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/disable-unused" && method === "POST") {
        const payload = JSON.parse(String(init?.body)) as {
          thresholdValue: number;
          thresholdUnit: string;
        };
        expect(payload).toEqual({ thresholdValue: 30, thresholdUnit: "days" });

        integrationsState = integrationsState.map((integration) => {
          const staleReadTool = integration.tools["staleRead"];
          if (!staleReadTool) {
            return integration;
          }

          return {
            ...integration,
            tools: {
              ...integration.tools,
              staleRead: {
                ...staleReadTool,
                enabled: false,
                accessMode: "disabled",
              },
            },
          };
        });

        return new Response(
          JSON.stringify({
            thresholdValue: 30,
            thresholdUnit: "days",
            cutoffIso: "2026-02-27T00:00:00.000Z",
            disabledCount: 1,
            disabledTools: [
              {
                integrationKey: "github",
                toolName: "staleRead",
                lastInvokedAt: "2026-01-01T00:00:00.000Z",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T00:00:00.000Z"));
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsState}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("1 tool matched");
    expect(
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.getAttribute("aria-label") === "Disable unused tools")
        ?.textContent,
    ).toContain("Disable");
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("Show tools"))
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("Last tracked invocation:");
    expect(container.textContent).toContain("3 total");
    expect(container.textContent).toContain("No tracked usage yet");

    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.getAttribute("aria-label") === "Disable unused tools")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0]?.[0]).toContain("Disable 1 tracked tool");
    expect(confirmSpy.mock.calls[0]?.[0]).toContain("since");
    expect(container.textContent).toContain("Disabled 1 tracked tool");
    expect(container.textContent).toContain("0 tools matched");
    const updatedIntegration = integrationsState[0];
    expect(updatedIntegration?.tools["staleRead"]?.accessMode).toBe("disabled");

    confirmSpy.mockRestore();
  });

  it("shows a temporary check icon when the API key is copied without posting a success message", async () => {
    usePathnameMock.mockReturnValue("/agent-connection");
    vi.useFakeTimers();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    const copyButton = container.querySelector(
      'button[aria-label="Copy agent key"]',
    ) as HTMLButtonElement | null;
    expect(copyButton).toBeTruthy();
    expect(copyButton?.querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-copy",
    );

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalledWith("test-key");
    expect(container.textContent).not.toContain("API key copied to clipboard.");
    expect(copyButton?.querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-circle-check",
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const copyButtonAfterTimeout = container.querySelector(
      'button[aria-label="Copy agent key"]',
    ) as HTMLButtonElement | null;
    expect(
      copyButtonAfterTimeout?.querySelector("svg")?.getAttribute("class"),
    ).toContain("lucide-copy");
  });

  it("reveals and copies the user automation key even when only metadata is initially rendered", async () => {
    usePathnameMock.mockReturnValue("/agent-connection");
    vi.useFakeTimers();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/user/key" && method === "GET") {
        return new Response(
          JSON.stringify({
            hasKey: true,
            key: {
              keyPrefix: "clu_12345678",
              keySuffix: "mnop",
              createdAt: "2026-03-29T10:00:00.000Z",
              updatedAt: "2026-03-29T10:00:00.000Z",
            },
            apiKey: "clu_1234567890abcdefghijklmnop",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            userApiKey={{
              keyPrefix: "clu_12345678",
              keySuffix: "mnop",
              createdAt: "2026-03-29T10:00:00.000Z",
              updatedAt: "2026-03-29T10:00:00.000Z",
            }}
          />
        </QueryClientProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === "/api/user/key"),
    ).toBe(false);

    const revealButtons = Array.from(container.querySelectorAll("button")).filter((button) =>
      button.textContent?.includes("Reveal"),
    );
    const revealButton = revealButtons[1] as HTMLButtonElement | undefined;
    const copyButton = container.querySelector(
      'button[aria-label="Copy user automation key"]',
    ) as HTMLButtonElement | null;
    expect(revealButton?.textContent).toContain("Reveal");
    expect(copyButton).toBeTruthy();

    await act(async () => {
      revealButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("clu_1234567890abcdefghijklmnop");

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalledWith("clu_1234567890abcdefghijklmnop");
    expect(copyButton?.querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-circle-check",
    );
  });

  it("creates a user automation key only when the user explicitly copies it", async () => {
    usePathnameMock.mockReturnValue("/agent-connection");

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/user/key" && method === "GET") {
        return new Response(
          JSON.stringify({
            hasKey: false,
            key: null,
            apiKey: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/user/key" && method === "POST") {
        return new Response(
          JSON.stringify({
            apiKey: "clu_1234567890abcdefghijklmnop",
            key: {
              keyPrefix: "clu_12345678",
              keySuffix: "mnop",
              createdAt: "2026-03-29T10:00:00.000Z",
              updatedAt: "2026-03-29T10:00:00.000Z",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain(
      "No user automation key yet. Reveal or copy to create one.",
    );
    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === "/api/user/key"),
    ).toBe(false);

    const copyButton = container.querySelector(
      'button[aria-label="Copy user automation key"]',
    ) as HTMLButtonElement | null;
    expect(copyButton).toBeTruthy();

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalledWith("clu_1234567890abcdefghijklmnop");
    expect(
      fetchMock.mock.calls
        .filter(([input]) => String(input) === "/api/user/key")
        .map(([, init]) => init?.method ?? "GET"),
    ).toEqual(["GET", "POST"]);
    expect(container.textContent).toContain(
      "Created a new user automation key. Save it somewhere secure because the full value is only shown when you explicitly reveal or copy it.",
    );
  });


  it("reveals and copies the admin automation key only after an explicit action", async () => {
    usePathnameMock.mockReturnValue("/agent-connection");
    vi.useFakeTimers();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/admin/key" && method === "GET") {
        return new Response(
          JSON.stringify({
            hasKey: true,
            key: {
              keyPrefix: "clad_123456",
              keySuffix: "wxyz",
              createdAt: "2026-03-29T10:00:00.000Z",
              updatedAt: "2026-03-29T10:00:00.000Z",
            },
            apiKey: "clad_1234567890abcdefghijklmnopqrstuv",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            adminApiKey={{
              keyPrefix: "clad_123456",
              keySuffix: "wxyz",
              createdAt: "2026-03-29T10:00:00.000Z",
              updatedAt: "2026-03-29T10:00:00.000Z",
            }}
          />
        </QueryClientProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      fetchMock.mock.calls.some(([input]) => String(input) === "/api/admin/key"),
    ).toBe(false);

    const revealButtons = Array.from(container.querySelectorAll("button")).filter((button) =>
      button.textContent?.includes("Reveal"),
    );
    const revealButton = revealButtons[2] as HTMLButtonElement | undefined;
    const copyButton = container.querySelector(
      'button[aria-label="Copy admin automation key"]',
    ) as HTMLButtonElement | null;
    expect(revealButton?.textContent).toContain("Reveal");
    expect(copyButton).toBeTruthy();

    await act(async () => {
      revealButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("clad_1234567890abcdefghijklmnopqrstuv");

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalledWith("clad_1234567890abcdefghijklmnopqrstuv");
    expect(copyButton?.querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-circle-check",
    );
  });

  it("shows the case-by-case approvals page with pending requests sorted newest first and filterable statuses", async () => {
    usePathnameMock.mockReturnValue("/case-by-case-approvals");

    const accessRequestsState: AccessRequest[] = [
      {
        id: "req-pending-older",
        agentId: "agent-1",
        agentClass: "assistant",
        integrationKey: "slack",
        toolName: "send_message",
        scopes: ["chat:write"],
        requestedMinutes: 240,
        channels: ["in_app"],
        notificationTargets: { in_app: "owner@example.com" },
        justification: "Need to send Slack updates",
        createdAt: "2026-03-01T09:00:00.000Z",
        status: "pending",
      },
      {
        id: "req-approved",
        agentId: "agent-2",
        agentClass: "assistant",
        integrationKey: "github",
        toolName: "create_issue",
        scopes: ["issues:write"],
        requestedMinutes: 240,
        channels: ["in_app"],
        notificationTargets: { in_app: "owner@example.com" },
        justification: "Need to file an issue",
        createdAt: "2026-03-02T09:00:00.000Z",
        status: "approved",
        decidedAt: "2026-03-02T10:00:00.000Z",
        decidedBy: "admin@example.com",
      },
      {
        id: "req-denied",
        agentId: "agent-3",
        agentClass: "reviewer",
        integrationKey: "linear",
        toolName: "delete_comment",
        scopes: ["comments:write"],
        requestedMinutes: 240,
        channels: ["in_app"],
        notificationTargets: { in_app: "owner@example.com" },
        justification: "Need moderation access",
        createdAt: "2026-03-03T09:00:00.000Z",
        status: "rejected",
        decidedAt: "2026-03-03T10:00:00.000Z",
        decidedBy: "admin@example.com",
      },
      {
        id: "req-pending-newer",
        agentId: null,
        agentClass: null,
        integrationKey: "github",
        toolName: "delete_repo",
        scopes: ["repo:admin"],
        requestedMinutes: 240,
        channels: ["in_app"],
        notificationTargets: { in_app: "owner@example.com" },
        agentData: {
          conversationLink:
            "https://app.all-hands.dev/conversations/f3e731620cf147a1976b53050bbe039e",
        },
        createdAt: "2026-03-04T09:00:00.000Z",
        status: "pending",
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/case-by-case-approvals") {
        return new Response(JSON.stringify(accessRequestsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={accessRequestsState}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector("h1")?.textContent).toBe(
      "Case-by-case Approvals",
    );
    expect(
      container.querySelector(
        'input[type="search"][aria-label="Search case-by-case approvals"]',
      ),
    ).toBeTruthy();
    expect(container.textContent).toContain("no agent identity provided");
    expect(container.textContent).toContain("Invocation identity: Not provided · Not provided");
    const conversationLink = container.querySelector(
      'a[href="https://app.all-hands.dev/conversations/f3e731620cf147a1976b53050bbe039e"]',
    ) as HTMLAnchorElement | null;
    expect(conversationLink).toBeTruthy();
    expect(conversationLink?.textContent).toContain(
      "https://app.all-hands.dev/conversations/f3e731620cf147a1976b53050bbe039e",
    );
    expect(container.textContent).not.toContain(
      "Auto-created after an agent attempted a case-by-case tool without an active approval.",
    );

    const visibleRequestIds = Array.from(
      container.querySelectorAll("[data-request-id]"),
    ).map((element) => element.getAttribute("data-request-id"));
    expect(visibleRequestIds).toEqual([
      "req-pending-newer",
      "req-pending-older",
    ]);

    await act(async () => {
      setInputValue(
        container.querySelector(
          'input[type="search"][aria-label="Search case-by-case approvals"]',
        ) as HTMLInputElement,
        "github",
      );
    });

    expect(
      Array.from(container.querySelectorAll("[data-request-id]")).map((element) =>
        element.getAttribute("data-request-id"),
      ),
    ).toEqual(["req-pending-newer"]);

    await act(async () => {
      setInputValue(
        container.querySelector(
          'input[type="search"][aria-label="Search case-by-case approvals"]',
        ) as HTMLInputElement,
        "",
      );
    });

    const approvedFilterButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("approved"));
    expect(approvedFilterButton).toBeTruthy();

    await act(async () => {
      approvedFilterButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(
      Array.from(container.querySelectorAll("[data-request-id]")).map((element) =>
        element.getAttribute("data-request-id"),
      ),
    ).toEqual(["req-approved"]);

    const deniedFilterButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("denied"),
    );
    expect(deniedFilterButton).toBeTruthy();

    await act(async () => {
      deniedFilterButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(container.textContent).toContain("denied");
    expect(
      Array.from(container.querySelectorAll("[data-request-id]")).map((element) =>
        element.getAttribute("data-request-id"),
      ),
    ).toEqual(["req-denied"]);
  });

  it("approves selected case-by-case requests using the default 4 hour duration", async () => {
    usePathnameMock.mockReturnValue("/case-by-case-approvals");

    const accessRequestsState: AccessRequest[] = [
      {
        id: "req-pending",
        agentId: "agent-1",
        agentClass: "assistant",
        integrationKey: "github",
        toolName: "delete_repo",
        scopes: ["repo:admin"],
        requestedMinutes: 240,
        channels: ["in_app"],
        notificationTargets: { in_app: "owner@example.com" },
        justification: "Need repo cleanup access",
        createdAt: "2026-03-04T09:00:00.000Z",
        status: "pending",
      },
    ];

    let approvePayload: { durationMinutes: number } | null = null;

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/integrations" || url === "/api/case-by-case-approvals") {
        return new Response(
          JSON.stringify(url === "/api/integrations" ? [] : accessRequestsState),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/case-by-case-approvals/req-pending/approve") {
        approvePayload = JSON.parse(String(init?.body)) as {
          durationMinutes: number;
        };
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={accessRequestsState}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const selectAllButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Select all matches"),
    );
    expect(selectAllButton).toBeTruthy();

    await act(async () => {
      selectAllButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const approveSelectedButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Approve selected"));
    expect(approveSelectedButton).toBeTruthy();

    await act(async () => {
      approveSelectedButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(approvePayload).toEqual({
      durationMinutes: 240,
    });
    expect(container.textContent).toContain(
      "If you want to approve for more than 100 hours",
    );
  });

  it("shows the connected OAuth banner, local session copy, and agent-key warning on the profile route", async () => {
    usePathnameMock.mockReturnValue("/profile");
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams({
        oauth_status: "connected",
        oauth_provider: "slack",
      }),
    );

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "", email: "dev@localhost" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey=""
            isAdmin={false}
          />
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain(
      "Slack connected successfully. Finish saving the integration to use it.",
    );
    expect(container.textContent).toContain("Local development session");
    expect(container.textContent).toContain("Agent key status");
    expect(container.textContent).toContain("Not available yet");
    expect(container.textContent).toContain(
      "Open /integrations once to provision the agent key before agents call /api/context/*.",
    );
  });

  it("does not delete an integration when confirmation is cancelled and surfaces toggle errors", async () => {
    usePathnameMock.mockReturnValue("/integrations");

    const integrationsState: IntegrationSpec[] = [
      {
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
        enabled: false,
        fineGrainedPermissions: true,
        config: { builtInSlug: "github" },
        credentials: {},
        tools: {},
      },
    ];

    let deleteCalls = 0;
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/access-requests" || url === "/api/notifications") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/managed-connectors") {
        return new Response(JSON.stringify(managedConnectors), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations" && method === "GET") {
        return new Response(JSON.stringify(integrationsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/github/toggle" && method === "POST") {
        return new Response(JSON.stringify({ detail: "Unable to enable GitHub right now." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/github" && method === "DELETE") {
        deleteCalls += 1;
        return new Response(JSON.stringify({ deleted: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    const confirmMock = vi.fn(() => false);
    vi.stubGlobal("confirm", confirmMock);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsState}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "User", email: "user@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            isAdmin={false}
          />
        </QueryClientProvider>,
      );
    });

    const deleteButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Delete"),
    );
    const enableButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Enable"),
    );

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      enableButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(confirmMock).toHaveBeenCalledWith(
      'Delete the integration "GitHub"? This removes it from your personal dashboard and disconnects any saved credentials for this tool.',
    );
    expect(deleteCalls).toBe(0);
    expect(container.textContent).toContain("Unable to enable GitHub right now.");
  });

  it("normalizes invalid unused-tool thresholds before submitting a failing bulk disable request", async () => {
    usePathnameMock.mockReturnValue("/integrations");

    const integrationsState: IntegrationSpec[] = [
      {
        key: "github",
        name: "GitHub",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "bearer",
        enabled: true,
        fineGrainedPermissions: true,
        config: { builtInSlug: "github" },
        credentials: {},
        tools: {
          staleRead: {
            name: "staleRead",
            description: "Old tracked tool",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
            lastInvokedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/access-requests" || url === "/api/notifications") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/managed-connectors") {
        return new Response(JSON.stringify(managedConnectors), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations" && method === "GET") {
        return new Response(JSON.stringify(integrationsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/integrations/disable-unused" && method === "POST") {
        expect(JSON.parse(String(init?.body))).toEqual({
          thresholdValue: 30,
          thresholdUnit: "days",
        });
        return new Response(JSON.stringify({ detail: "Bulk disable failed." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T00:00:00.000Z"));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsState}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "User", email: "user@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            isAdmin={false}
          />
        </QueryClientProvider>,
      );
    });

    const thresholdInput = container.querySelector(
      'input[aria-label="Unused threshold value"]',
    ) as HTMLInputElement | null;
    const disableUnusedButton = container.querySelector(
      'button[aria-label="Disable unused tools"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      thresholdInput?.focus();
      setInputValue(thresholdInput ?? undefined, "0");
      thresholdInput?.blur();
      await Promise.resolve();
    });

    expect(thresholdInput?.value).toBe("30");

    await act(async () => {
      disableUnusedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Bulk disable failed.");
  });

  it("shows an empty unused-tool state and resets invalid approval durations before a deny failure", async () => {
    usePathnameMock.mockReturnValue("/case-by-case-approvals");

    const accessRequestsState: AccessRequest[] = [
      {
        id: "req-pending",
        agentId: null,
        agentClass: null,
        integrationKey: "github",
        toolName: "delete_repo",
        scopes: ["repo:admin"],
        requestedMinutes: 240,
        channels: ["in_app"],
        notificationTargets: {},
        createdAt: "2026-03-04T09:00:00.000Z",
        status: "pending",
      },
    ];

    let rejectPayload: { approver: string } | null = null;
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/integrations" && method === "GET") {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/access-requests" && method === "GET") {
        return new Response(JSON.stringify(accessRequestsState), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/access-requests/req-pending/reject" && method === "POST") {
        rejectPayload = JSON.parse(String(init?.body)) as { approver: string };
        return new Response(JSON.stringify({ detail: "Reject failed." }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[]}
            initialAccessRequests={accessRequestsState}
            initialNotifications={[]}
            currentUser={{ name: "", email: "" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    const approvalDurationInput = container.querySelector(
      'input[aria-label="Approval duration in hours"]',
    ) as HTMLInputElement | null;
    const selectAllButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Select all matches"),
    );
    const denySelectedButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Deny selected"),
    );

    await act(async () => {
      approvalDurationInput?.focus();
      setInputValue(approvalDurationInput ?? undefined, "0");
      approvalDurationInput?.blur();
      await Promise.resolve();
    });

    expect(approvalDurationInput?.value).toBe("4");

    await act(async () => {
      selectAllButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      denySelectedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(rejectPayload).toEqual({ approver: "human-approver" });
    expect(container.textContent).toContain("Reject failed.");

    usePathnameMock.mockReturnValue("/integrations");
    const integrationsWithoutTrackedUsage: IntegrationSpec[] = [
      {
        key: "slack",
        name: "Slack",
        kind: "mcp",
        provider: "mcp",
        authStrategy: "oauth2",
        enabled: true,
        fineGrainedPermissions: true,
        config: { builtInSlug: "slack" },
        credentials: {},
        tools: {
          noHistory: {
            name: "noHistory",
            description: "No tracked usage yet",
            enabled: true,
            accessMode: "enabled",
            fineGrainedPermissions: true,
            defaultScopes: [],
            executionMode: "provider",
            config: {},
          },
        },
      },
    ];

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (
        url === "/api/integrations" ||
        url === "/api/access-requests" ||
        url === "/api/notifications" ||
        url === "/api/integrations/managed-connectors"
      ) {
        return new Response(
          JSON.stringify(
            url === "/api/integrations"
              ? integrationsWithoutTrackedUsage
              : url === "/api/integrations/managed-connectors"
                ? managedConnectors
                : [],
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    await act(async () => {
      queryClient.clear();
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={integrationsWithoutTrackedUsage}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "User", email: "user@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
            isAdmin={false}
          />
        </QueryClientProvider>,
      );
      await Promise.resolve();
    });

    const disableUnusedButton = container.querySelector(
      'button[aria-label="Disable unused tools"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      disableUnusedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "No tracked tools matched the selected unused window.",
    );
  });


});
