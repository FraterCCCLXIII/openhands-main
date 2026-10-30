import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedFilterSidebar } from "#/components/features/feed/feed-filter-sidebar";
import { Feed } from "#/components/features/feed/feed";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import EventService from "#/api/event-service/event-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedPendingStore } from "#/stores/feed-pending-store";
import { useFeedSectionsStore } from "#/stores/feed-sections-store";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { ALL_FEED_FILTER } from "#/utils/feed-filters";
import { renderWithProviders } from "../../../../test-utils";

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

const item = (
  id: string,
  factoryId: string,
  text: string,
  createdAt: string,
  extra: Partial<
    ReturnType<typeof useFactoryInboxStore.getState>["items"][number]
  > = {},
) => ({
  id,
  factoryId,
  text,
  targetLabel: "Factory inbox",
  kind: "new" as const,
  agentName: "OpenHands",
  conversationId: `conv-${id}`,
  conversationTitle: null,
  reasons: [],
  status: "sent" as const,
  createdAt,
  ...extra,
});

const factory = (id: string, name: string) => ({
  id,
  name,
  description: "",
  ownerId: "me",
});

const renderSidebar = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={["/feed"]}>
      <FeedFilterSidebar
        conversations={[]}
        filter={ALL_FEED_FILTER}
        onChange={vi.fn()}
      />
    </MemoryRouter>,
  );

describe("Tower inbox", () => {
  beforeEach(() => {
    localStorage.clear();
    useFeedFactoriesStore.setState({
      custom: [factory("design", "Design Factory"), factory("ops", "Ops")],
    });
    useFactoryInboxStore.setState({ items: [], lastSeenAt: null });
    useFeedSectionsStore.setState({ collapsed: {} });
  });

  it("lists sent requests newest first with factory, agent and an Open link", async () => {
    useFactoryInboxStore.setState({
      items: [
        item("a", "design", "older request", "2026-01-01T00:00:00.000Z"),
        item("b", "ops", "newer request", "2026-01-02T00:00:00.000Z", {
          agentName: "Conductor Bo",
        }),
      ],
      lastSeenAt: "2026-02-01T00:00:00.000Z",
    });
    renderSidebar();

    const rows = await screen.findAllByTestId("feed-inbox-item");
    expect(rows[0]).toHaveTextContent("newer request");
    expect(rows[1]).toHaveTextContent("older request");
    expect(
      within(rows[0]).getByTestId("feed-inbox-item-factory"),
    ).toHaveTextContent("Ops");
    expect(within(rows[0]).getByTestId("feed-inbox-item-open")).toHaveAttribute(
      "href",
      expect.stringContaining("/feed?conversation=conv-b"),
    );
  });

  it("badges unseen requests and clears the badge once the inbox is viewed", async () => {
    useFactoryInboxStore.setState({
      items: [item("a", "design", "hello", new Date().toISOString())],
      lastSeenAt: "2020-01-01T00:00:00.000Z",
    });
    // Collapsed: not viewed, so the badge stays.
    useFeedSectionsStore.setState({ collapsed: { inbox: true } });
    renderSidebar();
    expect(await screen.findByTestId("feed-inbox-badge")).toHaveTextContent(
      "1",
    );

    await userEvent.click(screen.getByTestId("feed-section-toggle-inbox"));
    await waitFor(() =>
      expect(screen.queryByTestId("feed-inbox-badge")).not.toBeInTheDocument(),
    );
  });

  it("shows the empty state, and filters by the chosen factory", async () => {
    renderSidebar();
    expect(await screen.findByTestId("feed-inbox-empty")).toHaveTextContent(
      "FEED$INBOX_EMPTY",
    );

    act(() => {
      useFactoryInboxStore.setState({
        items: [
          item("a", "design", "design one", "2026-01-01T00:00:00.000Z"),
          item("b", "ops", "ops one", "2026-01-02T00:00:00.000Z"),
        ],
      });
    });
    const onChange = vi.fn();
    renderWithProviders(
      <MemoryRouter>
        <FeedFilterSidebar
          conversations={[]}
          filter={{ ...ALL_FEED_FILTER, factoryId: "design" }}
          onChange={onChange}
        />
      </MemoryRouter>,
    );
    const inboxes = screen.getAllByTestId("feed-inbox");
    const filtered = within(inboxes[inboxes.length - 1]);
    expect(filtered.getAllByTestId("feed-inbox-item")).toHaveLength(1);
    expect(filtered.getByText("design one")).toBeInTheDocument();
    expect(filtered.queryByText("ops one")).not.toBeInTheDocument();
  });

  it("shows Starting… for a Cloud task id and offers no Open yet", async () => {
    useFactoryInboxStore.setState({
      items: [
        item("a", "design", "cloud one", "2026-01-01T00:00:00.000Z", {
          conversationId: "task-abc",
        }),
      ],
      lastSeenAt: "2027-01-01T00:00:00.000Z",
    });
    vi.spyOn(AgentServerConversationService, "getStartTask").mockResolvedValue({
      status: "WORKING",
    } as never);
    renderSidebar();
    const row = await screen.findByTestId("feed-inbox-item");
    expect(within(row).getByTestId("feed-inbox-item-status")).toHaveTextContent(
      "FEED$INBOX_STARTING",
    );
    expect(
      within(row).queryByTestId("feed-inbox-item-open"),
    ).not.toBeInTheDocument();
  });
});

