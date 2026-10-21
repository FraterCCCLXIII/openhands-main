import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NavigationProvider,
  type NavigationContextValue,
} from "#/context/navigation-context";
import { CreateInstructions } from "#/components/features/automations/create-instructions";
import { I18nKey } from "#/i18n/declaration";
import { useConversationStore } from "#/stores/conversation-store";

const mocks = vi.hoisted(() => ({
  createConversationMutate: vi.fn(),
  isCreatingConversation: vi.fn(() => false),
  trackAutomationCreatedButton: vi.fn(),
}));

vi.mock("#/hooks/mutation/use-create-conversation", () => ({
  useCreateConversation: () => ({
    mutate: mocks.createConversationMutate,
    isPending: false,
  }),
}));

vi.mock("#/hooks/use-is-creating-conversation", () => ({
  useIsCreatingConversation: () => mocks.isCreatingConversation(),
}));

vi.mock("#/contexts/active-backend-context", () => ({
  useActiveBackend: () => ({ backend: { kind: "local" } }),
}));

vi.mock("#/hooks/use-tracking", () => ({
  useTracking: () => ({
    trackAutomationCreatedButton: mocks.trackAutomationCreatedButton,
  }),
}));

vi.mock("#/hooks/query/use-settings", () => ({
  useSettings: () => ({ data: { user_consents_to_analytics: true } }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        [I18nKey.AUTOMATIONS$CREATE_AUTOMATION_BUTTON]: "Create Automation",
        [I18nKey.AUTOMATIONS$FIND_OPPORTUNITIES_BUTTON]: "Find opportunities",
        [I18nKey.AUTOMATIONS$CREATE_AUTOMATION_PROMPT]:
          "Help me figure out what I should automate.",
        [I18nKey.AUTOMATIONS$CREATE_INSTRUCTIONS_GUIDANCE]:
          "OpenHands can help identify high-value automations from your recurring work.",
        [I18nKey.HOME$CREATING_CONVERSATION]: "Creating conversation…",
        [I18nKey.ERROR$GENERIC]: "Something went wrong.",
      };
      return translations[key] || key;
    },
  }),
  Trans: ({
    i18nKey,
    components,
  }: {
    i18nKey: string;
    components?: Record<string, React.ReactElement>;
  }) => {
    if (i18nKey !== I18nKey.AUTOMATIONS$EMPTY_OPTION_CONVERSATION_DESC) {
      return i18nKey;
    }

    const chip = (text: string) =>
      components?.cmd ? React.cloneElement(components.cmd, {}, text) : text;

    return (
      <>
        Start a conversation and ask OpenHands to{" "}
        {components?.example
          ? React.cloneElement(
              components.example,
              {},
              chip("help me figure out what I should automate"),
            )
          : null}{" "}
        or{" "}
        {components?.example
          ? React.cloneElement(
              components.example,
              {},
              <>
                {chip("Create an automation")}
                {components.punct
                  ? React.cloneElement(components.punct, {}, ".")
                  : null}
              </>,
            )
          : null}
      </>
    );
  },
}));

function renderCreateInstructions() {
  const value: NavigationContextValue = {
    currentPath: "/automations",
    conversationId: null,
    isNavigating: false,
    navigate: vi.fn(),
  };

  const result = render(
    <NavigationProvider value={value}>
      <CreateInstructions />
    </NavigationProvider>,
  );

  return { ...result, navigate: value.navigate };
}

describe("CreateInstructions", () => {
  beforeEach(() => {
    mocks.createConversationMutate.mockReset();
    mocks.trackAutomationCreatedButton.mockReset();
    mocks.isCreatingConversation.mockReturnValue(false);
    mocks.createConversationMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        conversation_id: "automation-conversation",
        session_api_key: null,
        url: null,
      });
    });
    useConversationStore.getState().clearComposer("automation-conversation");
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders create and find-opportunities actions with both example prompts", () => {
    renderCreateInstructions();

    expect(
      screen.getByTestId("automations-create-automation"),
    ).toHaveTextContent("Create Automation");
    expect(
      screen.getByTestId("automations-find-opportunities"),
    ).toHaveTextContent("Find opportunities");
    expect(
      screen
        .getAllByTestId("automations-create-instructions-example")
        .map((element) => element.textContent),
    ).toEqual([
      "help me figure out what I should automate",
      "Create an automation",
    ]);
  });

  it("tracks the click and opens the setup form without creating a conversation", async () => {
    const user = userEvent.setup();
    const { navigate } = renderCreateInstructions();

    await user.click(screen.getByTestId("automations-create-automation"));

    expect(mocks.trackAutomationCreatedButton).toHaveBeenCalledWith({
      backendKind: "local",
    });
    expect(mocks.createConversationMutate).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/automations/setup");
  });

  it("starts a discovery conversation with the prompt seeded and tracks intent and source", async () => {
    const user = userEvent.setup();
    const setMessageToSend = vi.fn();
    useConversationStore.setState({ setMessageToSend });
    const { navigate } = renderCreateInstructions();

    await user.click(screen.getByTestId("automations-find-opportunities"));

    expect(mocks.trackAutomationCreatedButton).toHaveBeenCalledWith({
      backendKind: "local",
      intent: "find_opportunities",
      source: "empty_state",
    });
    expect(navigate).toHaveBeenCalledWith(
      "/conversations/automation-conversation",
    );
    expect(
      JSON.parse(
        window.localStorage.getItem(
          "conversation-state-automation-conversation",
        ) ?? "{}",
      ).draftMessage,
    ).toBe("Help me figure out what I should automate.");
    await waitFor(() => {
      expect(setMessageToSend).toHaveBeenCalledWith(
        "automation-conversation",
        "Help me figure out what I should automate.",
      );
    });
  });

  it("shows a launch modal while the discovery conversation is being created", async () => {
    const user = userEvent.setup();
    mocks.createConversationMutate.mockImplementationOnce(() => {});
    renderCreateInstructions();

    await user.click(screen.getByTestId("automations-find-opportunities"));

    expect(
      await screen.findByTestId("automation-conversation-launch-modal"),
    ).toHaveTextContent("Creating conversation…");
  });
});
