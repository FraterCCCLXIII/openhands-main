// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ManagedConnectorList } from "@/src/components/admin/integrations/managed-connector-list";
import type { ManagedConnectorDefinition } from "@/src/types/context-layer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const initialConnectors: ManagedConnectorDefinition[] = [
  {
    slug: "notion",
    name: "Notion",
    description: "Stale Notion MCP connector",
    categories: ["Knowledge base"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    provider: "mcp",
    oauthConfigured: true,
    credentialLabel: "Connect Notion",
    credentialPlaceholder: "Connect Notion",
    credentialHelp: "Connect Notion with OAuth.",
    apiBaseUrl: "https://mcp.notion.com/mcp",
    serverUrl: "https://mcp.notion.com/mcp",
    oauthConfig: {
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      scopes: [],
    },
    tools: [],
    enabled: true,
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
  },
];

const setInputValue = (element: Element | null, value: string) => {
  if (element instanceof HTMLInputElement) {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (element instanceof HTMLSelectElement) {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  throw new Error("Expected input or select element");
};

describe("ManagedConnectorList", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("shows connector logos and top-level delete buttons in the compact card view", async () => {
    await act(async () => {
      root.render(
        <ManagedConnectorList initialManagedConnectors={initialConnectors} />,
      );
    });

    expect(container.querySelector('[aria-label="Notion logo"]')).toBeTruthy();
    expect(
      container.querySelector('button[aria-label="Delete Notion connector"]'),
    ).toBeTruthy();
    expect(container.textContent).toContain("Show details");
  });

  it("updates an existing managed connector in place", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...initialConnectors[0],
          provider: "http",
          apiBaseUrl: "https://api.notion.com",
          serverUrl: undefined,
          openApiUrl: "https://developers.notion.com/openapi.json",
          description: "Managed Notion REST connector",
          updatedAt: "2026-03-11T00:00:00.000Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await act(async () => {
      root.render(
        <ManagedConnectorList initialManagedConnectors={initialConnectors} />,
      );
    });

    const expandButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Show details"),
    );
    expect(expandButton).toBeTruthy();

    await act(async () => {
      expandButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const providerSelect = container.querySelector("select");
    expect(providerSelect).toBeTruthy();

    await act(async () => {
      setInputValue(providerSelect, "http");
    });

    const urlInputs = Array.from(container.querySelectorAll('input[type="url"]'));
    expect(urlInputs).toHaveLength(4);

    await act(async () => {
      setInputValue(urlInputs[0] ?? null, "https://api.notion.com");
      setInputValue(urlInputs[1] ?? null, "https://developers.notion.com/openapi.json");
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
      provider: string;
      apiBaseUrl?: string;
      serverUrl?: string;
      openApiUrl?: string;
    };
    expect(body).toMatchObject({
      provider: "http",
      apiBaseUrl: "https://api.notion.com",
      openApiUrl: "https://developers.notion.com/openapi.json",
    });
    expect(body.serverUrl).toBeUndefined();
    expect(container.textContent).toContain("Connector updated.");
  });

  it("deletes a managed connector from the card header without expanding first", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ deleted: true, slug: "notion" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await act(async () => {
      root.render(
        <ManagedConnectorList initialManagedConnectors={initialConnectors} />,
      );
    });

    const deleteButton = container.querySelector(
      'button[aria-label="Delete Notion connector"]',
    );
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/managed-connectors/notion", {
      method: "DELETE",
    });
    expect(container.textContent).toContain("No managed connectors are registered yet.");
  });
});
