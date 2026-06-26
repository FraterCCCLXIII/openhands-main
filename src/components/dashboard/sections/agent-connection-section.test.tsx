// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentConnectionSection } from "@/src/components/dashboard/sections/agent-connection-section";

import {
  enableReactActEnvironment,
  setInputValue,
} from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const createDefaultProps = () => ({
  adminKey: {
    copied: false,
    handleCopy: vi.fn(),
    handleReveal: vi.fn(),
    handleRotate: vi.fn(),
    hasKey: false,
    maskedValue: "",
    revealed: false,
  },
  adminPromptExample: "Use the admin key for QA.",
  adminSchemaEndpoint: "https://example.com/api/admin/openapi",
  agentKey: {
    copied: false,
    handleCopy: vi.fn(),
    handleRotate: vi.fn(),
    maskedValue: "cla_••••••••",
    revealed: false,
    toggleReveal: vi.fn(),
  },
  agentMcpConfigExample: '{"transport":"streamable-http"}',
  agentMcpEndpoint: "https://example.com/api/mcp",
  permissionProfiles: [
    {
      id: "default-profile",
      ownerId: "dev@localhost",
      name: null,
      agentApiKey: "cla_default_profile_key",
      createdAt: "2026-06-10T00:00:00.000Z",
      updatedAt: "2026-06-10T00:00:00.000Z",
      snapshot: { integrations: {} },
    },
    {
      id: "research-profile",
      ownerId: "dev@localhost",
      name: "Research assistant",
      agentApiKey: "cla_research_profile_key",
      createdAt: "2026-06-10T00:00:00.000Z",
      updatedAt: "2026-06-10T00:00:00.000Z",
      snapshot: { integrations: {} },
    },
  ],

  agentMcpToolName: "github__list_issues",
  agentOpenApiSchemaEndpoint: "https://example.com/api/agent/openapi",
  agentRestPromptExample: "Use the agent REST API.",
  agentApiReady: true,
  isAdmin: true,
  userKey: {
    copied: false,
    handleCopy: vi.fn(),
    handleReveal: vi.fn(),
    handleRotate: vi.fn(),
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
          agentApiReady={false}
          isAdmin={false}
          permissionProfiles={[]}
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
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

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
    expect(container.textContent).toContain("https://example.com/api/agent/openapi");

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(container.textContent).toContain("Agent key");
    expect(container.textContent).not.toContain("Permission profile key");
    expect(container.textContent).toContain("Default profile agent key");
    expect(container.textContent).not.toContain("Research assistant agent key");
    expect(container.textContent).not.toContain("cla_default_profile_key");
    expect(container.textContent).not.toContain("cla_research_profile_key");

    const profileSelect = container.querySelector("select") as HTMLSelectElement | null;
    expect(profileSelect?.value).toBe("default-profile");

    const revealButtons = buttons.filter((button) => button.textContent?.includes("Reveal"));
    const copyUserButton = container.querySelector(
      'button[aria-label="Copy user automation key"]',
    ) as HTMLButtonElement | null;
    const copyAdminButton = container.querySelector(
      'button[aria-label="Copy admin automation key"]',
    ) as HTMLButtonElement | null;
    const copyDefaultProfileButton = container.querySelector(
      'button[aria-label="Copy default profile agent key"]',
    ) as HTMLButtonElement | null;
    const rotateUserButton = container.querySelector(
      'button[aria-label="Rotate user automation key"]',
    ) as HTMLButtonElement | null;
    const rotateAdminButton = container.querySelector(
      'button[aria-label="Rotate admin automation key"]',
    ) as HTMLButtonElement | null;
    const rotateDefaultProfileButton = container.querySelector(
      'button[aria-label="Rotate default profile agent key"]',
    ) as HTMLButtonElement | null;

    expect(rotateDefaultProfileButton?.disabled).toBe(false);

    await act(async () => {
      revealButtons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyDefaultProfileButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyUserButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      rotateUserButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      revealButtons[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyAdminButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      rotateAdminButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      revealButtons[2]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("cla_default_profile_key");
    expect(props.agentKey.toggleReveal).not.toHaveBeenCalled();
    expect(props.agentKey.handleCopy).not.toHaveBeenCalled();
    expect(props.agentKey.handleRotate).not.toHaveBeenCalled();
    expect(props.userKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith("cla_default_profile_key");
    expect(props.userKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.userKey.handleRotate).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleRotate).toHaveBeenCalledTimes(1);

    await act(async () => {
      setInputValue(profileSelect, "research-profile");
    });

    expect(container.textContent).toContain("Research assistant agent key");
    expect(container.textContent).not.toContain("cla_research_profile_key");
    expect(container.textContent).not.toContain("cla_default_profile_key");
    expect(
      container.querySelector(
        'button[aria-label="Rotate research assistant agent key"]',
      ),
    ).not.toBeNull();
  });

  it("shows profile key provisioning on the agent connection page even before the legacy agent key is ready", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <AgentConnectionSection
          {...props}
          agentApiReady={false}
          agentKey={{
            ...props.agentKey,
            maskedValue: "",
          }}
          permissionProfiles={[
            {
              ...props.permissionProfiles[0]!,
              agentApiKey: "",
            },
          ]}
        />,
      );
    });

    expect(container.textContent).toContain("Default profile agent key");
    expect(container.textContent).toContain(
      "No agent key has been provisioned for this profile yet.",
    );

    const provisionButton = container.querySelector(
      'button[aria-label="Provision default profile agent key"]',
    ) as HTMLButtonElement | null;
    expect(provisionButton?.disabled).toBe(false);
  });
});
