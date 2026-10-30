import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CommandMenu } from "#/components/features/command-menu/command-menu";
import * as searchMatchingConversationsModule from "#/api/conversation-service/search-matching-conversations";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ExecutionStatus } from "#/types/agent-server/core";
import { COMMAND_MENU_ROUTE } from "#/components/features/command-menu/command-menu-items";
import { getInterfaceCopy } from "#/manifests/automation-interface";
import {
  NavigationProvider,
  type NavigationContextValue,
} from "#/context/navigation-context";
import { ConversationCardActions } from "#/components/features/conversation-panel/conversation-card/conversation-card-actions";
import { useCommandMenuStore } from "#/stores/command-menu-store";
import { useSidebarStore } from "#/stores/sidebar-store";
import { renderWithProviders } from "../../../../test-utils";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: (namespace?: string) => ({
    t: (key: string) =>
      namespace === "openhands" ? key : `missing-namespace:${key}`,
    i18n: {
      language: "en",
      exists: () => false,
    },
  }),
}));

const SEARCH_LABEL_KEY = "COMMAND_MENU$SEARCH_LABEL";
const CLEAR_SEARCH_LABEL_KEY = "COMMAND_MENU$CLEAR_SEARCH_LABEL";
const NAVIGATION_GROUP_KEY = "COMMAND_MENU$GROUP_NAVIGATION";
const SETTINGS_GROUP_KEY = "COMMAND_MENU$GROUP_SETTINGS";
const ACTIONS_GROUP_KEY = "COMMAND_MENU$GROUP_ACTIONS";
// The automation interface manifest owns the automations command's copy, so
// its title renders as the manifest literal rather than a translation key.
const AUTOMATIONS_TITLE_KEY = getInterfaceCopy().commandMenuTitle;
const NEW_CHAT_TITLE_KEY = "COMMAND_MENU$NEW_CHAT_TITLE";
const SECRETS_TITLE_KEY = "COMMAND_MENU$SECRETS_SETTINGS_TITLE";
const TOGGLE_SIDEBAR_TITLE_KEY = "COMMAND_MENU$TOGGLE_SIDEBAR_TITLE";
const APPLE_SHORTCUT_KEY = "COMMAND_MENU$SHORTCUT";
const CTRL_SHORTCUT_KEY = "COMMAND_MENU$SHORTCUT_CTRL";
const MAC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const LINUX_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const WINDOWS_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const CONVERSATIONS_GROUP_KEY = "COMMAND_MENU$GROUP_CONVERSATIONS";
const SEARCH_NO_RESULTS_KEY = "CONVERSATION_PANEL$SEARCH_NO_RESULTS";
const SEARCH_INPUT_ID = "command-menu-search";
const RESULTS_LISTBOX_ID = "command-menu-results";
const NEW_CHAT_OPTION_ID = "command-menu-option-new-chat";

const navigateMock = vi.fn();

const createMockConversation = (
  overrides: Partial<AppConversation> = {},
): AppConversation => ({
  id: "1",
  title: "Review the project",
  selected_repository: "org/repo",
  git_provider: null,
  selected_branch: "main",
  updated_at: "2026-01-01T00:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
  execution_status: ExecutionStatus.FINISHED,
  conversation_url: null,
  created_by_user_id: "user",
  metrics: null,
  llm_model: null,
  trigger: null,
  pr_number: [],
  session_api_key: null,
  sandbox_id: null,
  sub_conversation_ids: [],
  ...overrides,
});

function renderCommandMenu(navigate = navigateMock) {
  const view = renderWithProviders(<CommandMenu />, {
    navigation: { navigate },
  });

  return { ...view, navigate };
}

function withNavigation(navigate: NavigationContextValue["navigate"]) {
  return (
    <NavigationProvider
      value={{
        currentPath: "/",
        conversationId: null,
        isNavigating: false,
        navigate,
      }}
    >
      <CommandMenu />
    </NavigationProvider>
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  window.localStorage.clear();
  useCommandMenuStore.setState({ isOpen: false });
  useSidebarStore.setState({ collapsed: false });
  vi.restoreAllMocks();
  // Keep command-only tests free of conversation hits unless a case opts in.
  vi.spyOn(
    searchMatchingConversationsModule,
    "searchMatchingConversations",
  ).mockResolvedValue([]);
});

