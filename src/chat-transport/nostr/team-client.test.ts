// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bech32Decode, bech32Encode } from "./bech32";
import { signEvent, verifyEvent } from "./event";
import { generateAccount, pubkeyFromInput, secretFromInput } from "./keys";
import { TeamClient } from "./team-client";

type Relay = { url: string; close: () => Promise<void> };
let relay: Relay;

beforeAll(async () => {
  const { startRelay } = await import("../../../scripts/dev-nostr-relay.mjs");
  relay = await startRelay({ port: 0 });
});
afterAll(async () => {
  await relay.close();
});

const settle = (ms = 300) =>
  new Promise((r) => {
    setTimeout(r, ms);
  });

describe("keys and events", () => {
  it("round-trips the NIP-19 test vectors", () => {
    const hex =
      "67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa";
    const nsec =
      "nsec1vl029mgpspedva04g90vltkh6fvh240zqtv9k0t9af8935ke9laqsnlfe5";
    expect(secretFromInput(nsec)).toBe(hex);
    expect(bech32Encode("nsec", Uint8Array.from(Buffer.from(hex, "hex")))).toBe(
      nsec,
    );
    expect(() => bech32Decode(`${nsec.slice(0, -1)}x`)).toThrow(/typo/);
    const npub =
      "npub10elfcs4fr0l0r8af98jlmgdh9c8tcxjvz9qkw038js35mp4dma8qzvjptg";
    expect(pubkeyFromInput(npub)).toBe(
      "7e7e9c42a91bfef19fa929e5fda1b72e0ebc1a4c1141673e2794234d86addf4e",
    );
  });

  it("signs an event that verifies, and rejects a tampered one", () => {
    const me = generateAccount("Ada");
    const e = signEvent({ kind: 1, tags: [], content: "hi" }, me.secretKey);
    expect(verifyEvent(e)).toBe(true);
    expect(verifyEvent({ ...e, content: "changed" })).toBe(false);
  });
});

describe("a team on the dev relay", () => {
  it("lets two people join by invite and message each other and an agent", async () => {
    const ada = generateAccount("Ada");
    const ben = generateAccount("Ben");
    const group = `team-${Math.random().toString(36).slice(2, 8)}`;

    const adaTeam = await TeamClient.create({
      relayUrl: relay.url,
      groupId: group,
      account: ada,
      name: "Web Platform",
    });
    const invite = await adaTeam.createInvite();
    const benTeam = await TeamClient.join(invite, ben);
    await settle();

    expect(
      adaTeam
        .members()
        .map((m) => m.name)
        .sort(),
    ).toEqual(["Ada", "Ben"]);
    expect(adaTeam.isAdmin()).toBe(true);
    expect(benTeam.isAdmin()).toBe(false);

    const atlas = await adaTeam.addAgent("Atlas");
    await settle();
    expect(
      benTeam.members().find((m) => m.pubkey === atlas.pubkey),
    ).toMatchObject({ kind: "agent", owner: ada.pubkey });

    await benTeam.post("@Atlas can you check the build?", {
      mentions: [atlas.pubkey],
    });
    await settle();
    const asked = adaTeam
      .messages()
      .find((m) => m.text.includes("check the build"))!;
    expect(asked.pubkey).toBe(ben.pubkey);
    expect(asked.mentions).toEqual([atlas.pubkey]);

    await adaTeam.post("On it.", { as: atlas, parent: asked.id });
    await settle();
    const answer = benTeam.messages().find((m) => m.text === "On it.")!;
    expect(answer).toMatchObject({ pubkey: atlas.pubkey, parent: asked.id });
    adaTeam.close();
    benTeam.close();
  });

  it("refuses an outsider, a used invite, and a non-admin adding people", async () => {
    const ada = generateAccount("Ada");
    const ben = generateAccount("Ben");
    const eve = generateAccount("Eve");
    const group = `team-${Math.random().toString(36).slice(2, 8)}`;
    const adaTeam = await TeamClient.create({
      relayUrl: relay.url,
      groupId: group,
      account: ada,
      name: "Private",
    });
    const invite = await adaTeam.createInvite();
    const benTeam = await TeamClient.join(invite, ben);

    await expect(TeamClient.join(invite, eve)).rejects.toThrow(/invite/);
    await expect(benTeam.addMember(eve.npub)).rejects.toThrow(/admins only/);
    const outsider = new TeamClient({
      relayUrl: relay.url,
      groupId: group,
      account: eve,
    });
    await expect(outsider.post("let me in")).rejects.toThrow(/members/);
    adaTeam.close();
    benTeam.close();
    outsider.close();
  });
});
