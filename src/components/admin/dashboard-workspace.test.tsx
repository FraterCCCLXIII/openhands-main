// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, usePathnameMock, useRouterMock, useSearchParamsMock, signOutMock } =
  vi.hoisted(() => ({
    pushMock: vi.fn(),
    usePathnameMock: vi.fn(() => "/home"),
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

import { DashboardWorkspace } from "@/src/components/admin/dashboard-workspace";
import type { IntegrationSpec } from "@/src/types/context-layer";

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

describe("DashboardWorkspace", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    usePathnameMock.mockImplementation(() => "/home");
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

  it("shows an Admin sidebar link to the add-connector page", async () => {
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

    const adminLink = container.querySelector('a[href="/add-connector"]');
    expect(adminLink).toBeTruthy();
    expect(adminLink?.textContent).toContain("Admin");
  });

  it("updates the URL when switching admin sections", async () => {
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

    const profileButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("User Profile"),
    );
    expect(profileButton).toBeTruthy();

    await act(async () => {
      profileButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(pushMock).toHaveBeenCalledWith("/profile");
  });

  it("shows the home section on the canonical /home route", async () => {
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

    expect(container.querySelector("h1")?.textContent).toBe("Home");
    expect(container.textContent).toContain("Workspace summary");
  });

  it("shows the usage panel from the top-level agent connection route", async () => {
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
          />
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("REST API Usage");
    expect(container.textContent).toContain("MCP Usage");
    expect(container.textContent).toContain("OpenAPI schema");
    expect(container.textContent).toContain("https://example.com/api/context/openapi");
    expect(container.textContent).toContain('curl -X GET "https://example.com/api/context/openapi"');
    expect(container.textContent).toContain("https://example.com/api/mcp");
    expect(container.textContent).toContain("set_agent_id");
    expect(container.textContent).toContain("set_agent_class");
    expect(container.textContent).toContain(
      "Connect your MCP client to https://example.com/api/mcp.",
    );
    expect(container.textContent).toContain(
      "Call your-integration__your-function directly; if you omit agent identity, the session defaults to research-bot-01 (researcher).",
    );
    expect(container.textContent).toContain(
      "Optionally call set_agent_id and set_agent_class to override the identity for the rest of the session.",
    );
    expect(container.textContent).toContain(
      "Enabled tools are callable by default unless you configure an agent-class policy to narrow access; case-by-case tools still need a temporary approval grant.",
    );
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
        config: {},
        credentials: {},
        functions: {
          zetaWrite: {
            name: "zetaWrite",
            description: "Disabled write skill",
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

      if (url === "/api/access-requests" || url === "/api/notifications") {
        return new Response(JSON.stringify([]), {
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

      if (url === "/api/integrations/github/functions/zetaWrite" && method === "PATCH") {
        const payload = JSON.parse(String(init?.body)) as {
          accessMode: "enabled" | "disabled" | "approval_required";
        };
        integrationsState = integrationsState.map((integration) => ({
          ...integration,
          functions: {
            ...integration.functions,
            zetaWrite: {
              ...integration.functions.zetaWrite,
              accessMode: payload.accessMode,
              enabled: payload.accessMode !== "disabled",
            },
          },
        }));

        return new Response(
          JSON.stringify(integrationsState[0]?.functions.zetaWrite ?? null),
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
      Array.from(
        container.querySelectorAll('[data-integration-key="github"] [data-function-key]'),
      ).map((row) => row.getAttribute("data-function-name"));

    const getFunctionMode = (name: string) =>
      container
        .querySelector(
          `[data-function-key="github:${name}"] [data-access-mode]`,
        )
        ?.getAttribute("data-access-mode");

    const searchInput = container.querySelector(
      'input[type="search"][aria-label="Search integrations and skills"]',
    ) as HTMLInputElement | null;
    expect(searchInput).toBeTruthy();

    const hideDisabledInput = container.querySelector(
      'input[type="checkbox"][aria-label="Hide disabled skills"]',
    ) as HTMLInputElement | null;
    expect(hideDisabledInput?.checked).toBe(true);

    await clickButton("Show skills");

    expect(getVisibleFunctionNames()).toEqual(["alphaList", "betaReview"]);

    await act(async () => {
      setInputValue(searchInput ?? undefined, "review");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getVisibleFunctionNames()).toEqual(["betaReview"]);

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

    expect(getVisibleFunctionNames()).toEqual([
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

    expect(getVisibleFunctionNames()).toEqual(["zetaWrite"]);
    expect(getFunctionMode("zetaWrite")).toBe("disabled");

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

    expect(getFunctionMode("zetaWrite")).toBe("approval_required");

    await act(async () => {
      hideDisabledInput?.click();
      setInputValue(searchInput ?? undefined, "");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getVisibleFunctionNames()).toEqual([
      "alphaList",
      "betaReview",
      "zetaWrite",
    ]);
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

    const copyButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Copy"),
    );
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

    const copyButtonAfterTimeout = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Copy"));
    expect(
      copyButtonAfterTimeout?.querySelector("svg")?.getAttribute("class"),
    ).toContain("lucide-copy");
  });

});
