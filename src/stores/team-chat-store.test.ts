import { beforeEach, describe, expect, it } from "vitest";
import { generateAccount } from "#/chat-transport/nostr/keys";
import {
  DEFAULT_RELAY_URL,
  selectMyAgents,
  useTeamChatStore,
} from "./team-chat-store";

const maya = generateAccount("Maya");

beforeEach(() => {
  localStorage.clear();
  useTeamChatStore.setState(useTeamChatStore.getInitialState(), true);
});

describe("team chat session", () => {
  it("returns to the last team and keeps the agents after signing out and in", () => {
    const store = useTeamChatStore.getState();
    store.signIn(maya, DEFAULT_RELAY_URL);
    store.openTeam("web-platform-1");
    store.addAgent(
      generateAccount("Atlas", { kind: "agent", ownerPubkey: maya.pubkey }),
    );

    useTeamChatStore.getState().signOut();
    expect(useTeamChatStore.getState().account).toBeNull();
    expect(useTeamChatStore.getState().groupId).toBeNull();

    useTeamChatStore
      .getState()
      .signIn({ ...maya, name: "" }, DEFAULT_RELAY_URL);
    const after = useTeamChatStore.getState();
    expect(after.groupId).toBe("web-platform-1");
    expect(after.account?.name).toBe("Maya");
    expect(selectMyAgents(after).map((a) => a.name)).toEqual(["Atlas"]);
  });
});
