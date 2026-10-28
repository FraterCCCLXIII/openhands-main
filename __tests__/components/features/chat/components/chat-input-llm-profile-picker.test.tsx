import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "test-utils";

const useChatInputLlmProfileStateMock = vi.fn();

vi.mock("#/hooks/use-chat-input-llm-profile-state", () => ({
  useChatInputLlmProfileState: () => useChatInputLlmProfileStateMock(),
}));

const listProviderConnectionsMock = vi.fn();

// Service-level mock (not the hook): the dropdown reads the real
// useProviderConnections query to decide which providers are connected.
vi.mock(
  "#/api/provider-connections-service/provider-connections-service.api",
  () => ({
    default: {
      list: (...args: unknown[]) => listProviderConnectionsMock(...args),
    },
  }),
);

import { useFreeModelsStore } from "#/stores/free-models-store";
import { ChatInputLlmProfilePicker } from "#/components/features/chat/components/chat-input-llm-profile-picker";

const PROFILES = [
  {
    name: "Fast",
    model: "openai/gpt-4o-mini",
    base_url: null,
    api_key_set: true,
  },
  {
    name: "Smart",
    model: "anthropic/claude-opus",
    base_url: null,
    api_key_set: true,
  },
  {
    name: "Opus-Two",
    model: "anthropic/claude-opus-4",
    base_url: null,
    api_key_set: true,
  },
  {
    name: "Grok",
    model: "xai/grok-4",
    base_url: null,
    api_key_set: false,
  },
  {
    name: "Legacy",
    model: "mistral-large",
    base_url: null,
    api_key_set: true,
  },
];

const selectProfile = vi.fn();

function state(overrides = {}) {
  return {
    profiles: PROFILES,
    currentProfileName: "Fast",
    currentProfileModel: "openai/gpt-4o-mini",
    isLoading: false,
    isSwitching: false,
    canSwitchProfile: true,
    selectProfile,
    ...overrides,
  };
}

