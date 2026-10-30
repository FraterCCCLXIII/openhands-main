import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedContactsSidebar } from "#/components/features/feed/feed-contacts-sidebar";
import { FeedFactoryHeader } from "#/components/features/feed/feed-factory-header";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { ALL_FEED_FILTER } from "#/utils/feed-filters";
import { toFeedFactory } from "#/utils/feed-team-demo";
import { renderWithProviders } from "../../../../test-utils";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
    i18n: { language: "en", exists: () => false },
  }),
}));

vi.mock("#/api/agent-profiles-service/agent-profiles-service.api", () => ({
  default: {
    listProfiles: vi.fn().mockResolvedValue({
      profiles: [{ id: "p1", name: "scout", agent_kind: "openhands" }],
      active_agent_profile_id: null,
    }),
  },
}));

const factory = toFeedFactory({
  id: "f1",
  name: "Web",
  description: "Ships the web app",
  ownerId: "you",
});

const conv = (id: string, withAgent: boolean) =>
  ({
    id,
    title: id,
    selected_repository: "acme/app",
    updated_at: "2026-08-01T12:00:00.000Z",
    execution_status: "running",
    launched_agent_profile: withAgent
      ? { agent_profile_id: "p1", revision: 1 }
      : null,
  }) as unknown as AppConversation;

beforeEach(() => {
  window.history.pushState({}, "", "/");
  localStorage.clear();
  useFeedFactoriesStore.setState(useFeedFactoriesStore.getInitialState());
  useFeedFactoriesStore.getState().addFactory({ ...factory, ownerId: "you" });
});

describe("factory membership in the feed", () => {
  it("counts members, people and only the conversations of member agents", async () => {
    const store = useFeedFactoriesStore.getState();
    store.addAgent("f1", "scout");
    store.inviteByEmail("f1", "review", { email: "Sam@Example.com" });

    renderWithProviders(
      <FeedFactoryHeader
        factory={factory}
        conversations={[conv("a", true), conv("b", false)]}
      />,
    );

    expect(screen.getByTestId("feed-factory-agents")).toHaveTextContent(
      "FEED$FACTORY_AGENTS:1",
    );
    expect(screen.getByTestId("feed-factory-people")).toHaveTextContent(
      "FEED$FACTORY_PEOPLE:1",
    );
    expect(
      await screen.findByText("FEED$FACTORY_CONVERSATIONS:1"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("feed-factory-live")).toHaveTextContent(
      "FEED$FACTORY_LIVE:1",
    );
    expect(screen.queryByTestId("feed-factory-owner")).not.toBeInTheDocument();
  });

  it("shows the people added to factories as contacts, or an honest empty state", () => {
    const props = {
      conversations: [],
      filter: ALL_FEED_FILTER,
      onChange: vi.fn(),
    };
    const { unmount } = renderWithProviders(<FeedContactsSidebar {...props} />);
    expect(screen.getByTestId("feed-contacts-empty")).toBeVisible();
    unmount();

    useFeedFactoriesStore
      .getState()
      .inviteByEmail("f1", "review", { email: "sam@example.com" });
    renderWithProviders(<FeedContactsSidebar {...props} />);
    expect(screen.getByTestId("feed-contact")).toHaveTextContent(
      "sam@example.com",
    );
    expect(screen.getByTestId("feed-contact")).toHaveTextContent("Web");
  });
});