describe("Tower sections", () => {
  beforeEach(() => {
    localStorage.clear();
    useFeedSectionsStore.setState({ collapsed: {} });
  });

  it("toggles a section with aria-expanded and remembers it", async () => {
    renderSidebar();
    const toggle = await screen.findByTestId("feed-section-toggle-factories");
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const content = document.getElementById(
      toggle.getAttribute("aria-controls") as string,
    );
    expect(content).toHaveClass("hidden");
    expect(
      JSON.parse(localStorage.getItem("feed-left-sections") as string).state
        .collapsed.factories,
    ).toBe(true);
  });

  it("offers the four add actions on every plus, the section's own first", async () => {
    renderSidebar();
    await userEvent.click(await screen.findByTestId("feed-add-agent"));
    const items = within(screen.getByTestId("feed-add-menu")).getAllByRole(
      "menuitem",
    );
    expect(items.map((i) => i.textContent)).toEqual([
      "FEED$ADD_AGENT",
      "FEED$ADD_FACTORY",
      "FEED$ADD_CONVERSATION",
      "FEED$ADD_PROJECT",
    ]);
    expect(items[0]).toHaveAttribute("data-primary", "true");
  });

  it("creates a factory from the plus and selects it", async () => {
    renderSidebar();
    await userEvent.click(await screen.findByTestId("feed-add-factory"));
    await userEvent.click(screen.getByTestId("feed-add-factory-item"));
    const name = await screen.findByTestId("add-factory-name");
    await userEvent.type(name, "Fresh");
    await userEvent.click(screen.getByTestId("add-factory-create"));
    await waitFor(() =>
      expect(useFeedFilterStore.getState().filter.factoryId).toMatch(
        /^custom-fresh-/,
      ),
    );
    expect(
      useFeedFactoriesStore.getState().custom.map((f) => f.name),
    ).toContain("Fresh");
  });
});

describe("Tower feed after sending", () => {
  const real = {
    id: "real-1",
    title: "Real conversation",
    selected_repository: null,
    created_at: "2026-08-01T12:00:00.000Z",
    updated_at: "2026-08-01T12:00:00.000Z",
    execution_status: "idle",
    sandbox_status: "RUNNING",
    tags: null,
    conversation_url: null,
    session_api_key: null,
  } as unknown as AppConversation;

  beforeEach(() => {
    localStorage.clear();
    useFeedPendingStore.setState({ items: [] });
    useFeedFactoriesStore.setState({ custom: [] });
    useFeedFilterStore.setState({ filter: ALL_FEED_FILTER });
    vi.spyOn(EventService, "searchEvents").mockResolvedValue({
      items: [],
      next_page_id: null,
    } as never);
  });

  it("shows a Starting card at once and replaces it with the real one without duplicating", async () => {
    const search = vi
      .spyOn(AgentServerConversationService, "searchConversations")
      .mockResolvedValue({ items: [], next_page_id: null } as never);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/feed"]}>
          <Feed />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(search).toHaveBeenCalled());

    act(() => {
      useFeedPendingStore.getState().add({
        id: "p1",
        text: "build me a thing",
        factoryId: null,
        agentName: "OpenHands",
        createdAt: Date.now(),
      });
      useFeedPendingStore.getState().attach("p1", "real-1");
    });
    const card = await screen.findByTestId("feed-pending-card");
    expect(card).toHaveTextContent("build me a thing");
    expect(screen.getByTestId("feed-pending-status")).toHaveTextContent(
      "FEED$INBOX_STARTING",
    );

    search.mockResolvedValue({ items: [real], next_page_id: null } as never);
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user", "conversations"],
      });
    });
    await waitFor(() =>
      expect(screen.queryByTestId("feed-pending-card")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByTestId("feed-card")).toHaveLength(1);
  });

  it("keeps the card for a Cloud task id until the real conversation is known", async () => {
    vi.spyOn(
      AgentServerConversationService,
      "searchConversations",
    ).mockResolvedValue({ items: [], next_page_id: null } as never);
    vi.spyOn(AgentServerConversationService, "getStartTask").mockResolvedValue({
      status: "READY",
      app_conversation_id: "real-1",
    } as never);
    renderWithProviders(
      <MemoryRouter initialEntries={["/feed"]}>
        <Feed />
      </MemoryRouter>,
    );
    act(() => {
      useFeedPendingStore.getState().add({
        id: "p2",
        text: "cloud send",
        factoryId: null,
        agentName: "OpenHands",
        createdAt: Date.now(),
      });
      useFeedPendingStore.getState().attach("p2", "task-xyz");
    });
    expect(await screen.findByTestId("feed-pending-card")).toBeInTheDocument();
    await waitFor(() =>
      expect(useFeedPendingStore.getState().items[0].conversationId).toBe(
        "real-1",
      ),
    );
  });
});
