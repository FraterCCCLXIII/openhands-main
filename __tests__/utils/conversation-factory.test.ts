import { beforeEach, describe, expect, it } from "vitest";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { ALL_FEED_FILTER, matchesFeedFilter } from "#/utils/feed-filters";
import { getConversationFactory } from "#/utils/feed-team-demo";

const conv = (id: string, profileId?: string) =>
  ({
    id,
    selected_repository: null,
    tags: null,
    launched_agent_profile: profileId
      ? { agent_profile_id: profileId, revision: 1 }
      : null,
  }) as unknown as AppConversation;

const names = new Map([["p1", "scout"]]);

beforeEach(() => {
  window.history.pushState({}, "", "/");
  useFeedFactoriesStore.setState(useFeedFactoriesStore.getInitialState());
  useFeedFactoriesStore.getState().addFactory({
    id: "f1",
    name: "Web",
    description: "",
    ownerId: "you",
  });
});

describe("getConversationFactory", () => {
  it("is undefined for a conversation nobody placed, never a guessed factory", () => {
    expect(getConversationFactory(conv("c1"), names)).toBeUndefined();
  });

  it("uses the factory a conversation was placed in", () => {
    useFeedFactoriesStore
      .getState()
      .assignConversation("c1", { factoryId: "f1", agentName: "scout" });

    expect(getConversationFactory(conv("c1"), names)?.id).toBe("f1");
  });

  it("follows factory membership of the agent profile it was launched with", () => {
    useFeedFactoriesStore.getState().addAgent("f1", "scout");

    expect(getConversationFactory(conv("c1", "p1"), names)?.id).toBe("f1");
    expect(getConversationFactory(conv("c2"), names)).toBeUndefined();

    useFeedFactoriesStore.getState().removeAgent("f1", "scout");
    expect(getConversationFactory(conv("c1", "p1"), names)).toBeUndefined();
  });
});

describe("matchesFeedFilter by factory", () => {
  it("keeps only the conversations of the selected factory", () => {
    useFeedFactoriesStore.getState().addAgent("f1", "scout");
    const filter = { ...ALL_FEED_FILTER, factoryId: "f1" };
    const resolve = (c: { id: string; launched_agent_profile?: never }) =>
      getConversationFactory(c, names);

    expect(matchesFeedFilter(conv("a", "p1"), filter, resolve)).toBe(true);
    expect(matchesFeedFilter(conv("b"), filter, resolve)).toBe(false);
  });
});
