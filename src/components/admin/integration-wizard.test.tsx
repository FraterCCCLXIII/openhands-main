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
});
