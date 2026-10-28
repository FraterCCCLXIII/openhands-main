import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "test-utils";
import { setStoredConversationMetadata } from "#/api/conversation-metadata-store";

const useAgentProfilesMock = vi.fn();
const useActiveConversationMock = vi.fn();
const activateProfileMutate = vi.fn();
const createConversationMutate = vi.fn();

vi.mock("#/hooks/query/use-agent-profiles", () => ({
  useAgentProfiles: () => useAgentProfilesMock(),
}));

vi.mock("#/hooks/query/use-active-conversation", () => ({
  useActiveConversation: () => useActiveConversationMock(),
}));

vi.mock("#/hooks/mutation/use-create-conversation", () => ({
  useCreateConversation: () => ({ mutateAsync: createConversationMutate }),
  CREATE_CONVERSATION_MUTATION_KEY: ["create-conversation"],
}));

vi.mock("#/hooks/mutation/use-activate-agent-profile", () => ({
  useActivateAgentProfile: () => ({
    mutate: activateProfileMutate,
    isPending: false,
  }),
  ACTIVATE_AGENT_PROFILE_MUTATION_KEY: ["activate-agent-profile"],
}));

import {
  ChatInputAgentProfilePicker,
  ChatInputProfileMenuContent,
} from "#/components/features/chat/components/chat-input-profile-picker";

const PROFILES = [
  { id: "id-default", name: "Default", agent_kind: "openhands" },
  { id: "id-codex", name: "Codex", agent_kind: "acp" },
];

describe("ChatInputProfileMenuContent", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    useAgentProfilesMock.mockReset();
    useActiveConversationMock.mockReset();
    activateProfileMutate.mockReset();
    createConversationMutate.mockReset();
    // selectProfile chains .then off mutateAsync — keep a resolved default.
    createConversationMutate.mockResolvedValue({ conversation_id: "conv-x" });
    onClose.mockReset();
    localStorage.clear();

    useAgentProfilesMock.mockReturnValue({
      data: { profiles: PROFILES, active_agent_profile_id: "id-default" },
      isLoading: false,
    });
    useActiveConversationMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

  // The menu content renders <li> children (it lives inside the tools menu's
  // submenu <ContextMenu> in the app), so tests wrap it in a bare <ul>.
  const renderMenu = (navigation: object = { conversationId: null }) =>
    renderWithProviders(
      <ul>
        <ChatInputProfileMenuContent onClose={onClose} />
      </ul>,
      { navigation },
    );

  it("activates the picked profile on the home page", () => {
    renderMenu();
    fireEvent.click(
      screen.getByTestId("chat-input-agent-profile-option-Codex"),
    );

    expect(activateProfileMutate).toHaveBeenCalledWith("id-codex");
    expect(onClose).toHaveBeenCalled();
  });

  it("does not activate when the active profile is re-selected", () => {
    renderMenu();
    fireEvent.click(
      screen.getByTestId("chat-input-agent-profile-option-Default"),
    );

    expect(activateProfileMutate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("links to the AgentProfile library in settings", () => {
    const { container } = renderMenu();

    expect(
      container.ownerDocument.querySelector('a[href="/settings/agents"]'),
    ).not.toBeNull();
  });

  it("treats the launched profile as current inside a blank conversation", () => {
    // The active pointer is Codex, but this blank conversation was launched
    // from Default — re-selecting Default must be a no-op (no replacement
    // conversation, no activate).
    useAgentProfilesMock.mockReturnValue({
      data: { profiles: PROFILES, active_agent_profile_id: "id-codex" },
      isLoading: false,
    });
    useActiveConversationMock.mockReturnValue({
      data: {
        id: "conv-1",
        launched_agent_profile: {
          agent_profile_id: "id-default",
          revision: 2,
        },
      },
      isLoading: false,
    });

    renderMenu({ conversationId: "conv-1" });
    fireEvent.click(
      screen.getByTestId("chat-input-agent-profile-option-Default"),
    );

    expect(createConversationMutate).not.toHaveBeenCalled();
    expect(activateProfileMutate).not.toHaveBeenCalled();
  });

  it("starts a replacement conversation with the selected profile and workspace", async () => {
    const navigate = vi.fn();
    createConversationMutate.mockResolvedValue({ conversation_id: "conv-2" });
    useActiveConversationMock.mockReturnValue({
      data: {
        id: "conv-workspace",
        selected_repository: null,
        selected_workspace: "/workspace/alpha",
        launched_agent_profile: {
          agent_profile_id: "id-default",
          revision: 1,
        },
      },
      isLoading: false,
    });

    renderMenu({ conversationId: "conv-workspace", navigate });

    expect(screen.getByText("CHAT$START_NEW_WITH_PROFILE_HINT")).toBeVisible();
    fireEvent.click(
      screen.getByTestId("chat-input-agent-profile-option-Codex"),
    );

    expect(createConversationMutate).toHaveBeenCalledWith({
      agentProfileId: "id-codex",
      entryPoint: "blank_conversation_profile_picker",
      workingDir: "/workspace/alpha",
      workspaceMode: "local_repo",
    });
    expect(activateProfileMutate).not.toHaveBeenCalled();

    // Navigation rides the mutateAsync promise (survives the menu unmounting).
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/conversations/conv-2"),
    );
  });

  it("preserves repository and plugin context when changing a blank conversation profile", () => {
    setStoredConversationMetadata("conv-repo", {
      selected_repository: "OpenHands/agent-canvas",
      selected_branch: "feature",
      git_provider: "github",
      plugins: [
        {
          source: "github:OpenHands/extensions",
          ref: "v1",
          repo_path: "plugins/weather",
        },
      ],
    });
    useActiveConversationMock.mockReturnValue({
      data: {
        id: "conv-repo",
        selected_repository: "OpenHands/agent-canvas",
        selected_branch: "feature",
        git_provider: "github",
        launched_agent_profile: {
          agent_profile_id: "id-default",
          revision: 1,
        },
      },
      isLoading: false,
    });

    renderMenu({ conversationId: "conv-repo" });
    fireEvent.click(
      screen.getByTestId("chat-input-agent-profile-option-Codex"),
    );

    expect(createConversationMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        agentProfileId: "id-codex",
        repository: {
          name: "OpenHands/agent-canvas",
          gitProvider: "github",
          branch: "feature",
        },
        plugins: [
          {
            source: "github:OpenHands/extensions",
            ref: "v1",
            repo_path: "plugins/weather",
          },
        ],
      }),
    );
  });
});

