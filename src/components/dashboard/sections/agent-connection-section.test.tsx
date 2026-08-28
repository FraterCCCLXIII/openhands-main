// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentConnectionSection } from "@/src/components/dashboard/sections/agent-connection-section";
import type { PermissionProfile } from "@/src/types/integrations-hub";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

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
      snapshot: {
        integrations: {
          github: {
            enabled: true,
            tools: {
              search: "enabled",
              create_issue: "approval_required",
              delete_repo: "disabled",
            },
          },
          archived: {
            enabled: false,
            tools: {
              read_archive: "enabled",
              export_archive: "approval_required",
            },
          },
        },
      },
    },
  ] as PermissionProfile[],
  permissionProfilesLoading: false,
  permissionProfilesError: null,
  isSaveModalOpen: false,
  onOpenSaveModal: vi.fn(),
  onCloseSaveModal: vi.fn(),
  onSaveProfile: vi.fn(),
  onLoadProfile: vi.fn(),
  onUpdateProfile: vi.fn(),
  onDeleteProfile: vi.fn(),

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
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("renders a keys list without inline connection details", async () => {
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

    expect(container.textContent).toContain("Permission profiles");
    expect(container.textContent).toContain("Automation keys");
    expect(container.textContent).toContain("Loading profiles...");
    expect(container.textContent).toContain("New profile");
    expect(container.textContent).toContain(
      "No user automation key yet. Reveal or copy to create one.",
    );
    expect(container.textContent).not.toContain("Admin automation key");
    expect(container.textContent).not.toContain("Agent MCP");
  });

  it("surfaces a permission-profile fetch error on the agent key row", async () => {
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

    expect(container.textContent).toContain("Network error");
  });

  it("renders key rows and forwards reveal/copy/rotate actions", async () => {
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
    expect(container.textContent).toContain("User automation key");
    expect(container.textContent).toContain("Default profile");
    expect(container.textContent).toContain("Research assistant");
    expect(container.textContent).toContain(
      "1/2 integrations on · 1 enabled · 1 case-by-case · 3 disabled",
    );
    expect(container.textContent).not.toContain("cla_default_profile_key");
    expect(container.querySelector(
      '[data-testid="agent-connection-permission-profile-select"]',
    )).toBeNull();

    const revealAgent = container.querySelector(
      '[data-testid="agent-connection-agent-key-row-default-profile-reveal"]',
    ) as HTMLButtonElement;
    const copyAgent = container.querySelector(
      '[data-testid="agent-connection-agent-key-row-default-profile-copy"]',
    ) as HTMLButtonElement;
    const revealUser = container.querySelector(
      '[data-testid="agent-connection-user-key-row-reveal"]',
    ) as HTMLButtonElement;
    const copyUser = container.querySelector(
      '[data-testid="agent-connection-user-key-row-copy"]',
    ) as HTMLButtonElement;
    const rotateUser = container.querySelector(
      '[data-testid="agent-connection-user-key-row-rotate"]',
    ) as HTMLButtonElement;
    const revealAdmin = container.querySelector(
      '[data-testid="agent-connection-admin-key-row-reveal"]',
    ) as HTMLButtonElement;
    const copyAdmin = container.querySelector(
      '[data-testid="agent-connection-admin-key-row-copy"]',
    ) as HTMLButtonElement;
    const rotateAdmin = container.querySelector(
      '[data-testid="agent-connection-admin-key-row-rotate"]',
    ) as HTMLButtonElement;

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(async () => {
      revealAgent.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyAgent.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      revealUser.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyUser.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      rotateUser.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      revealAdmin.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      copyAdmin.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      rotateAdmin.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("cla_default_profile_key");
    expect(writeTextMock).toHaveBeenCalledWith("cla_default_profile_key");
    expect(props.userKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(props.userKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.userKey.handleRotate).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleReveal).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleCopy).toHaveBeenCalledTimes(1);
    expect(props.adminKey.handleRotate).toHaveBeenCalledTimes(1);

    const revealResearch = container.querySelector(
      '[data-testid="agent-connection-agent-key-row-research-profile-reveal"]',
    ) as HTMLButtonElement;
    await act(async () => {
      revealResearch.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("cla_research_profile_key");
  });

  it("opens the save-profile modal from the new profile button", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(<AgentConnectionSection {...props} />);
    });

    const newProfileButton = container.querySelector(
      '[data-testid="agent-connection-new-profile"]',
    ) as HTMLButtonElement;
    await act(async () => {
      newProfileButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(props.onOpenSaveModal).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.render(<AgentConnectionSection {...props} isSaveModalOpen />);
    });
    expect(
      document.body.querySelector('[data-testid="save-permissions-modal"]'),
    ).toBeTruthy();
  });

  it("opens connection details in a modal when requested", async () => {
    const props = createDefaultProps();
    const onConnectionDetailsOpenChange = vi.fn();

    await act(async () => {
      root.render(
        <AgentConnectionSection
          {...props}
          connectionDetailsOpen
          onConnectionDetailsOpenChange={onConnectionDetailsOpenChange}
        />,
      );
    });

    const modal = document.body.querySelector(
      '[data-testid="agent-connection-details-modal"]',
    );
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain("Agent MCP");
    expect(modal?.textContent).toContain("Admin REST API");
    expect(
      document.body.querySelector(
        '[data-testid="agent-connection-mcp-endpoint"]',
      ),
    ).toBeTruthy();
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

    expect(container.textContent).toContain("Default profile");
    expect(container.textContent).toContain(
      "No agent key has been provisioned for this profile yet.",
    );

    const provisionButton = container.querySelector(
      'button[aria-label="Provision default profile"]',
    ) as HTMLButtonElement | null;
    expect(provisionButton?.disabled).toBe(false);
  });

  it("forwards load and update actions from the fuller profile menu", async () => {
    const props = createDefaultProps();
    const researchProfile = props.permissionProfiles[1];

    await act(async () => {
      root.render(<AgentConnectionSection {...props} />);
    });

    const trigger = container.querySelector(
      '[data-testid="permission-profile-menu-trigger-research-profile"]',
    ) as HTMLButtonElement;
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      document
        .querySelector('[data-testid="permission-profile-load"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(props.onLoadProfile).toHaveBeenCalledWith(researchProfile);

    await act(async () => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      document
        .querySelector('[data-testid="permission-profile-update-from-current"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(props.onUpdateProfile).toHaveBeenCalledWith(researchProfile);
  });

  it("marks the default profile and disables delete in the actions menu", async () => {
    const props = createDefaultProps();

    await act(async () => {
      root.render(
        <AgentConnectionSection
          {...props}
          permissionProfiles={[props.permissionProfiles[0]!]}
        />,
      );
    });

    expect(container.textContent).toContain("Default");

    await act(async () => {
      container
        .querySelector('[data-testid="permission-profile-menu-trigger-default-profile"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const deleteButton = document.querySelector(
      '[data-testid="permission-profile-delete"]',
    ) as HTMLButtonElement | null;
    expect(deleteButton?.disabled).toBe(true);
  });
});
