import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedConversationList } from "#/components/features/feed/feed-conversation-list";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { ALL_FEED_FILTER } from "#/utils/feed-filters";
import { renderWithProviders } from "../../../../test-utils";

// The agent profile list is the only backend call the resolver makes.
vi.mock("#/api/agent-profiles-service/agent-profiles-service.api", () => ({
  default: {
    listProfiles: vi.fn().mockResolvedValue({
      profiles: [{ id: "p1", name: "scout", agent_kind: "openhands" }],
      active_agent_profile_id: null,
    }),
  },
}));

const conv = (id: string, overrides: Partial<AppConversation> = {}) =>
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
    ...overrides,
  }) as unknown as AppConversation;

const all = [
  conv("a", { selected_repository: "acme/app" }),
  conv("b", { selected_repository: "acme/site" }),
  conv("c", {
    selected_repository: "acme/app",
    launched_agent_profile: { agent_profile_id: "p1", revision: 1 },
  }),
];

const renderList = (
  filter = ALL_FEED_FILTER,
  options: { route?: string; navigate?: () => void } = {},
) =>
  renderWithProviders(
    <MemoryRouter initialEntries={[options.route ?? "/feed"]}>
      <FeedConversationList conversations={all} filter={filter} />
    </MemoryRouter>,
    options.navigate ? { navigation: { navigate: options.navigate } } : {},
  );

const rowTitles = () =>
  screen
    .queryAllByTestId("feed-conversation-row")
    .map((row) => within(row).getByText(/Title/).textContent);

beforeEach(() => {
  window.history.pushState({}, "", "/");
  localStorage.clear();
  useFeedFactoriesStore.setState(useFeedFactoriesStore.getInitialState());
});

describe("FeedConversationList", () => {
  it("lists every conversation and opens each one inside Tower", async () => {
    const navigate = vi.fn();
    const user = userEvent.setup();
    renderList(ALL_FEED_FILTER, { navigate });

    expect(rowTitles()).toEqual(["Title a", "Title b", "Title c"]);
    const link = screen
      .getAllByTestId("feed-conversation-row")[1]
      .querySelector("a")!;
    expect(link.getAttribute("href")).not.toContain("/conversations/");

    await user.click(link);

    expect(navigate).toHaveBeenCalledWith(
      expect.stringContaining("/feed?conversation=b"),
      expect.anything(),
    );
  });

  it("marks the conversation open in Tower as current", () => {
    renderList(ALL_FEED_FILTER, { route: "/feed?conversation=c" });

    const current = screen
      .getAllByTestId("feed-conversation-row")
      .filter((row) => row.querySelector('a[aria-current="true"]'));
    expect(current).toHaveLength(1);
    expect(within(current[0]).getByText("Title c")).toBeInTheDocument();
  });

  it("narrows to the selected project and agent", () => {
    renderList({ ...ALL_FEED_FILTER, project: "acme/app" });
    expect(rowTitles()).toEqual(["Title a", "Title c"]);
  });

  it("narrows to the selected factory through its member agents", async () => {
    useFeedFactoriesStore.getState().addFactory({
      id: "f1",
      name: "Web",
      description: "",
      ownerId: "you",
    });
    useFeedFactoriesStore.getState().addAgent("f1", "scout");

    renderList({ ...ALL_FEED_FILTER, factoryId: "f1" });

    expect(await screen.findByText("Title c")).toBeInTheDocument();
    expect(rowTitles()).toEqual(["Title c"]);
  });

  it("searches by title and says so honestly when nothing matches", async () => {
    const user = userEvent.setup();
    renderList();

    await user.type(screen.getByTestId("feed-conversation-search"), "Title b");
    expect(rowTitles()).toEqual(["Title b"]);

    await user.clear(screen.getByTestId("feed-conversation-search"));
    await user.type(screen.getByTestId("feed-conversation-search"), "zzz");
    expect(screen.getByTestId("feed-conversation-list-empty")).toBeVisible();
  });
});
