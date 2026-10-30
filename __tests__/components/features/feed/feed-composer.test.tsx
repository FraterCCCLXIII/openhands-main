import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedComposer } from "#/components/features/feed/feed-composer";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { ALL_FEED_FILTER } from "#/utils/feed-filters";
import { renderWithProviders } from "../../../../test-utils";

const { launchConversation, errorToast, warningToast } = vi.hoisted(() => ({
  launchConversation: vi.fn(),
  errorToast: vi.fn(),
  warningToast: vi.fn(),
}));

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
    i18n: { language: "en", exists: () => false },
  }),
}));

// The real input needs the whole chat provider tree; a stub with the same
// contract (submit callback, toolbar slot) is enough here.
vi.mock("#/components/features/chat/custom-chat-input", () => ({
  CustomChatInput: ({
    onSubmit,
    toolbarLeading,
  }: {
    onSubmit: (message: string) => void;
    toolbarLeading?: React.ReactNode;
  }) => (
    <div>
      {toolbarLeading}
      <button
        type="button"
        data-testid="send"
        onClick={() => onSubmit("fix the build")}
      />
    </div>
  ),
}));

vi.mock("#/hooks/mutation/resolve-conversation-launch", () => ({
  launchConversation,
}));

vi.mock("#/utils/custom-toast-handlers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#/utils/custom-toast-handlers")>()),
  displayErrorToast: errorToast,
  displayWarningToast: warningToast,
  displaySuccessToastWithLink: vi.fn(),
}));

vi.mock("#/hooks/use-llm-configured", () => ({
  useLlmConfigured: () => ({ isConfigured: true, isLoading: false }),
}));

const profilesResponse = {
  profiles: [
    { id: "p-default", name: "default", agent_kind: "openhands" },
    { id: "p-atlas", name: "Atlas", agent_kind: "openhands" },
    { id: "p-acp", name: "Claude Code", agent_kind: "acp" },
  ],
  active_agent_profile_id: "p-default",
};
const listAgentProfiles = vi.hoisted(() => vi.fn());
vi.mock(
  "#/api/agent-profiles-service/agent-profiles-service.api",
  async (orig) => ({
    ...(await orig<
      typeof import("#/api/agent-profiles-service/agent-profiles-service.api")
    >()),
    default: { listProfiles: listAgentProfiles },
  }),
);
vi.mock("#/api/profiles-service/profiles-service.api", () => ({
  default: {
    listProfiles: vi.fn().mockResolvedValue({
      profiles: [{ name: "kimi", model: "kimi-k3" }],
      active_profile: "kimi",
    }),
  },
}));

const addFactory = () =>
  useFeedFactoriesStore
    .getState()
    .addFactory({ id: "f1", name: "Web", description: "", ownerId: "you" });

const send = async () => {
  const user = userEvent.setup();
  await user.click(await screen.findByTestId("send"));
};

const pick = async (trigger: string, optionText: string) => {
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByTestId(trigger)).toBeEnabled());
  await user.click(screen.getByTestId(trigger));
  await user.click(
    await within(await screen.findByTestId(`${trigger}-menu`)).findByText(
      optionText,
    ),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, "", "/");
  localStorage.clear();
  useFeedFactoriesStore.setState(useFeedFactoriesStore.getInitialState());
  useFactoryInboxStore.setState({ items: [] });
  useFeedFilterStore.setState({ filter: ALL_FEED_FILTER });
  listAgentProfiles.mockResolvedValue(profilesResponse);
  launchConversation.mockResolvedValue({
    id: "task-1",
    app_conversation_id: "conv-1",
    agent_server_url: null,
  });
  addFactory();
});

describe("FeedComposer", () => {
  it("sends to the factory's conductor with the chosen model and places it in the inbox", async () => {
    useFeedFactoriesStore.getState().addAgent("f1", "Atlas");
    useFeedFactoriesStore.getState().setCoordinator("f1", "Atlas");
    renderWithProviders(<FeedComposer />);

    await pick(
      "feed-composer-destination",
      "FEED$COMPOSER_DESTINATION_INBOX:Web",
    );
    await pick("feed-composer-model", "kimi");
    await send();

    await waitFor(() => expect(launchConversation).toHaveBeenCalled());
    expect(launchConversation.mock.calls[0][0]).toMatchObject({
      agentProfileId: "p-atlas",
    });
    expect(launchConversation.mock.calls[0][1]).toMatchObject({
      initialUserMsg: "fix the build",
      llmProfile: "kimi",
    });
    await waitFor(() =>
      expect(useFeedFactoriesStore.getState().assignments["conv-1"]).toEqual({
        factoryId: "f1",
        agentName: "Atlas",
      }),
    );
    expect(useFactoryInboxStore.getState().items[0]).toMatchObject({
      factoryId: "f1",
      conversationId: "conv-1",
    });
    expect(warningToast).not.toHaveBeenCalled();
  });

  it("falls back to the active profile and says so when the factory has no conductor profile", async () => {
    renderWithProviders(<FeedComposer />);

    await pick(
      "feed-composer-destination",
      "FEED$COMPOSER_DESTINATION_INBOX:Web",
    );
    await send();

    await waitFor(() => expect(launchConversation).toHaveBeenCalled());
    expect(launchConversation.mock.calls[0][0]).toMatchObject({
      agentProfileId: "p-default",
    });
    await waitFor(() => expect(warningToast).toHaveBeenCalled());
    expect(useFeedFactoriesStore.getState().assignments["conv-1"]).toEqual({
      factoryId: "f1",
      agentName: "default",
    });
  });

  it("starts an unplaced conversation when no factory is the destination", async () => {
    renderWithProviders(<FeedComposer />);
    await send();

    await waitFor(() => expect(launchConversation).toHaveBeenCalled());
    expect(useFeedFactoriesStore.getState().assignments).toEqual({});
  });

  it("disables the model picker for an agent that runs its own model", async () => {
    renderWithProviders(<FeedComposer />);

    await pick("feed-composer-agent", "Claude Code");

    expect(screen.getByTestId("feed-composer-model")).toBeDisabled();
  });

  it("reports a failed launch through the error toast and places nothing", async () => {
    launchConversation.mockRejectedValue(new Error("boom"));
    renderWithProviders(<FeedComposer />);

    await pick(
      "feed-composer-destination",
      "FEED$COMPOSER_DESTINATION_INBOX:Web",
    );
    await send();

    await waitFor(() => expect(errorToast).toHaveBeenCalledWith("boom"));
    expect(useFeedFactoriesStore.getState().assignments).toEqual({});
  });

  it("disables the agent picker when there are no agent profiles", async () => {
    listAgentProfiles.mockResolvedValue({
      profiles: [],
      active_agent_profile_id: null,
    });
    renderWithProviders(<FeedComposer />);

    await waitFor(() =>
      expect(screen.getByTestId("feed-composer-agent")).toBeDisabled(),
    );
  });
});
