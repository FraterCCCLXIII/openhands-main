import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavigationProvider } from "#/context/navigation-context";
import { Feed } from "#/components/features/feed/feed";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import EventService from "#/api/event-service/event-service.api";
import {
  useFactoryInboxStore,
  type FactoryInboxItem,
} from "#/stores/factory-inbox-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { useFeedSectionsStore } from "#/stores/feed-sections-store";
import { ALL_FEED_FILTER } from "#/utils/feed-filters";
import { renderWithProviders } from "../../../../test-utils";

// The global mock drops interpolation; keep the values so agent names show.
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
    i18n: { language: "en", exists: () => false },
  }),
}));

vi.mock(
  "#/api/agent-profiles-service/agent-profiles-service.api",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("#/api/agent-profiles-service/agent-profiles-service.api")
      >();
    return {
      ...actual,
      default: {
        ...actual.default,
        listProfiles: vi
          .fn()
          .mockResolvedValue({ profiles: [], active_agent_profile_id: null }),
      },
    };
  },
);

const OLD = "2026-01-01T00:00:00.000Z";
const MID = "2026-01-02T00:00:00.000Z";
const NEW = "2026-01-03T00:00:00.000Z";
const SEEN_BEFORE_ALL = "2026-01-01T12:00:00.000Z";

const item = (
  id: string,
  factoryId: string,
  text: string,
  createdAt: string,
  extra: Partial<FactoryInboxItem> = {},
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
  ...extra,
});

const factory = (id: string, name: string) => ({
  id,
  name,
  description: "",
  ownerId: "me",
});

// Links navigate through the app's navigation context; point it at the router.
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

const renderTower = (path = "/feed?view=inbox") =>
  renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <RouterNavigation>
        <Feed />
      </RouterNavigation>
    </MemoryRouter>,
  );

const rowTexts = () =>
  screen
    .getAllByTestId("feed-inbox-item")
    .map((row) => row.querySelector("p")?.textContent);

