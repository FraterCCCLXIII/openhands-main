// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useSearchParamsMock, signOutMock } = vi.hoisted(() => ({
  useSearchParamsMock: vi.fn(() => new URLSearchParams()),
  signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: useSearchParamsMock,
}));

vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}));

import { DashboardWorkspace } from "@/src/components/admin/dashboard-workspace";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("DashboardWorkspace", () => {
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
    vi.unstubAllGlobals();
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

  it("documents how to export a generated SKILL.md file on the usage page", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("section=apiKeys"));

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <DashboardWorkspace
            initialIntegrations={[
              {
                key: "github",
                name: "GitHub MCP",
                kind: "mcp",
                provider: "mcp",
                authStrategy: "oauth2",
                enabled: true,
                fineGrainedPermissions: true,
                config: {},
                credentials: {},
                functions: {
                  search_repositories: {
                    name: "search_repositories",
                    description: "Search repositories",
                    enabled: true,
                    accessMode: "enabled",
                    fineGrainedPermissions: true,
                    defaultScopes: ["repo"],
                    executionMode: "provider",
                    config: {},
                  },
                },
              },
            ]}
            initialAccessRequests={[]}
            initialNotifications={[]}
            currentUser={{ name: "Admin User", email: "admin@example.com" }}
            contextApiBaseUrl="https://example.com"
            contextApiKey="test-key"
          />
        </QueryClientProvider>,
      );
    });

    expect(container.textContent).toContain("SKILL.md endpoint");
    expect(container.textContent).toContain("Download a generated");
    expect(container.textContent).toContain("/api/context/skill");
    expect(container.textContent).toContain("SKILL.md export");
  });
});
