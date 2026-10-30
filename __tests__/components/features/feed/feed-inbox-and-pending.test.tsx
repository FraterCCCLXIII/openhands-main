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
