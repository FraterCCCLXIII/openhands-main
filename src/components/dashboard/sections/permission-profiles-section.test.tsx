// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionProfilesSection } from "@/src/components/dashboard/sections/permission-profiles-section";
import { enableReactActEnvironment, setInputValue } from "@/src/test-utils/jsdom-helpers";
import type { PermissionProfile } from "@/src/types/integrations-hub";

enableReactActEnvironment();

const profile: PermissionProfile = {
  id: "profile-1",
  ownerId: "dev@localhost",
  name: "Research assistant",
  agentApiKey: "cla_profile_key",

  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T11:00:00.000Z",
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
};

const defaultProfile: PermissionProfile = {
  ...profile,
  id: "default-profile",
  name: null,
  agentApiKey: "cla_default_profile_key",
};

const profileWithoutAgentKey: PermissionProfile = {
  ...profile,
  id: "profile-without-key",
  agentApiKey: "",
};

const createDefaultProps = () => ({
  profiles: [profile],
  isPending: false,
  errorMessage: null,
  actionPending: false,
  isSaveModalOpen: false,
  onCloseSaveModal: vi.fn(),
  onSaveProfile: vi.fn(),
  onLoadProfile: vi.fn(),
  onUpdateProfile: vi.fn(),
  onDeleteProfile: vi.fn(),
});

const openActionsMenu = (container: HTMLElement, profileId: string) => {
  const trigger = container.querySelector(
    `[data-testid="permission-profile-menu-trigger-${profileId}"]`,
  ) as HTMLButtonElement | null;
  act(() => {
    trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

const getMenuButton = (testId: string) =>
  document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement | null;

describe("PermissionProfilesSection", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("renders saved profile summary and actions menu actions", () => {
    const props = createDefaultProps();

    act(() => {
      root.render(<PermissionProfilesSection {...props} />);
    });

    expect(container.textContent).toContain("Research assistant");
    expect(container.textContent).toContain(
      "1/2 integrations on · 1 enabled · 1 case-by-case · 3 disabled",
    );

    openActionsMenu(container, profile.id);

    act(() => {
      getMenuButton("permission-profile-load")?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });
    expect(props.onLoadProfile).toHaveBeenCalledWith(profile);

    openActionsMenu(container, profile.id);
    act(() => {
      getMenuButton("permission-profile-update-from-current")?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });
    expect(props.onUpdateProfile).toHaveBeenCalledWith(profile);
  });

  it("reveals and copies each profile agent key after an explicit action", async () => {
    const props = createDefaultProps();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(async () => {
      root.render(<PermissionProfilesSection {...props} />);
    });

    expect(container.textContent).not.toContain("cla_profile_key");
    expect(
      container.querySelector(
        'button[aria-label="Rotate research assistant agent key"]',
      ),
    ).not.toBeNull();

    const revealButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "Reveal key",
    );
    await act(async () => {
      revealButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("cla_profile_key");

    const copyButton = container.querySelector(
      'button[aria-label="Copy research assistant agent key"]',
    ) as HTMLButtonElement | null;
    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(writeTextMock).toHaveBeenCalledWith("cla_profile_key");
  });

  it("rotates an existing profile agent key from the inline key field", async () => {
    const props = createDefaultProps();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...profile,
        agentApiKey: "cla_rotated_profile_key",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<PermissionProfilesSection {...props} />);
    });

    const rotateButton = container.querySelector(
      'button[aria-label="Rotate research assistant agent key"]',
    ) as HTMLButtonElement | null;
    expect(rotateButton?.disabled).toBe(false);

    await act(async () => {
      rotateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/permission-profiles/profile-1/agent-key",
      expect.objectContaining({ method: "POST" }),
    );
    expect(container.textContent).toContain("cla_rotated_profile_key");
    expect(container.textContent).not.toContain("cla_profile_key");
  });

  it("provisions a missing profile agent key from the inline key field", async () => {
    const props = createDefaultProps();
    props.profiles = [profileWithoutAgentKey];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...profileWithoutAgentKey,
        agentApiKey: "cla_new_profile_key",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<PermissionProfilesSection {...props} />);
    });

    expect(container.textContent).toContain("No agent key provisioned yet");

    const revealButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "Reveal key",
    ) as HTMLButtonElement | undefined;
    const copyButton = container.querySelector(
      'button[aria-label="Copy research assistant agent key"]',
    ) as HTMLButtonElement | null;
    const provisionButton = container.querySelector(
      'button[aria-label="Provision research assistant agent key"]',
    ) as HTMLButtonElement | null;

    expect(revealButton?.disabled).toBe(true);
    expect(copyButton?.disabled).toBe(true);
    expect(provisionButton?.disabled).toBe(false);

    await act(async () => {
      provisionButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/permission-profiles/profile-without-key/agent-key",
      expect.objectContaining({ method: "POST" }),
    );
    expect(container.textContent).toContain("cla_new_profile_key");
  });

  it("captures profile names from the save modal before saving", () => {
    const props = createDefaultProps();
    props.isSaveModalOpen = true;

    act(() => {
      root.render(<PermissionProfilesSection {...props} />);
    });

    act(() =>
      setInputValue(
        document.querySelector('[data-testid="save-permissions-profile-name"]'),
        "Production guardrails",
      ),
    );

    const saveButton = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Save current settings"),
    );
    act(() => saveButton?.click());
    expect(props.onSaveProfile).toHaveBeenCalledWith("Production guardrails");
  });

  it("marks the default profile and disables delete in the actions menu", () => {
    const props = createDefaultProps();
    props.profiles = [defaultProfile];

    act(() => {
      root.render(<PermissionProfilesSection {...props} />);
    });

    expect(container.textContent).toContain("Default profile");
    expect(container.textContent).toContain("default");

    openActionsMenu(container, defaultProfile.id);

    const deleteButton = getMenuButton("permission-profile-delete");
    expect(deleteButton?.disabled).toBe(true);
  });
});
