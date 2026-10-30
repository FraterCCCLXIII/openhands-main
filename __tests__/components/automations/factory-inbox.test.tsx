import React, { type ReactNode } from "react";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FactoryPage } from "#/components/features/automations/factory/factory-page";
import { Feed } from "#/components/features/feed/feed";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import EventService from "#/api/event-service/event-service.api";
import { NavigationProvider } from "#/context/navigation-context";
import {
  useFactoryInboxStore,
  type FactoryInboxItem,
} from "#/stores/factory-inbox-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { ALL_FEED_FILTER } from "#/utils/feed-filters";
import { renderWithProviders } from "../../../test-utils";

const { launchConversation } = vi.hoisted(() => ({
  launchConversation: vi.fn(),
}));

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
    i18n: { language: "en", exists: () => false },
  }),
}));
vi.mock("#/hooks/mutation/resolve-conversation-launch", () => ({
  launchConversation,
}));
vi.mock("#/hooks/use-feed-conversations", () => ({
  useFeedConversations: () => ({ conversations: [], isLoading: false }),
}));
vi.mock("#/hooks/query/use-agent-profiles", () => ({
  useAgentProfiles: () => ({ data: { profiles: [] } }),
}));
// The real composer needs the whole chat provider tree; a stub with the same
// contract (submit callback, placeholder, toolbar slot) is enough here.
vi.mock("#/components/features/chat/custom-chat-input", () => ({
  CustomChatInput: ({
    onSubmit,
    placeholder,
  }: {
    onSubmit: (message: string) => void;
    placeholder?: string;
  }) => {
    const [value, setValue] = React.useState("");
    return (
      <div>
        <textarea
          data-testid="factory-composer-input"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="button"
          data-testid="factory-composer-send"
          onClick={() => {
            onSubmit(value);
            setValue("");
          }}
        />
      </div>
    );
  },
}));

const entry = (
  id: string,
  factoryId: string,
  text: string,
  createdAt: string,
): FactoryInboxItem => ({
  id,
  factoryId,
  text,
  targetLabel: "Factory inbox",
  kind: "new",
  agentName: "OpenHands",
  conversationId: `conv-${id}`,
  conversationTitle: null,
  reasons: [],
  status: "sent",
  createdAt,
});

function RouterNavigation({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <NavigationProvider
      value={{
        currentPath: pathname,
        conversationId: null,
        isNavigating: false,
        navigate: (to, options) => navigate(to, options),
      }}
    >
      {children}
    </NavigationProvider>
  );
}

const renderIncoming = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={["/automations/factories/web/incoming"]}>
      <RouterNavigation>
        <Routes>
          <Route
            path="/automations/factories/:factoryId/:section?"
            element={<FactoryPage />}
          />
        </Routes>
      </RouterNavigation>
    </MemoryRouter>,
  );

const renderTowerInbox = (factory: string) =>
  renderWithProviders(
    <MemoryRouter initialEntries={[`/feed?view=inbox&factory=${factory}`]}>
      <RouterNavigation>
        <Feed />
      </RouterNavigation>
    </MemoryRouter>,
  );

const texts = () =>
  within(screen.getByTestId("factory-section-incoming"))
    .getAllByTestId("feed-inbox-item")
    .map((row) => row.querySelector("p")?.textContent);

describe("factory page Incoming tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useFeedFactoriesStore.setState({
      custom: [
        { id: "web", name: "Web", description: "", ownerId: "me" },
        { id: "ops", name: "Ops", description: "", ownerId: "me" },
      ],
    });
    useFeedFilterStore.setState({ filter: ALL_FEED_FILTER });
    useFactoryInboxStore.setState({
      items: [
        entry("a", "web", "web older", "2026-01-01T00:00:00.000Z"),
        entry("b", "ops", "ops only", "2026-01-02T00:00:00.000Z"),
        entry("c", "web", "web newer", "2026-01-03T00:00:00.000Z"),
      ],
      lastSeenAt: null,
      seenByFactory: {},
    });
    vi.spyOn(
      AgentServerConversationService,
      "searchConversations",
    ).mockResolvedValue({ items: [], next_page_id: null } as never);
    vi.spyOn(EventService, "searchEvents").mockResolvedValue({
      items: [],
      next_page_id: null,
    } as never);
  });

  it("shows this factory's inbox entries and the inbox composer", async () => {
    renderIncoming();

    await screen.findAllByTestId("feed-inbox-item");
    expect(texts()).toEqual(["web newer", "web older"]);
    expect(screen.getByTestId("factory-composer-input")).toHaveAttribute(
      "placeholder",
      expect.stringContaining("FACTORY$INBOX"),
    );
  });

  it("shows a request at once, in the Tower factory inbox too, and keeps it after a reload", async () => {
    let finish: (value: unknown) => void = () => {};
    launchConversation.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderIncoming();
    await screen.findAllByTestId("feed-inbox-item");

    await userEvent.type(
      screen.getByTestId("factory-composer-input"),
      "ship the release",
    );
    await userEvent.click(screen.getByTestId("factory-composer-send"));

    // Optimistic: listed while the conversation is still being created.
    await waitFor(() => expect(texts()[0]).toBe("ship the release"));
    const row = within(
      screen.getByTestId("factory-section-incoming"),
    ).getAllByTestId("feed-inbox-item")[0];
    expect(within(row).getByTestId("feed-inbox-item-status")).toHaveTextContent(
      "FEED$INBOX_STARTING",
    );

    // The same factory inbox, seen from Tower.
    renderTowerInbox("web");
    await waitFor(() =>
      expect(
        screen
          .getAllByTestId("feed-inbox-item")
          .map((r) => r.querySelector("p")?.textContent),
      ).toContain("ship the release"),
    );

    await act(async () => {
      finish({
        id: "t1",
        app_conversation_id: "conv-new",
        agent_server_url: null,
      });
    });
    await waitFor(() =>
      expect(
        useFactoryInboxStore
          .getState()
          .items.find((item) => item.text === "ship the release"),
      ).toMatchObject({ status: "sent", conversationId: "conv-new" }),
    );

    const saved = localStorage.getItem("factory-inbox") as string;
    useFactoryInboxStore.setState({ items: [] });
    localStorage.setItem("factory-inbox", saved);
    await act(async () => {
      await useFactoryInboxStore.persist.rehydrate();
    });
    expect(
      useFactoryInboxStore.getState().items.map((item) => item.text),
    ).toContain("ship the release");
  });

  it("turns a request that was still sending when the page closed into a failed one", async () => {
    localStorage.setItem(
      "factory-inbox",
      JSON.stringify({
        state: {
          items: [
            {
              ...entry(
                "s",
                "web",
                "never finished",
                "2026-01-04T00:00:00.000Z",
              ),
              status: "sending",
            },
          ],
          lastSeenAt: null,
          seenByFactory: {},
        },
        version: 2,
      }),
    );
    await act(async () => {
      await useFactoryInboxStore.persist.rehydrate();
    });

    expect(useFactoryInboxStore.getState().items[0].status).toBe("failed");
  });
});
