import { beforeEach, describe, expect, it } from "vitest";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import {
  forgetAgentProfileLocalState,
  renameAgentProfileLocalState,
} from "#/utils/agent-profile-local-state";
import { agentIconKey } from "#/utils/feed-icon-keys";

beforeEach(() => {
  localStorage.clear();
  useFeedAgentConfigStore.setState({ configs: {} });
  useFeedIconsStore.setState({ icons: {} });
  useFeedFactoriesStore.setState({
    ...useFeedFactoriesStore.getInitialState(),
  });
});

describe("agent profile attributes", () => {
  it("survive a reload", async () => {
    useFeedAgentConfigStore.getState().setConfig("scout", {
      role: "scout",
      description: "Maps the repo",
      color: "teal",
    });

    const saved = localStorage.getItem("feed-agent-config") as string;
    useFeedAgentConfigStore.setState({ configs: {} });
    localStorage.setItem("feed-agent-config", saved);
    await useFeedAgentConfigStore.persist.rehydrate();

    expect(useFeedAgentConfigStore.getState().configs.scout).toMatchObject({
      role: "scout",
      description: "Maps the repo",
      color: "teal",
    });
  });

  it("merge edits instead of replacing the saved attributes", () => {
    const { setConfig } = useFeedAgentConfigStore.getState();
    setConfig("scout", { role: "scout", description: "Maps the repo" });
    setConfig("scout", { description: "Maps and summarises the repo" });

    expect(useFeedAgentConfigStore.getState().configs.scout).toEqual({
      role: "scout",
      description: "Maps and summarises the repo",
    });
  });

  it("hydrate to an empty valid state from a damaged save", async () => {
    localStorage.setItem(
      "feed-agent-config",
      JSON.stringify({ state: { configs: "oops" }, version: 0 }),
    );
    await useFeedAgentConfigStore.persist.rehydrate();

    expect(useFeedAgentConfigStore.getState().configs).toEqual({});
  });
});

describe("renaming and deleting an agent profile", () => {
  const seed = () => {
    useFeedAgentConfigStore.getState().setConfig("scout", { role: "scout" });
    const factories = useFeedFactoriesStore.getState();
    factories.addAgent("f1", "scout");
    factories.addAgent("f1", "other");
    factories.addAgent("f2", "scout");
    factories.setCoordinator("f2", "scout");
    useFeedIconsStore
      .getState()
      .setIcon(agentIconKey("id-1"), { emoji: "🔭", background: "sky" });
  };

  it("carries attributes and every factory membership to the new name", () => {
    seed();

    renameAgentProfileLocalState("scout", "ranger");

    expect(useFeedAgentConfigStore.getState().configs).toEqual({
      ranger: { role: "scout" },
    });
    const factories = useFeedFactoriesStore.getState();
    expect(factories.addedAgents).toEqual({
      f1: ["ranger", "other"],
      f2: ["ranger"],
    });
    expect(factories.coordinators.f2).toBe("ranger");
  });

  it("removes the profile from factories, its icon and its attributes", () => {
    seed();

    forgetAgentProfileLocalState("scout", "id-1");

    expect(useFeedAgentConfigStore.getState().configs).toEqual({});
    expect(useFeedIconsStore.getState().icons).toEqual({});
    const factories = useFeedFactoriesStore.getState();
    expect(factories.addedAgents).toEqual({ f1: ["other"], f2: [] });
    expect(factories.coordinators).toEqual({});
  });
});

describe("factory store hydration", () => {
  it("fills the maps an older save lacks", async () => {
    localStorage.setItem(
      "feed-factories",
      JSON.stringify({
        state: {
          custom: [{ id: "c1", name: "A", description: "", ownerId: "you" }],
        },
        version: 0,
      }),
    );
    await useFeedFactoriesStore.persist.rehydrate();

    const state = useFeedFactoriesStore.getState();
    expect(state.custom).toHaveLength(1);
    expect(state.addedAgents).toEqual({});
    expect(state.humanAssignments).toEqual({});
  });
});