describe("ChatInputAgentProfilePicker", () => {
  beforeEach(() => {
    useAgentProfilesMock.mockReset();
    useActiveConversationMock.mockReset();
    useActiveConversationMock.mockReturnValue({ data: undefined });
    activateProfileMutate.mockReset();
  });

  it("names the active profile and switches it from its menu", async () => {
    useAgentProfilesMock.mockReturnValue({
      data: { profiles: PROFILES, active_agent_profile_id: "id-default" },
      isLoading: false,
    });
    renderWithProviders(<ChatInputAgentProfilePicker />, {
      navigation: { conversationId: null },
    });

    const pill = screen.getByTestId("chat-input-agent-profile");
    expect(pill).toHaveTextContent("Default");
    fireEvent.click(pill);
    fireEvent.click(
      await screen.findByTestId("chat-input-agent-profile-option-Codex"),
    );

    expect(activateProfileMutate).toHaveBeenCalledWith("id-codex");
  });

  describe("in a started conversation", () => {
    beforeEach(() => {
      useAgentProfilesMock.mockReturnValue({
        data: { profiles: PROFILES, active_agent_profile_id: "id-default" },
        isLoading: false,
      });
      useActiveConversationMock.mockReturnValue({
        data: {
          id: "conv-1",
          launched_agent_profile: {
            agent_profile_id: "id-default",
            revision: 1,
          },
        },
        isLoading: false,
      });
    });

    const renderStarted = () =>
      renderWithProviders(<ChatInputAgentProfilePicker />, {
        navigation: { conversationId: "conv-1" },
      });

    it("names the conversation's agent profile", () => {
      renderStarted();

      expect(screen.getByTestId("chat-input-agent-profile")).toHaveTextContent(
        "Default",
      );
    });

    it("lists every profile with a three-dot button and marks the active one", () => {
      renderStarted();
      fireEvent.click(screen.getByTestId("chat-input-agent-profile"));

      const popover = screen.getByTestId("chat-input-agent-profile-popover");
      PROFILES.forEach((profile) => {
        expect(
          within(popover).getByTestId(
            `chat-input-agent-profile-option-${profile.name}`,
          ),
        ).toHaveTextContent(profile.name);
        expect(
          within(popover).getByTestId(
            `chat-input-agent-profile-more-${profile.name}`,
          ),
        ).toBeInTheDocument();
      });
      const activeRow = screen.getByTestId(
        "chat-input-agent-profile-option-Default",
      );
      const otherRow = screen.getByTestId(
        "chat-input-agent-profile-option-Codex",
      );
      expect(activeRow.querySelector("svg:last-child")).not.toBeNull();
      expect(otherRow.querySelectorAll("svg")).toHaveLength(1);
    });

    it("selects the profile when its row is clicked", () => {
      renderStarted();
      fireEvent.click(screen.getByTestId("chat-input-agent-profile"));
      fireEvent.click(
        screen.getByTestId("chat-input-agent-profile-option-Codex"),
      );

      expect(createConversationMutate).toHaveBeenCalledWith(
        expect.objectContaining({ agentProfileId: "id-codex" }),
      );
    });

    it("does not select the profile when the three-dot button is clicked", () => {
      renderStarted();
      fireEvent.click(screen.getByTestId("chat-input-agent-profile"));
      fireEvent.click(
        screen.getByTestId("chat-input-agent-profile-more-Codex"),
      );

      expect(createConversationMutate).not.toHaveBeenCalled();
      expect(
        screen.getByTestId("chat-input-agent-profile-menu-Codex"),
      ).toBeInTheDocument();
    });

    it("offers Set as active and agent settings for an inactive profile", () => {
      renderStarted();
      fireEvent.click(screen.getByTestId("chat-input-agent-profile"));
      fireEvent.click(
        screen.getByTestId("chat-input-agent-profile-more-Codex"),
      );

      const menu = screen.getByTestId("chat-input-agent-profile-menu-Codex");
      expect(
        within(menu).getByTestId("chat-input-agent-profile-set-active-Codex"),
      ).toBeInTheDocument();
      expect(
        within(menu).getByTestId("chat-input-agent-profile-settings-Codex"),
      ).toHaveAttribute("href", "/settings/agents");

      fireEvent.click(
        within(menu).getByTestId("chat-input-agent-profile-set-active-Codex"),
      );
      expect(createConversationMutate).toHaveBeenCalledWith(
        expect.objectContaining({ agentProfileId: "id-codex" }),
      );
    });

    it("omits Set as active for the already-active profile", () => {
      renderStarted();
      fireEvent.click(screen.getByTestId("chat-input-agent-profile"));
      fireEvent.click(
        screen.getByTestId("chat-input-agent-profile-more-Default"),
      );

      const menu = screen.getByTestId("chat-input-agent-profile-menu-Default");
      expect(
        within(menu).queryByTestId(
          "chat-input-agent-profile-set-active-Default",
        ),
      ).not.toBeInTheDocument();
      expect(
        within(menu).getByTestId("chat-input-agent-profile-settings-Default"),
      ).toBeInTheDocument();
    });
  });

  it("shows the pill but disables the dropdown when switching is not allowed", () => {
    useAgentProfilesMock.mockReturnValue({
      data: { profiles: PROFILES, active_agent_profile_id: "id-default" },
      isLoading: false,
    });
    renderWithProviders(<ChatInputAgentProfilePicker />, {
      navigation: { conversationId: "task-start-1" },
    });

    const pill = screen.getByTestId("chat-input-agent-profile");
    expect(pill).toHaveTextContent("Default");
    expect(pill).toBeDisabled();
    expect(pill).toHaveAttribute(
      "title",
      "CHAT$AGENT_PROFILE_SWITCH_UNAVAILABLE",
    );
    fireEvent.click(pill);
    expect(
      screen.queryByTestId("chat-input-agent-profile-popover"),
    ).not.toBeInTheDocument();
  });

  it("stays hidden without an active profile", () => {
    useAgentProfilesMock.mockReturnValue({
      data: { profiles: PROFILES, active_agent_profile_id: null },
      isLoading: false,
    });
    renderWithProviders(<ChatInputAgentProfilePicker />, {
      navigation: { conversationId: null },
    });

    expect(
      screen.queryByTestId("chat-input-agent-profile"),
    ).not.toBeInTheDocument();
  });
});
