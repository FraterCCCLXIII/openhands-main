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
    vi.useRealTimers();
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

  it("documents separate REST and MCP usage sections on the usage panel", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("section=apiKeys"));

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
      "Enabled tools are callable by default unless you configure an agent-class policy to narrow access; case-by-case tools still need a temporary approval grant.",
    );
  });

  it("shows a temporary check icon when the API key is copied without posting a success message", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("section=apiKeys"));
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
