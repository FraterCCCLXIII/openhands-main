// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentConnectionSection } from "@/src/components/dashboard/sections/agent-connection-section";

import {
  enableReactActEnvironment,
  selectDropdownOption,
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
  permissionProfilesLoading: false,
  permissionProfilesError: null,

  agentMcpToolName: "github__list_issues",
  agentOpenApiSchemaEndpoint: "https://example.com/api/agent/openapi",
  agentRestPromptExample: "Use the agent REST API.",
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
          isAdmin={false}
          permissionProfiles={[]}
          permissionProfilesLoading
          adminPromptExample=""
          adminSchemaEndpoint=""
          userKey={{
            ...props.userKey,
            maskedValue: "",
          }}
        />,
      );
    });

    expect(container.textContent).toContain("Loading agent key…");
    expect(container.textContent).toContain(
      "No user automation key yet. Reveal or copy to create one.",
    );
    expect(container.textContent).not.toContain("Admin automation key");
    expect(container.textContent).not.toContain("Admin REST API");
  });

  it("surfaces a permission-profile fetch error on the agent key card", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <AgentConnectionSection
          {...props}
          permissionProfiles={[]}
          permissionProfilesLoading={false}
          permissionProfilesError="Network error"
        />,
      );
    });

    expect(container.textContent).toContain("Unable to load agent key: Network error");
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

    const profileSelectTrigger = container.querySelector(
      '[data-testid="agent-connection-permission-profile-select-trigger"]',
    );
    expect(profileSelectTrigger?.textContent).toContain("Default profile");

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
    expect(props.userKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith("cla_default_profile_key");
    expect(props.userKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.userKey.handleRotate).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleRotate).toHaveBeenCalledTimes(1);

    await act(async () => {
      await selectDropdownOption(
        container,
        "agent-connection-permission-profile-select",
        "research-profile",
      );
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

  it("renders copy buttons for connection detail fields and copies correct values on click", async () => {
    const props = createDefaultProps();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(async () => {
      root.render(<AgentConnectionSection {...props} permissionProfiles={[]} />);
    });

    const copyMcpEndpointButton = container.querySelector(
      'button[aria-label="Copy MCP endpoint"]',
    ) as HTMLButtonElement | null;
    const copyExampleToolButton = container.querySelector(
      'button[aria-label="Copy example tool name"]',
    ) as HTMLButtonElement | null;
    const copyMcpConfigButton = container.querySelector(
      'button[aria-label="Copy MCP config example"]',
    ) as HTMLButtonElement | null;
    const copyAgentSchemaButton = container.querySelector(
      'button[aria-label="Copy Agent REST API OpenAPI schema URL"]',
    ) as HTMLButtonElement | null;
    const copyAgentPromptButton = container.querySelector(
      'button[aria-label="Copy Agent REST API example agent prompt"]',
    ) as HTMLButtonElement | null;
    const copyUserSchemaButton = container.querySelector(
      'button[aria-label="Copy User REST API OpenAPI schema URL"]',
    ) as HTMLButtonElement | null;
    const copyUserPromptButton = container.querySelector(
      'button[aria-label="Copy User REST API example agent prompt"]',
    ) as HTMLButtonElement | null;

    expect(copyMcpEndpointButton).not.toBeNull();
    expect(copyExampleToolButton).not.toBeNull();
    expect(copyMcpConfigButton).not.toBeNull();
    expect(copyAgentSchemaButton).not.toBeNull();
    expect(copyAgentPromptButton).not.toBeNull();
    expect(copyUserSchemaButton).not.toBeNull();
    expect(copyUserPromptButton).not.toBeNull();

    await act(async () => {
      copyMcpEndpointButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("https://example.com/api/mcp");

    await act(async () => {
      copyExampleToolButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("github__list_issues");

    await act(async () => {
      copyMcpConfigButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith('{"transport":"streamable-http"}');

    await act(async () => {
      copyAgentSchemaButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("https://example.com/api/agent/openapi");

    await act(async () => {
      copyAgentPromptButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("Use the agent REST API.");

    await act(async () => {
      copyUserSchemaButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("https://example.com/api/user/openapi");

    await act(async () => {
      copyUserPromptButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("Use the user REST API.");

    expect(writeTextMock).toHaveBeenCalledTimes(7);
  });

  it("shows the copied confirmation icon after a successful click and reverts after 2s", async () => {
    vi.useFakeTimers();
    try {
      const props = createDefaultProps();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      await act(async () => {
        root.render(<AgentConnectionSection {...props} permissionProfiles={[]} />);
      });

      const copyMcpEndpointButton = container.querySelector(
        'button[aria-label="Copy MCP endpoint"]',
      ) as HTMLButtonElement | null;
      expect(copyMcpEndpointButton).not.toBeNull();
      expect(
        copyMcpEndpointButton?.querySelector("svg")?.getAttribute("class"),
      ).toContain("lucide-copy");

      await act(async () => {
        copyMcpEndpointButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(copyMcpEndpointButton?.getAttribute("data-copied")).toBe("true");
      expect(
        copyMcpEndpointButton?.querySelector("svg")?.getAttribute("class"),
      ).toContain("lucide-circle-check");

      await act(async () => {
        vi.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(copyMcpEndpointButton?.getAttribute("data-copied")).toBe("false");
      expect(
        copyMcpEndpointButton?.querySelector("svg")?.getAttribute("class"),
      ).toContain("lucide-copy");
    } finally {
      vi.useRealTimers();
    }
  });

  it("surfaces an error state when the clipboard write rejects", async () => {
    vi.useFakeTimers();
    try {
      const props = createDefaultProps();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const writeTextMock = vi.fn().mockRejectedValue(new Error("denied"));
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      await act(async () => {
        root.render(<AgentConnectionSection {...props} permissionProfiles={[]} />);
      });

      const copyMcpEndpointButton = container.querySelector(
        'button[aria-label="Copy MCP endpoint"]',
      ) as HTMLButtonElement | null;

      await act(async () => {
        copyMcpEndpointButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(copyMcpEndpointButton?.getAttribute("data-error")).toBe("true");
      expect(
        copyMcpEndpointButton?.querySelector("svg")?.getAttribute("class"),
      ).toContain("lucide-circle-x");
      expect(copyMcpEndpointButton?.getAttribute("aria-label")).toBe(
        "Copy MCP endpoint (failed)",
      );
      expect(consoleErrorSpy).toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(2000);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(copyMcpEndpointButton?.getAttribute("data-error")).toBe("false");
      consoleErrorSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not leak the copied-reset timeout when unmounted during the pending window", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    try {
      const props = createDefaultProps();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      await act(async () => {
        root.render(<AgentConnectionSection {...props} permissionProfiles={[]} />);
      });

      const copyMcpEndpointButton = container.querySelector(
        'button[aria-label="Copy MCP endpoint"]',
      ) as HTMLButtonElement | null;

      await act(async () => {
        copyMcpEndpointButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(copyMcpEndpointButton?.getAttribute("data-copied")).toBe("true");

      const clearTimeoutCallsBefore = clearTimeoutSpy.mock.calls.length;

      await act(async () => {
        root.unmount();
      });

      // The cleanup effect must have cleared the pending timer; no React
      // state update should fire on the now-unmounted component.
      expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(
        clearTimeoutCallsBefore,
      );

      expect(() =>
        vi.advanceTimersByTime(2000),
      ).not.toThrow();
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it("shows admin connection detail copy buttons when isAdmin is true", async () => {
    const props = createDefaultProps();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(async () => {
      root.render(<AgentConnectionSection {...props} permissionProfiles={[]} isAdmin={true} />);
    });

    const copyAdminSchemaButton = container.querySelector(
      'button[aria-label="Copy Admin REST API OpenAPI schema URL"]',
    ) as HTMLButtonElement | null;
    const copyAdminPromptButton = container.querySelector(
      'button[aria-label="Copy Admin REST API example agent prompt"]',
    ) as HTMLButtonElement | null;

    expect(copyAdminSchemaButton).not.toBeNull();
    expect(copyAdminPromptButton).not.toBeNull();

    await act(async () => {
      copyAdminSchemaButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("https://example.com/api/admin/openapi");

    await act(async () => {
      copyAdminPromptButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeTextMock).toHaveBeenLastCalledWith("Use the admin key for QA.");
  });

  it("shows profile key provisioning on the agent connection page even before the legacy agent key is ready", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <AgentConnectionSection
          {...props}
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