describe("Tower inbox view", () => {
  beforeEach(() => {
    localStorage.clear();
    useFeedFactoriesStore.setState({
      custom: [factory("design", "Design Factory"), factory("ops", "Ops")],
    });
    useFeedFilterStore.setState({ filter: ALL_FEED_FILTER });
    useFeedSectionsStore.setState({ collapsed: {} });
    useFactoryInboxStore.setState({
      items: [
        item("a", "design", "design one", OLD),
        item("b", "ops", "ops one", MID, { agentName: "Conductor Bo" }),
        item("c", "design", "design two", NEW, { status: "failed" }),
      ],
      lastSeenAt: SEEN_BEFORE_ALL,
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

  it("offers Tower, Notifications and Inbox as tabs, with Inbox selected", async () => {
    renderTower();
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual([
      "false",
      "false",
      "true",
    ]);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("lists every factory's entries newest first, each with its factory, agent and an Open link", async () => {
    renderTower();

    await screen.findAllByTestId("feed-inbox-item");
    expect(rowTexts()).toEqual(["design two", "ops one", "design one"]);
    const ops = screen.getAllByTestId("feed-inbox-item")[1];
    expect(
      within(ops).getByTestId("feed-inbox-item-factory"),
    ).toHaveTextContent("Ops");
    expect(within(ops).getByTestId("feed-inbox-item-agent")).toHaveTextContent(
      "Conductor Bo",
    );
    expect(within(ops).getByTestId("feed-inbox-item-open")).toHaveAttribute(
      "href",
      expect.stringContaining("/feed?conversation=conv-b"),
    );
  });

  it("scopes to one factory from its row, and back to all from All factories", async () => {
    renderTower();
    await screen.findAllByTestId("feed-inbox-item");

    await userEvent.click(screen.getAllByTestId("feed-inbox-factory")[1]);
    await waitFor(() => expect(rowTexts()).toEqual(["ops one"]));
    expect(screen.getAllByTestId("feed-inbox-factory")[1]).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("feed-inbox-all")).not.toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(screen.getByTestId("feed-inbox-all"));
    await waitFor(() => expect(rowTexts()).toHaveLength(3));
    expect(screen.getByTestId("feed-inbox-all")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens scoped from the URL, and follows the factory picked in the Factories list", async () => {
    renderTower("/feed?view=inbox&factory=design");
    await waitFor(() =>
      expect(rowTexts()).toEqual(["design two", "design one"]),
    );

    await userEvent.click(screen.getAllByTestId("feed-filter-factory")[1]);
    await waitFor(() => expect(rowTexts()).toEqual(["ops one"]));
    expect(screen.getAllByTestId("feed-inbox-factory")[1]).toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(screen.getByTestId("feed-filter-factory-all"));
    await waitFor(() => expect(rowTexts()).toHaveLength(3));
  });

  it("counts unseen entries per factory and in total, and clears only what is marked", async () => {
    renderTower();
    await screen.findAllByTestId("feed-inbox-item");

    // Seen at 01-01 12:00: the 01-02 and 01-03 requests are unseen.
    expect(
      within(screen.getByTestId("feed-inbox-all")).getByTestId(
        "feed-inbox-row-badge",
      ),
    ).toHaveTextContent("1");
    const rows = screen.getAllByTestId("feed-inbox-factory");
    expect(
      within(rows[1]).getByTestId("feed-inbox-row-badge"),
    ).toHaveTextContent("1");
    // The newer design entry failed, so only Ops has something unseen.
    expect(
      within(rows[0]).queryByTestId("feed-inbox-row-badge"),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("feed-inbox-mark-seen"));
    await waitFor(() =>
      expect(screen.queryAllByTestId("feed-inbox-row-badge")).toHaveLength(0),
    );
    expect(useFactoryInboxStore.getState().lastSeenAt! > NEW).toBe(true);
  });

  it("marking one factory's inbox as seen leaves the others unseen", async () => {
    useFactoryInboxStore.setState({
      items: [
        item("a", "design", "design one", NEW),
        item("b", "ops", "ops one", NEW),
      ],
    });
    renderTower("/feed?view=inbox&factory=ops");
    await waitFor(() => expect(rowTexts()).toEqual(["ops one"]));

    await userEvent.click(screen.getByTestId("feed-inbox-mark-seen"));

    const rows = screen.getAllByTestId("feed-inbox-factory");
    await waitFor(() =>
      expect(
        within(rows[1]).queryByTestId("feed-inbox-row-badge"),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(rows[0]).getByTestId("feed-inbox-row-badge"),
    ).toHaveTextContent("1");
    expect(
      within(screen.getByTestId("feed-inbox-all")).getByTestId(
        "feed-inbox-row-badge",
      ),
    ).toHaveTextContent("1");
  });

  it("filters by Unseen and Failed, and searches text, agent and factory", async () => {
    renderTower();
    await screen.findAllByTestId("feed-inbox-item");

    await userEvent.click(screen.getByTestId("feed-inbox-filter-unseen"));
    expect(rowTexts()).toEqual(["ops one"]);

    await userEvent.click(screen.getByTestId("feed-inbox-filter-failed"));
    expect(rowTexts()).toEqual(["design two"]);

    await userEvent.click(screen.getByTestId("feed-inbox-filter-all"));
    await userEvent.type(screen.getByTestId("feed-inbox-search"), "conductor");
    expect(rowTexts()).toEqual(["ops one"]);

    await userEvent.clear(screen.getByTestId("feed-inbox-search"));
    await userEvent.type(screen.getByTestId("feed-inbox-search"), "design");
    expect(rowTexts()).toEqual(["design two", "design one"]);

    await userEvent.type(screen.getByTestId("feed-inbox-search"), " zzz");
    expect(screen.getByTestId("feed-inbox-no-matches")).toBeInTheDocument();
  });

  it("shows the empty state when nothing was sent", async () => {
    useFactoryInboxStore.setState({ items: [] });
    renderTower();
    expect(await screen.findByTestId("feed-inbox-empty")).toHaveTextContent(
      "FEED$INBOX_EMPTY",
    );
  });

  it("shows Starting… for a Cloud task id and offers no Open yet", async () => {
    useFactoryInboxStore.setState({
      items: [
        item("a", "design", "cloud one", OLD, { conversationId: "task-abc" }),
      ],
    });
    vi.spyOn(AgentServerConversationService, "getStartTask").mockResolvedValue({
      status: "WORKING",
    } as never);
    renderTower();
    const row = await screen.findByTestId("feed-inbox-item");
    expect(within(row).getByTestId("feed-inbox-item-status")).toHaveTextContent(
      "FEED$INBOX_STARTING",
    );
    expect(
      within(row).queryByTestId("feed-inbox-item-open"),
    ).not.toBeInTheDocument();
  });
});
