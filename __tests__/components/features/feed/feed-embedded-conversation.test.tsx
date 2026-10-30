import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Feed } from "#/components/features/feed/feed";
import { useNavigation } from "#/context/navigation-context";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { renderWithProviders } from "../../../../test-utils";

vi.mock("#/api/agent-profiles-service/agent-profiles-service.api", () => ({
  default: {
    listProfiles: vi
      .fn()
      .mockResolvedValue({ profiles: [], active_agent_profile_id: null }),
  },
}));

// The real input and conversation page need the whole chat provider tree; the
// stubs keep their contracts: the page reads its id from the navigation
// context, and `missing-id` is a conversation the lookup cannot find.
vi.mock("#/components/features/feed/feed-composer", () => ({
  FeedComposer: () => <div data-testid="feed-composer" />,
}));
vi.mock("#/routes/conversation", async () => {
  const React = await import("react");
  return {
    ConversationView: ({ onMissing }: { onMissing: () => void }) => {
      const { conversationId } = useNavigation();
      React.useEffect(() => {
        if (conversationId === "missing-id") onMissing();
      }, [conversationId, onMissing]);
      return <div data-testid="conversation-view">{conversationId}</div>;
    },
  };
});

const conv = (id: string) =>
  ({
    id,
    title: `Title ${id}`,
    selected_repository: null,
    selected_branch: null,
    git_provider: null,
    created_at: "2026-08-01T12:00:00.000Z",
    updated_at: "2026-08-01T12:00:00.000Z",
    execution_status: "idle",
    sandbox_status: "RUNNING",
    tags: null,
  }) as unknown as AppConversation;

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

function renderFeed(route: string) {
  return renderWithProviders(
    <MemoryRouter initialEntries={[route]}>
      <Feed />
      <Location />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(
    AgentServerConversationService,
    "searchConversations",
  ).mockResolvedValue({
    items: [conv("a"), conv("b")],
    next_page_id: null,
  } as never);
});

describe("Tower embedded conversation", () => {
  it("shows the feed and its composer when no conversation is open", async () => {
    renderFeed("/feed");

    expect(await screen.findByTestId("feed-composer")).toBeInTheDocument();
    expect(screen.queryByTestId("feed-embedded-conversation")).toBeNull();
  });

  it("opens the conversation from a deep link in place of the feed and composer", async () => {
    renderFeed("/feed?conversation=b");

    const view = await screen.findByTestId("conversation-view");
    expect(view).toHaveTextContent("b");
    expect(screen.queryByTestId("feed-composer")).toBeNull();
    expect(screen.getByTestId("feed-embedded-open-full")).toHaveAttribute(
      "href",
      expect.stringContaining("/conversations/b"),
    );
  });

  it("Back returns to the feed and restores the composer", async () => {
    const user = userEvent.setup();
    renderFeed("/feed?conversation=b");

    await user.click(await screen.findByTestId("feed-embedded-back"));

    expect(await screen.findByTestId("feed-composer")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/feed$/);
    expect(screen.queryByTestId("conversation-view")).toBeNull();
  });

  it("says so, with a way back, when the conversation cannot be loaded", async () => {
    const user = userEvent.setup();
    renderFeed("/feed?conversation=missing-id");

    expect(
      await screen.findByTestId("feed-embedded-unavailable"),
    ).toBeVisible();
    expect(screen.queryByTestId("conversation-view")).toBeNull();

    await user.click(screen.getByTestId("feed-embedded-back"));
    await waitFor(() =>
      expect(screen.getByTestId("feed-composer")).toBeInTheDocument(),
    );
  });
});