describe("CommandMenu", () => {
  it("opens from the global command-k shortcut and closes with escape", async () => {
    renderCommandMenu();

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    const searchInput = await screen.findByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    await waitFor(() => expect(searchInput).toHaveFocus());
    const dialog = screen.getByTestId("command-menu");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("id", "command-menu");

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
    });
  });

  it("closes with escape while a command option has focus", async () => {
    const user = userEvent.setup();
    renderCommandMenu();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const searchInput = await screen.findByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    await waitFor(() => expect(searchInput).toHaveFocus());

    await user.tab();
    expect(document.activeElement?.id).toBe(NEW_CHAT_OPTION_ID);
    await user.keyboard("{Escape}");

    expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
  });

  it("returns focus to the element that had it before opening", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <textarea data-testid="composer" />
        <CommandMenu />
      </>,
      { navigation: { navigate: navigateMock } },
    );
    const composer = screen.getByTestId("composer");
    composer.focus();

    await user.keyboard("{Control>}k{/Control}");
    const searchInput = await screen.findByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    await waitFor(() => expect(searchInput).toHaveFocus());
    await user.keyboard("{Escape}");

    expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
    expect(composer).toHaveFocus();
  });

  it("closes itself, not a card menu left open underneath, on Escape", async () => {
    const user = userEvent.setup();
    const onContextMenuToggle = vi.fn();
    renderWithProviders(
      <>
        <textarea data-testid="composer" />
        <ConversationCardActions
          contextMenuOpen
          onContextMenuToggle={onContextMenuToggle}
          onDelete={vi.fn()}
        />
        <CommandMenu />
      </>,
      { navigation: { navigate: navigateMock } },
    );
    const composer = screen.getByTestId("composer");
    composer.focus();

    await user.keyboard("{Control>}k{/Control}");
    const searchInput = await screen.findByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    await waitFor(() => expect(searchInput).toHaveFocus());
    await user.keyboard("{Escape}");

    expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
    expect(onContextMenuToggle).not.toHaveBeenCalled();
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
    expect(screen.getByTestId("ellipsis-button")).not.toHaveFocus();
    expect(composer).toHaveFocus();

    // The next Escape reaches the card menu.
    await user.keyboard("{Escape}");
    expect(onContextMenuToggle).toHaveBeenCalledWith(false);
  });

  it("opens from the global ctrl-k shortcut", async () => {
    renderCommandMenu();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const searchInput = await screen.findByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    await waitFor(() => expect(searchInput).toHaveFocus());
  });

  it("ignores unmodified and unrelated global shortcuts", () => {
    renderCommandMenu();

    fireEvent.keyDown(window, { key: "k" });
    fireEvent.keyDown(window, { key: "x", metaKey: true });

    expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
    expect(useCommandMenuStore.getState().isOpen).toBe(false);
  });

  it("removes the global shortcut listener when unmounted", () => {
    const { unmount } = renderCommandMenu();
    unmount();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(useCommandMenuStore.getState().isOpen).toBe(false);
  });

  it("cancels deferred focus and safely ignores it after unmount", () => {
    let focusCallback: FrameRequestCallback | undefined;
    const requestFrame = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        focusCallback = callback;
        return 42;
      });
    const cancelFrame = vi
      .spyOn(globalThis, "cancelAnimationFrame")
      .mockImplementation(() => undefined);
    useCommandMenuStore.getState().open();

    const { unmount } = renderCommandMenu();
    expect(requestFrame).toHaveBeenCalledOnce();
    unmount();

    expect(cancelFrame).toHaveBeenCalledWith(42);
    expect(focusCallback).toBeDefined();
    expect(() => focusCallback?.(0)).not.toThrow();

    requestFrame.mockRestore();
    cancelFrame.mockRestore();
  });

  it("filters commands by page and setting keywords", async () => {
    useCommandMenuStore.getState().open();
    renderCommandMenu();

    await userEvent.type(
      screen.getByRole("combobox", { name: SEARCH_LABEL_KEY }),
      "secrets",
    );

    expect(screen.getByText(SECRETS_TITLE_KEY)).toBeInTheDocument();
    expect(screen.queryByText(NEW_CHAT_TITLE_KEY)).not.toBeInTheDocument();
    expect(screen.getByText(SETTINGS_GROUP_KEY)).toBeInTheDocument();
    expect(screen.queryByText(NAVIGATION_GROUP_KEY)).not.toBeInTheDocument();
    expect(screen.queryByText(ACTIONS_GROUP_KEY)).not.toBeInTheDocument();
  });

  it("keeps translated search fields separated", async () => {
    useCommandMenuStore.getState().open();
    renderCommandMenu();

    await userEvent.type(
      screen.getByRole("combobox", { name: SEARCH_LABEL_KEY }),
      "titlecommand",
    );

    expect(await screen.findByText(SEARCH_NO_RESULTS_KEY)).toBeInTheDocument();
  });

  it("navigates to the selected command and closes the menu", async () => {
    useCommandMenuStore.getState().open();
    const { navigate } = renderCommandMenu();

    await userEvent.click(screen.getByText(AUTOMATIONS_TITLE_KEY));

    expect(navigate).toHaveBeenCalledWith(COMMAND_MENU_ROUTE.automations);
    await waitFor(() => {
      expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
    });
  });

  it.each([
    ["meta_llm", COMMAND_MENU_ROUTE.metaLlmSettings],
    ["agent_context", COMMAND_MENU_ROUTE.agentContextSettings],
  ])(
    "finds the %s settings page and opens it",
    async (searchTerm, expectedRoute) => {
      useCommandMenuStore.getState().open();
      const { navigate } = renderCommandMenu();

      await userEvent.type(
        screen.getByRole("combobox", { name: SEARCH_LABEL_KEY }),
        searchTerm,
      );
      await userEvent.keyboard("{Enter}");

      expect(navigate).toHaveBeenCalledWith(expectedRoute);
      await waitFor(() => {
        expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
      });
    },
  );

  it("supports arrow-key navigation and enter selection", async () => {
    useCommandMenuStore.getState().open();
    const { navigate } = renderCommandMenu();
    const searchInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });

    await userEvent.type(searchInput, "settings");
    await userEvent.keyboard("{ArrowDown}{ArrowUp}{Enter}");

    expect(navigate).toHaveBeenCalledWith(COMMAND_MENU_ROUTE.settings);
    await waitFor(() => {
      expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
    });
  });

  it("wraps arrow-up navigation from the first to the last command", async () => {
    useCommandMenuStore.getState().open();
    renderCommandMenu();
    const searchInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    const options = screen.getAllByRole("option");

    await userEvent.type(searchInput, "{arrowup}");

    expect(options.at(-1)).toHaveAttribute("aria-selected", "true");
    expect(searchInput).toHaveAttribute(
      "aria-activedescendant",
      options.at(-1)?.id,
    );
  });

  it("runs local actions from the menu", async () => {
    useCommandMenuStore.getState().open();
    renderCommandMenu();

    await userEvent.type(
      screen.getByRole("combobox", { name: SEARCH_LABEL_KEY }),
      "toggle",
    );
    await userEvent.click(screen.getByText(TOGGLE_SIDEBAR_TITLE_KEY));

    expect(useSidebarStore.getState().collapsed).toBe(true);
  });

  it("shows an empty state and ignores selection keys when nothing matches", async () => {
    const user = userEvent.setup();
    useCommandMenuStore.getState().open();
    const { navigate } = renderCommandMenu();
    const searchInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });

    await user.type(searchInput, "no matching command");

    expect(await screen.findByText(SEARCH_NO_RESULTS_KEY)).toBeInTheDocument();
    expect(searchInput).not.toHaveAttribute("aria-activedescendant");

    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("command-menu")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: CLEAR_SEARCH_LABEL_KEY }),
    );

    const firstOption = screen.getAllByRole("option")[0];
    expect(firstOption).toHaveAttribute("aria-selected", "true");
    expect(searchInput).toHaveAttribute(
      "aria-activedescendant",
      NEW_CHAT_OPTION_ID,
    );
  });

  it("scrolls the newly active option into view", () => {
    useCommandMenuStore.getState().open();
    renderCommandMenu();
    const searchInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    const options = screen.getAllByRole("option");
    const nextOption = options[1];
    const scrollIntoView = vi.fn();
    Object.defineProperty(nextOption, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    expect(searchInput).toHaveAttribute("id", SEARCH_INPUT_ID);
    expect(searchInput).toHaveAttribute("aria-controls", RESULTS_LISTBOX_ID);
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "id",
      RESULTS_LISTBOX_ID,
    );
    expect(options[0]).toHaveAttribute("id", NEW_CHAT_OPTION_ID);
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(nextOption).toHaveAttribute("aria-selected", "true");
    expect(searchInput).toHaveAttribute("aria-activedescendant", nextOption.id);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("preserves and clamps pointer selection when filtering", async () => {
    const user = userEvent.setup();
    useCommandMenuStore.getState().open();
    renderCommandMenu();
    const searchInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    const allOptions = screen.getAllByRole("option");

    await user.hover(allOptions[1]);
    expect(allOptions[1]).toHaveAttribute("aria-selected", "true");
    await user.hover(allOptions.at(-1) as HTMLElement);
    expect(allOptions.at(-1)).toHaveAttribute("aria-selected", "true");

    await user.type(searchInput, "settings");

    const filteredOptions = screen.getAllByRole("option");
    expect(filteredOptions.length).toBeLessThan(allOptions.length);
    expect(filteredOptions.at(-1)).toHaveAttribute("aria-selected", "true");
    expect(searchInput).toHaveAttribute(
      "aria-activedescendant",
      filteredOptions.at(-1)?.id,
    );
  });

  it("clears the search and restores the full command list", async () => {
    const user = userEvent.setup();
    useCommandMenuStore.getState().open();
    renderCommandMenu();
    const searchInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });

    await user.type(searchInput, "secrets");
    expect(screen.queryByText(NEW_CHAT_TITLE_KEY)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: CLEAR_SEARCH_LABEL_KEY }),
    );

    expect(searchInput).toHaveValue("");
    expect(searchInput).toHaveFocus();
    expect(screen.getByText(NEW_CHAT_TITLE_KEY)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: CLEAR_SEARCH_LABEL_KEY }),
    ).not.toBeInTheDocument();
  });

  it("resets search and selection after closing and reopening", async () => {
    const user = userEvent.setup();
    useCommandMenuStore.getState().open();
    renderCommandMenu();
    const searchInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });

    await user.type(searchInput, "secrets");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument(),
    );

    act(() => useCommandMenuStore.getState().open());

    const reopenedInput = screen.getByRole("combobox", {
      name: SEARCH_LABEL_KEY,
    });
    expect(reopenedInput).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(13);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("uses the latest navigation context when a command runs", async () => {
    const firstNavigate = vi.fn();
    const latestNavigate = vi.fn();
    useCommandMenuStore.getState().open();
    const { rerender } = renderWithProviders(withNavigation(firstNavigate));

    rerender(withNavigation(latestNavigate));
    await userEvent.click(screen.getByText(AUTOMATIONS_TITLE_KEY));

    expect(firstNavigate).not.toHaveBeenCalled();
    expect(latestNavigate).toHaveBeenCalledWith(COMMAND_MENU_ROUTE.automations);
  });

  it("renders navigation commands as links and local actions as buttons", () => {
    useCommandMenuStore.getState().open();
    renderCommandMenu();

    expect(screen.getByText(NEW_CHAT_TITLE_KEY).closest("a")).toHaveAttribute(
      "href",
      COMMAND_MENU_ROUTE.conversations,
    );
    expect(
      screen.getByText(TOGGLE_SIDEBAR_TITLE_KEY).closest("button"),
    ).toHaveAttribute("type", "button");
  });

  it("applies the command palette and active-option presentation", () => {
    useCommandMenuStore.getState().open();
    renderCommandMenu();

    const dialog = screen.getByRole("dialog");
    const surface = dialog.children[1] as HTMLElement;
    const [activeOption, inactiveOption] = screen.getAllByRole("option");
    const activeIcon = activeOption.querySelector('[aria-hidden="true"]');
    const inactiveIcon = inactiveOption.querySelector('[aria-hidden="true"]');

    expect(surface).toHaveClass(
      "max-w-2xl",
      "border-border",
      "shadow-[0_24px_90px_rgba(0,0,0,0.52),0_0_0_1px_rgba(255,255,255,0.03)_inset]",
    );
    expect(activeOption).toHaveClass("rounded-xl", "bg-contrast/[0.09]");
    expect(inactiveOption).toHaveClass("rounded-xl", "text-muted");
    expect(activeIcon).toHaveClass("size-9", "border-accent");
    expect(inactiveIcon).toHaveClass("size-9", "border-border");
  });

  it("leaves modified command links to native browser behavior", () => {
    useCommandMenuStore.getState().open();
    const { navigate } = renderCommandMenu();
    const commandLink = screen.getByText(NEW_CHAT_TITLE_KEY).closest("a");
    expect(commandLink).not.toBeNull();
    commandLink?.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });

    fireEvent.click(commandLink as HTMLAnchorElement, { metaKey: true });

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("command-menu")).toBeInTheDocument();
  });

  it("does not render the browser portal when open during server rendering", async () => {
    const serverStoreState = {
      isOpen: true,
      open: () => undefined,
      close: () => undefined,
      toggle: () => undefined,
    };
    vi.resetModules();
    vi.doMock("#/stores/command-menu-store", () => ({
      useCommandMenuStore: (
        selector: (state: typeof serverStoreState) => unknown,
      ) => selector(serverStoreState),
    }));
    const { CommandMenu: ServerCommandMenu } =
      await import("#/components/features/command-menu/command-menu");
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: undefined,
    });

    try {
      expect(
        renderToStaticMarkup(
          <QueryClientProvider client={new QueryClient()}>
            <ServerCommandMenu />
          </QueryClientProvider>,
        ),
      ).toBe("");
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument,
      });
      vi.doUnmock("#/stores/command-menu-store");
      vi.resetModules();
    }
  });

  it("shows matching conversations and opens the selected conversation", async () => {
    const conversations = [
      createMockConversation({ id: "1", title: "Alpha task" }),
      createMockConversation({ id: "99", title: "Enable Figma design export" }),
    ];
    vi.spyOn(
      searchMatchingConversationsModule,
      "searchMatchingConversations",
    ).mockImplementation(async (query) => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) {
        return conversations;
      }
      return conversations.filter((conversation) =>
        conversation.title?.toLowerCase().includes(trimmed),
      );
    });

    useCommandMenuStore.getState().open();
    const { navigate } = renderCommandMenu();

    await userEvent.type(
      screen.getByRole("combobox", { name: SEARCH_LABEL_KEY }),
      "figma",
    );

    const section = await screen.findByTestId(
      "command-menu-conversations-section",
      {},
      { timeout: 2000 },
    );
    expect(
      within(section).getByText(CONVERSATIONS_GROUP_KEY),
    ).toBeInTheDocument();

    const result = await within(section).findByTestId(
      "command-menu-conversation-result",
    );
    expect(result).toHaveAttribute("data-conversation-id", "99");

    await userEvent.click(result);

    expect(navigate).toHaveBeenCalledWith("/conversations/99");
    await waitFor(() => {
      expect(screen.queryByTestId("command-menu")).not.toBeInTheDocument();
    });
  });

  it("surfaces a truncated-results hint when more than eight conversations match", async () => {
    const conversations = Array.from({ length: 12 }, (_, index) =>
      createMockConversation({
        id: String(index + 1),
        title: `Figma match ${index + 1}`,
      }),
    );
    vi.spyOn(
      searchMatchingConversationsModule,
      "searchMatchingConversations",
    ).mockResolvedValue(conversations);

    useCommandMenuStore.getState().open();
    renderCommandMenu();

    await userEvent.type(
      screen.getByRole("combobox", { name: SEARCH_LABEL_KEY }),
      "figma",
    );

    const section = await screen.findByTestId(
      "command-menu-conversations-section",
      {},
      { timeout: 2000 },
    );
    expect(
      within(section).getByTestId("command-menu-conversations-truncated-hint"),
    ).toHaveTextContent("COMMAND_MENU$SHOWING_FIRST_N");
    expect(
      within(section).getAllByTestId("command-menu-conversation-result"),
    ).toHaveLength(8);
  });

  it("shows a no-results state when conversation search finds nothing", async () => {
    vi.spyOn(
      searchMatchingConversationsModule,
      "searchMatchingConversations",
    ).mockResolvedValue([]);

    useCommandMenuStore.getState().open();
    renderCommandMenu();

    await userEvent.type(
      screen.getByRole("combobox", { name: SEARCH_LABEL_KEY }),
      "zzzz-not-found",
    );

    expect(
      await screen.findByText(SEARCH_NO_RESULTS_KEY, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("command-menu-conversation-result"),
    ).not.toBeInTheDocument();
  });
});

describe("the command menu shortcut hint", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["macOS", MAC_USER_AGENT, APPLE_SHORTCUT_KEY],
    ["iOS", IPHONE_USER_AGENT, APPLE_SHORTCUT_KEY],
    ["Linux", LINUX_USER_AGENT, CTRL_SHORTCUT_KEY],
    ["Windows", WINDOWS_USER_AGENT, CTRL_SHORTCUT_KEY],
  ])(
    "on %s reads in the menu header",
    (_platform, userAgent, expectedShortcutKey) => {
      // Arrange
      vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(userAgent);
      useCommandMenuStore.getState().open();

      // Act
      renderWithProviders(<CommandMenu />);

      // Assert
      expect(
        within(screen.getByTestId("command-menu")).getByText(
          expectedShortcutKey,
        ),
      ).toBeInTheDocument();
    },
  );
});