describe("ChatInputLlmProfilePicker", () => {
  beforeEach(() => {
    selectProfile.mockReset();
    useChatInputLlmProfileStateMock.mockReset();
    useChatInputLlmProfileStateMock.mockReturnValue(state());
    listProviderConnectionsMock.mockReset();
    listProviderConnectionsMock.mockResolvedValue([]);
    useFreeModelsStore.setState({
      freeModels: new Set(),
      defaultModel: null,
      defaultModelReady: false,
    });
  });

  it("renders nothing while loading or when there are no profiles", () => {
    useChatInputLlmProfileStateMock.mockReturnValue(
      state({ profiles: [], isLoading: false }),
    );
    const { container } = renderWithProviders(<ChatInputLlmProfilePicker />);
    expect(container).toBeEmptyDOMElement();
  });

  it("labels the pill with the current profile name", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    expect(screen.getByTestId("chat-input-llm-profile")).toHaveTextContent(
      "Fast",
    );
  });

  it("fits the upward menu above its trigger and follows scrolling", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    const trigger = screen.getByTestId("chat-input-llm-profile");
    const rect = vi.spyOn(trigger, "getBoundingClientRect");
    rect.mockReturnValue({ top: 200 } as DOMRect);
    fireEvent.click(trigger);
    const menu = screen.getByTestId("chat-input-llm-profile-popover");
    expect(menu).toHaveStyle({ maxHeight: "184px" });

    rect.mockReturnValue({ top: 100 } as DOMRect);
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(menu).toHaveStyle({ maxHeight: "84px" });
    rect.mockRestore();
  });

  it("labels the pill with the prettified model and keeps the raw id as title", () => {
    useChatInputLlmProfileStateMock.mockReturnValue(
      state({
        profiles: [
          {
            name: "gpt-4o-mini",
            model: "openai/gpt-4o-mini",
            base_url: null,
            api_key_set: true,
          },
        ],
        currentProfileName: "gpt-4o-mini",
        currentProfileModel: "openai/gpt-4o-mini",
      }),
    );
    renderWithProviders(<ChatInputLlmProfilePicker />);

    const pill = screen.getByTestId("chat-input-llm-profile");
    expect(pill).toHaveTextContent("GPT 4o Mini");
    expect(pill).toHaveAttribute("title", "openai/gpt-4o-mini");
  });

  it("lists only connected providers on the left", async () => {
    listProviderConnectionsMock.mockResolvedValue([
      { id: "c1", provider: "mistral", display_name: "m", api_key_set: true },
    ]);
    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));

    expect(screen.getByTestId("chat-input-llm-provider-openai")).toBeVisible();
    expect(
      screen.getByTestId("chat-input-llm-provider-anthropic"),
    ).toBeVisible();
    expect(screen.getByTestId("chat-input-llm-provider-other")).toBeVisible();
    expect(
      screen.queryByTestId("chat-input-llm-provider-xai"),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(listProviderConnectionsMock).toHaveBeenCalled());
  });

  it("shows the selected provider's models in the right column", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));
    expect(
      screen.getByTestId("chat-input-llm-profile-option-Fast"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("chat-input-llm-profile-option-Smart"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("chat-input-llm-provider-anthropic"));

    expect(
      screen.getByTestId("chat-input-llm-profile-option-Smart"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("chat-input-llm-profile-option-Fast"),
    ).not.toBeInTheDocument();
  });

  it("filters the right column as the user types and shows an empty state", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));
    fireEvent.click(screen.getByTestId("chat-input-llm-provider-anthropic"));
    const search = screen.getByTestId("chat-input-llm-model-search");

    fireEvent.change(search, { target: { value: "OPUS-4" } });
    expect(
      screen.getByTestId("chat-input-llm-profile-option-Opus-Two"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("chat-input-llm-profile-option-Smart"),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByTestId("chat-input-llm-model-empty")).toBeVisible();
  });

  it("clears the search on the first Escape and closes on the second", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));
    const search = screen.getByTestId("chat-input-llm-model-search");
    fireEvent.change(search, { target: { value: "gpt" } });

    fireEvent.keyDown(search, { key: "Escape" });
    expect(search).toHaveValue("");
    expect(screen.getByTestId("chat-input-llm-profile-popover")).toBeVisible();

    fireEvent.keyDown(search, { key: "Escape" });
    expect(
      screen.queryByTestId("chat-input-llm-profile-popover"),
    ).not.toBeInTheDocument();
  });

  it("moves with arrow keys, selects with Enter, and keeps focus in the search", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));
    fireEvent.click(screen.getByTestId("chat-input-llm-provider-anthropic"));
    const search = screen.getByTestId("chat-input-llm-model-search");
    expect(search).toHaveFocus();

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Enter" });

    expect(selectProfile).toHaveBeenCalledWith("Opus-Two");
  });

  it("live-switches to the picked profile", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));
    fireEvent.click(screen.getByTestId("chat-input-llm-provider-anthropic"));
    fireEvent.click(screen.getByTestId("chat-input-llm-profile-option-Smart"));

    expect(selectProfile).toHaveBeenCalledWith("Smart");
  });

  it("does not switch when the current profile is re-selected", () => {
    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));
    fireEvent.click(screen.getByTestId("chat-input-llm-profile-option-Fast"));

    expect(selectProfile).not.toHaveBeenCalled();
  });

  it("names the current profile without selectable options when switching is unavailable", () => {
    useChatInputLlmProfileStateMock.mockReturnValue(
      state({ canSwitchProfile: false }),
    );

    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));

    expect(
      screen.getByTestId("chat-input-llm-profile-current"),
    ).toHaveTextContent("Fast");
    expect(
      screen.queryByTestId("chat-input-llm-profile-option-Smart"),
    ).not.toBeInTheDocument();
  });

  it("labels a backend-flagged free OpenHands route in the profile menu", () => {
    useFreeModelsStore.getState().setFlags({
      freeModels: new Set(["openhands/deepseek-v4-flash"]),
      defaultModel: null,
    });
    useChatInputLlmProfileStateMock.mockReturnValue(
      state({
        profiles: [
          {
            name: "Free",
            model: "openhands/deepseek-v4-flash",
            base_url: null,
            api_key_set: true,
          },
        ],
        currentProfileName: "Free",
        currentProfileModel: "openhands/deepseek-v4-flash",
      }),
    );

    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));

    expect(
      screen.getByText("OpenHands DeepSeek V4 Flash (free)"),
    ).toBeInTheDocument();
  });

  it("labels a backend-flagged free OpenHands route in the read-only profile menu", () => {
    useFreeModelsStore.getState().setFlags({
      freeModels: new Set(["openhands/deepseek-v4-flash"]),
      defaultModel: null,
    });
    useChatInputLlmProfileStateMock.mockReturnValue(
      state({
        canSwitchProfile: false,
        currentProfileModel: "openhands/deepseek-v4-flash",
      }),
    );

    renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));

    expect(
      screen.getByTestId("chat-input-llm-profile-current"),
    ).toHaveTextContent("OpenHands DeepSeek V4 Flash (free)");
  });

  it("links to the LLM profiles settings page", () => {
    const { container } = renderWithProviders(<ChatInputLlmProfilePicker />);
    fireEvent.click(screen.getByTestId("chat-input-llm-profile"));

    expect(
      container.ownerDocument.querySelector('a[href="/settings/llm"]'),
    ).not.toBeNull();
  });
});
