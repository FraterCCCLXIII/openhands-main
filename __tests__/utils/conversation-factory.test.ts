import { beforeEach, describe, expect, it } from "vitest";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { ALL_FEED_FILTER, matchesFeedFilter } from "#/utils/feed-filters";
import {
  getConversationFactory,
  type FactoryResolver,
} from "#/utils/feed-team-demo";

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

describe("a conversation started from a factory inbox", () => {
  it("is in the factory by its saved tag when this browser holds no placement", () => {
    const tagged = {
      ...conv("c9"),
      tags: { openhandsfactory: "f1" },
    } as AppConversation;

    expect(getConversationFactory(tagged, names)?.id).toBe("f1");
  });

  it("is placed by the inbox log when an earlier build logged it without a placement", async () => {
    localStorage.setItem(
      "feed-factories",
      JSON.stringify({
        version: 2,
        state: {
          custom: [{ id: "f1", name: "Web", description: "", ownerId: "you" }],
          assignments: { kept: { factoryId: "f1", agentName: "Atlas" } },
        },
      }),
    );
    localStorage.setItem(
      "factory-inbox",
      JSON.stringify({
        version: 0,
        state: {
          items: [
            {
              factoryId: "f1",
              kind: "new",
              status: "sent",
              agentName: "OpenHands",
              conversationId: "hi-conv",
            },
            {
              factoryId: "f1",
              kind: "new",
              status: "failed",
              agentName: "OpenHands",
              conversationId: null,
            },
            {
              factoryId: "f1",
              kind: "new",
              status: "sent",
              agentName: "Other",
              conversationId: "kept",
            },
          ],
        },
      }),
    );

    await useFeedFactoriesStore.persist.rehydrate();

    expect(getConversationFactory(conv("hi-conv"), names)?.id).toBe("f1");
    // A placement already saved is never overwritten by the log.
    expect(useFeedFactoriesStore.getState().assignments.kept.agentName).toBe(
      "Atlas",
    );
    useFactoryInboxStore.setState({ items: [] });
  });

  it("moves a Cloud launch's placement from its task id to the conversation id", () => {
    const store = useFeedFactoriesStore.getState();
    store.assignConversation("task-7", { factoryId: "f1", agentName: "x" });

    store.replaceConversationId("task-7", "real-7");

    expect(getConversationFactory(conv("real-7"), names)?.id).toBe("f1");
    expect(useFeedFactoriesStore.getState().assignments["task-7"]).toBe(
      undefined,
    );
  });
});

describe("matchesFeedFilter by factory", () => {
  it("keeps only the conversations of the selected factory", () => {
    useFeedFactoriesStore.getState().addAgent("f1", "scout");
    const filter = { ...ALL_FEED_FILTER, factoryId: "f1" };
    const resolve: FactoryResolver = (c) => getConversationFactory(c, names);

    expect(matchesFeedFilter(conv("a", "p1"), filter, resolve)).toBe(true);
    expect(matchesFeedFilter(conv("b"), filter, resolve)).toBe(false);
  });
});
