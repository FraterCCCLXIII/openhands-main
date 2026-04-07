// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentConnectionSection } from "@/src/components/dashboard/sections/agent-connection-section";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const createDefaultProps = () => ({
  adminKey: {
    copied: false,
    handleCopy: vi.fn(),
    handleReveal: vi.fn(),
    hasKey: false,
    maskedValue: "",
    revealed: false,
  },
  adminPromptExample: "Use the admin key for QA.",
  adminSchemaEndpoint: "https://example.com/api/admin/openapi",
  agentKey: {
    copied: false,
    handleCopy: vi.fn(),
    maskedValue: "cla_••••••••",
    revealed: false,
    toggleReveal: vi.fn(),
  },
  agentMcpConfigExample: '{"transport":"streamable-http"}',
  agentMcpEndpoint: "https://example.com/api/mcp",
  agentMcpToolName: "github__list_issues",
  agentOpenApiSchemaEndpoint: "https://example.com/api/context/openapi",
  agentRestPromptExample: "Use the agent REST API.",
  contextApiReady: true,
  isAdmin: true,
  userKey: {
    copied: false,
    handleCopy: vi.fn(),
    handleReveal: vi.fn(),
    hasKey: false,
    maskedValue: "",
    revealed: false,
  },
  userOpenApiSchemaEndpoint: "https://example.com/api/user/openapi",
  userRestPromptExample: "Use the user REST API.",
});

describe("AgentConnectionSection", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("renders non-admin fallback states and disables the agent key controls until provisioned", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <AgentConnectionSection
          {...props}
          contextApiReady={false}
          isAdmin={false}
          adminPromptExample=""
          adminSchemaEndpoint=""
          agentKey={{
            ...props.agentKey,
            maskedValue: "",
          }}
          userKey={{
            ...props.userKey,
            maskedValue: "",
          }}
        />,
      );
    });

    expect(container.textContent).toContain("No agent key available yet.");
    expect(container.textContent).toContain(
      "No user automation key yet. Reveal or copy to create one.",
    );
    expect(container.textContent).not.toContain("Admin automation key");
    expect(container.textContent).not.toContain("Admin REST API");

    const copyAgentButton = container.querySelector(
      'button[aria-label="Copy agent key"]',
    ) as HTMLButtonElement | null;
    expect(copyAgentButton?.disabled).toBe(true);

    const revealButtons = Array.from(container.querySelectorAll("button")).filter((button) =>
      button.textContent?.includes("Reveal"),
    );
    expect(revealButtons[0]?.hasAttribute("disabled")).toBe(true);
  });

  it("renders admin connection details and forwards reveal/copy actions for every key card", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <AgentConnectionSection
          {...props}
          adminKey={{
            ...props.adminKey,
            copied: true,
            hasKey: true,
            maskedValue: "clad_1234••••••••wxyz",
          }}
          agentKey={{
            ...props.agentKey,
            copied: true,
            revealed: true,
            maskedValue: "cla_live_value",
          }}
          userKey={{
            ...props.userKey,
            hasKey: true,
            maskedValue: "clu_1234••••••••mnop",
            revealed: false,
          }}
        />,
      );
    });

    expect(container.textContent).toContain("Admin automation key");
    expect(container.textContent).toContain("Admin REST API");
    expect(container.textContent).toContain("Agent MCP");
    expect(container.textContent).toContain("github__list_issues");
    expect(container.textContent).toContain("https://example.com/api/admin/openapi");
    expect(container.textContent).toContain("https://example.com/api/user/openapi");
    expect(container.textContent).toContain("https://example.com/api/context/openapi");
    expect(container.textContent).toContain("Hide");

    const buttons = Array.from(container.querySelectorAll("button"));
    const revealButtons = buttons.filter((button) => button.textContent?.includes("Reveal"));
    const hideButtons = buttons.filter((button) => button.textContent?.includes("Hide"));
    const copyAgentButton = container.querySelector(
      'button[aria-label="Copy agent key"]',
    ) as HTMLButtonElement | null;
    const copyUserButton = container.querySelector(
      'button[aria-label="Copy user automation key"]',
    ) as HTMLButtonElement | null;
    const copyAdminButton = container.querySelector(
      'button[aria-label="Copy admin automation key"]',
    ) as HTMLButtonElement | null;

    await act(async () => {
      hideButtons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      revealButtons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyAgentButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyUserButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      revealButtons[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyAdminButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(props.agentKey.toggleReveal).toHaveBeenCalledTimes(1);
    expect(props.userKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(props.agentKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.userKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleCopy).toHaveBeenCalledTimes(1);
  });
});
