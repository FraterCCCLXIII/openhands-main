import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFeedRepliesStore } from "#/stores/feed-replies-store";
import { createLocalChatTransport } from "./local-adapter";
import { identityDirectory } from "./identity-directory";
import type { ChatMessage } from "./types";

describe("local chat transport", () => {
  beforeEach(() => {
    useFeedRepliesStore.setState({ replies: [] });
  });

  it("delivers a posted message to a subscriber as the local user", async () => {
    const transport = createLocalChatTransport();
    const onMessage = vi.fn<(m: ChatMessage) => void>();
    transport.subscribe("c1", onMessage);

    await transport.post("c1", { text: "hello" });

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage.mock.calls[0][0]).toMatchObject({
      channel: "c1",
      parent: null,
      text: "hello",
      author: { id: "you", kind: "person" },
    });
  });

  it("keeps the parent of a threaded reply and replays history", async () => {
    const transport = createLocalChatTransport();
    await transport.post("c1", { text: "root" });
    await transport.post("c1", { text: "reply", parent: "msg-1" });
    await transport.post("other", { text: "elsewhere" });
    const received: ChatMessage[] = [];

    transport.subscribe("c1", (m) => received.push(m));

    expect(received.map((m) => [m.text, m.parent])).toEqual([
      ["root", null],
      ["reply", "msg-1"],
    ]);
  });

  it("resolves @mentions to identities, not handles", async () => {
    const transport = createLocalChatTransport();
    const received: ChatMessage[] = [];
    transport.subscribe("c1", (m) => received.push(m));

    await transport.post("c1", {
      text: "@maya and @Atlas please look, @nobody",
    });

    expect(received[0].mentions).toEqual([
      { identityId: "maya" },
      { identityId: identityDirectory.agentByName("Atlas")!.id },
    ]);
  });
});
