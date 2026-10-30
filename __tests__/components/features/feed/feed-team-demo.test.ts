import * as vitestDemoOn from "vitest";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ALL_FEED_FILTER, matchesFeedFilter } from "#/utils/feed-filters";
import { sortFeedConversations } from "#/utils/feed-sort";
import {
  FEED_FACTORIES,
  FEED_ME_ID,
  flattenFeedThread,
  getFeedFactory,
  getFeedMentionTargets,
  getFeedPerson,
  getFeedTeamThread,
  getFeedTeammateIds,
  isFeedTeamDemoEnabled,
} from "#/utils/feed-team-demo";
import { useFeedRepliesStore } from "#/stores/feed-replies-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import {
  FEED_DEMO_AGENT_FILTER_PREFIX,
  pickFeedDemoAgent,
} from "#/utils/feed-demo-agents";

const conv = (id: string, overrides: Partial<AppConversation> = {}) =>
  ({
    id,
    title: id,
    updated_at: "2026-08-01T12:00:00.000Z",
    selected_repository: null,
    tags: null,
    ...overrides,
  }) as unknown as AppConversation;

describe("feed team demo", () => {
  it("is on unless ?demoTeam=off", () => {
    expect(isFeedTeamDemoEnabled("")).toBe(true);
    expect(isFeedTeamDemoEnabled("?demoTeam=off")).toBe(false);
  });

  it("builds the same nested thread for a conversation every time", () => {
    const c = conv("abc-123");
    expect(getFeedTeamThread(c)).toEqual(getFeedTeamThread(c));

    const [first] = getFeedTeamThread(c);
    expect(first.replies[0].replies[0].kind).toBe("subagent");
  });

  it("only mentions people who are in the conversation", () => {
    const c = conv("abc-123");
    const handles = getFeedMentionTargets(c.id).map((t) => t.handle);
    const mentioned = flattenFeedThread(getFeedTeamThread(c)).flatMap(
      (message) => [...message.text.matchAll(/@(\w+)/g)].map(([, h]) => h),
    );
    expect(mentioned.length).toBeGreaterThan(0);
    mentioned.forEach((handle) => expect(handles).toContain(handle));
  });

  it("filters by the factory and teammate a conversation is simulated in", () => {
    const c = conv("abc-123");
    const factory = getFeedFactory(c.id);
    const [teammateId] = getFeedTeammateIds(c.id);
    const otherFactory = FEED_FACTORIES.find((f) => f.id !== factory.id)!;

    expect(
      matchesFeedFilter(c, { ...ALL_FEED_FILTER, factoryId: factory.id }),
    ).toBe(true);
    expect(
      matchesFeedFilter(c, { ...ALL_FEED_FILTER, factoryId: otherFactory.id }),
    ).toBe(false);
    expect(matchesFeedFilter(c, { ...ALL_FEED_FILTER, teammateId })).toBe(true);
    expect(
      matchesFeedFilter(c, { ...ALL_FEED_FILTER, teammateId: "nobody" }),
    ).toBe(false);
  });

  it("gives the user and every teammate a profile", () => {
    expect(getFeedPerson(FEED_ME_ID)?.isMe).toBe(true);
    expect(getFeedPerson("maya")?.name).toBe("Maya Chen");
    expect(getFeedPerson("nobody")).toBeUndefined();
  });
});

describe("feed sort", () => {
  const items = [
    conv("b", { title: "Banana", updated_at: "2026-08-02T00:00:00.000Z" }),
    conv("a", { title: "Apple", updated_at: "2026-08-03T00:00:00.000Z" }),
    conv("c", { title: "Cherry", updated_at: "2026-08-01T00:00:00.000Z" }),
  ];
  const ids = (list: AppConversation[]) => list.map((c) => c.id);

  it("orders by latest, oldest and title without mutating the input", () => {
    expect(ids(sortFeedConversations(items, "latest"))).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(ids(sortFeedConversations(items, "agent"))).toEqual(["a", "b", "c"]);
    expect(ids(sortFeedConversations(items, "oldest"))).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(ids(sortFeedConversations(items, "title"))).toEqual(["a", "b", "c"]);
    expect(ids(items)).toEqual(["b", "a", "c"]);
  });
});

describe("feed replies store", () => {
  beforeEach(() => useFeedRepliesStore.setState({ replies: [] }));

  it("keeps a reply written in a thread", () => {
    useFeedRepliesStore.getState().addReply({
      id: "r1",
      conversationId: "c",
      parentId: "m1",
      personId: FEED_ME_ID,
      author: "You",
      kind: "teammate",
      text: "hi @Maya",
      timestamp: "2026-08-01T12:00:00.000Z",
    });
    expect(useFeedRepliesStore.getState().replies).toHaveLength(1);
  });
});

describe("feed persona filter", () => {
  it("matches the simulated persona a conversation is assigned", () => {
    const c = conv("abc-123");
    const persona = pickFeedDemoAgent(c.id).name;
    const filterFor = (name: string) => ({
      ...ALL_FEED_FILTER,
      agentProfileId: `${FEED_DEMO_AGENT_FILTER_PREFIX}${name}`,
    });

    expect(matchesFeedFilter(c, filterFor(persona))).toBe(true);
    expect(matchesFeedFilter(c, filterFor("Nobody"))).toBe(false);
  });
});

describe("feed icons store", () => {
  beforeEach(() => useFeedIconsStore.setState({ icons: {} }));

  it("keeps a custom icon per key and drops it when emptied", () => {
    const { setIcon } = useFeedIconsStore.getState();
    setIcon("acme/app", { background: "violet", emoji: "🚀" });
    expect(useFeedIconsStore.getState().icons).toEqual({
      "acme/app": { background: "violet", emoji: "🚀" },
    });

    setIcon("factory:web", { lucide_icon: "Globe" });
    setIcon("acme/app", { background: null, emoji: null, lucide_icon: null });
    // Emptying one key leaves the others, whatever kind they are.
    expect(useFeedIconsStore.getState().icons).toEqual({
      "factory:web": { lucide_icon: "Globe" },
    });
  });
});

// These cover the simulated team, which is opt-in.
vitestDemoOn.beforeEach(() => window.history.pushState({}, "", "/?demoTeam=on"));
vitestDemoOn.afterEach(() => window.history.pushState({}, "", "/"));
