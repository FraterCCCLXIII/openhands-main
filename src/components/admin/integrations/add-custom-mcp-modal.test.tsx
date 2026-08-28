// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

const { fetchJsonMock } = vi.hoisted(() => ({
  fetchJsonMock: vi.fn(),
}));

vi.mock("@/src/lib/fetch-json", () => ({
  fetchJson: fetchJsonMock,
}));

import {
  AddCustomMcpModal,
  buildCustomMcpPayload,
  slugFromDisplayName,
} from "@/src/components/admin/integrations/add-custom-mcp-modal";
import { ADMIN_INTEGRATIONS_PAGE_COPY } from "@/src/constants/admin-integrations-page";

enableReactActEnvironment();

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("slugFromDisplayName", () => {
  it("normalizes display names into lowercase hyphenated slugs", () => {
    expect(slugFromDisplayName(" My Custom MCP ")).toBe("my-custom-mcp");
    expect(slugFromDisplayName("Internal/Tools!")).toBe("internal-tools");
  });
});

describe("buildCustomMcpPayload", () => {
  it("builds a managed MCP registration payload", () => {
    expect(
      buildCustomMcpPayload({
        name: "Internal tools",
        slug: "internal-tools",
        serverUrl: "https://mcp.example.com/mcp",
        authStrategy: "bearer",
      }),
    ).toEqual({
      slug: "internal-tools",
      name: "Internal tools",
      description: "Custom MCP server at https://mcp.example.com/mcp",
      categories: ["Custom"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      serverUrl: "https://mcp.example.com/mcp",
      credentialLabel: "Access token",
      credentialPlaceholder: "OAuth or bearer token",
      credentialHelp: "Use this for bearer-token MCP servers.",
      enabled: true,
      tools: [],
    });
  });
});

describe("AddCustomMcpModal", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchJsonMock.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("auto-fills the integration key from the display name and registers the connector", async () => {
    const onRegistered = vi.fn();
    const registered = {
      slug: "internal-tools",
      name: "Internal tools",
      description: "Custom MCP server at https://mcp.example.com/mcp",
      categories: ["Custom"],
      authModes: ["bearer"],
      authStrategy: "bearer",
      provider: "mcp",
      serverUrl: "https://mcp.example.com/mcp",
      credentialLabel: "Access token",
      credentialPlaceholder: "OAuth or bearer token",
      credentialHelp: "Use this for bearer-token MCP servers.",
      tools: [],
      enabled: true,
      createdAt: "2026-08-27T00:00:00.000Z",
      updatedAt: "2026-08-27T00:00:00.000Z",
    };
    fetchJsonMock.mockResolvedValueOnce(registered);

    await act(async () => {
      root.render(
        <AddCustomMcpModal
          existingSlugs={["github"]}
          onClose={vi.fn()}
          onRegistered={onRegistered}
        />,
      );
    });

    const modal = document.querySelector('[data-testid="add-custom-mcp-modal"]');
    expect(modal).toBeTruthy();

    const inputs = Array.from(modal?.querySelectorAll("input") ?? []);
    const nameInput = inputs[0];
    const slugInput = inputs[1];
    const urlInput = inputs[2];
    expect(nameInput && slugInput && urlInput).toBeTruthy();

    await act(async () => {
      setInputValue(nameInput as HTMLInputElement, "Internal tools");
      setInputValue(urlInput as HTMLInputElement, "https://mcp.example.com/mcp");
    });

    expect((slugInput as HTMLInputElement).value).toBe("internal-tools");

    const form = modal?.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchJsonMock).toHaveBeenCalledWith("/api/admin/modify-integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildCustomMcpPayload({
          name: "Internal tools",
          slug: "internal-tools",
          serverUrl: "https://mcp.example.com/mcp",
          authStrategy: "bearer",
        }),
      ),
    });
    expect(onRegistered).toHaveBeenCalledWith(registered);
  });

  it("prefills the display name and slug from initialName", async () => {
    await act(async () => {
      root.render(
        <AddCustomMcpModal
          existingSlugs={[]}
          initialName="Internal Wiki"
          onClose={vi.fn()}
          onRegistered={vi.fn()}
        />,
      );
    });

    const modal = document.querySelector('[data-testid="add-custom-mcp-modal"]');
    const inputs = Array.from(modal?.querySelectorAll("input") ?? []);
    expect((inputs[0] as HTMLInputElement).value).toBe("Internal Wiki");
    expect((inputs[1] as HTMLInputElement).value).toBe("internal-wiki");
  });

  it("rejects a slug that is already registered", async () => {
    await act(async () => {
      root.render(
        <AddCustomMcpModal
          existingSlugs={["github"]}
          onClose={vi.fn()}
          onRegistered={vi.fn()}
        />,
      );
    });

    const modal = document.querySelector('[data-testid="add-custom-mcp-modal"]');
    const inputs = Array.from(modal?.querySelectorAll("input") ?? []);

    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, "GitHub");
      setInputValue(inputs[2] as HTMLInputElement, "https://mcp.example.com/mcp");
    });

    const form = modal?.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(modal?.textContent).toContain(ADMIN_INTEGRATIONS_PAGE_COPY.addCustomMcpSlugTaken);
    expect(fetchJsonMock).not.toHaveBeenCalled();
  });
});
