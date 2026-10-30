import { describe, expect, it } from "vitest";
import { generateAccount } from "#/chat-transport/nostr/keys";
import type { TeamMessage } from "#/chat-transport/nostr";
import { mentionedPubkeys, pendingAgentRequests } from "./team-chat-inbox";

const me = generateAccount("Maya");
const atlas = generateAccount("Atlas", {
  kind: "agent",
  ownerPubkey: me.pubkey,
});
const ben = generateAccount("Ben");

const message = (
  id: string,
  pubkey: string,
  mentions: string[],
): TeamMessage => ({
  id,
  pubkey,
  createdAt: 1,
  text: "hi",
  parent: null,
  mentions,
});

const run = (
  messages: TeamMessage[],
  requests: Record<string, "acknowledged" | "done"> = {},
) =>
  pendingAgentRequests({
    messages,
    myPubkey: me.pubkey,
    agents: [atlas],
    requests,
  });

describe("pendingAgentRequests", () => {
  it("counts only other people's messages that mention my agent", () => {
    const result = run([
      message("a", ben.pubkey, [atlas.pubkey]),
      message("b", ben.pubkey, [me.pubkey]),
      message("c", me.pubkey, [atlas.pubkey]),
      message("d", atlas.pubkey, [atlas.pubkey]),
    ]);
    expect(result.map((r) => r.message.id)).toEqual(["a"]);
    expect(result[0].acknowledged).toBe(false);
  });

  it("drops a handled request and flags an acknowledged one", () => {
    const messages = [
      message("a", ben.pubkey, [atlas.pubkey]),
      message("b", ben.pubkey, [atlas.pubkey]),
    ];
    const result = run(messages, {
      [`a:${atlas.pubkey}`]: "done",
      [`b:${atlas.pubkey}`]: "acknowledged",
    });
    expect(result.map((r) => [r.message.id, r.acknowledged])).toEqual([
      ["b", true],
    ]);
  });
});

describe("mentionedPubkeys", () => {
  it("finds members named with @, preferring the longest name", () => {
    const members = [
      { pubkey: "1", name: "Al" },
      { pubkey: "2", name: "Alice" },
    ];
    expect(mentionedPubkeys("hello @Alice, ok", members)).toEqual(["2"]);
  });
});
