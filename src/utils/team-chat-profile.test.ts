import { describe, expect, it } from "vitest";
import type { TeamMember, TeamMessage } from "#/chat-transport/nostr";
import { memberProfile } from "./team-chat-profile";

const member = (
  pubkey: string,
  name: string,
  extra: Partial<TeamMember> = {},
): TeamMember => ({
  pubkey,
  npub: pubkey,
  name,
  roles: ["member"],
  kind: "person",
  ...extra,
});
const msg = (
  id: string,
  pubkey: string,
  at: number,
  text: string,
  extra: Partial<TeamMessage> = {},
): TeamMessage => ({
  id,
  pubkey,
  createdAt: at,
  text,
  parent: null,
  mentions: [],
  ...extra,
});

const members = [
  member("maya", "Maya"),
  member("dev", "Dev"),
  member("atlas", "Atlas", { kind: "agent", owner: "maya" }),
  member("forge", "Forge", { kind: "agent", owner: "dev" }),
];
const messages = [
  msg("1", "dev", 100, "Morning all"),
  msg("2", "dev", 200, "@Atlas summarise the PR", { mentions: ["atlas"] }),
  msg("3", "atlas", 210, "Waiting for Maya to approve", { parent: "2" }),
  msg("4", "maya", 300, "Looks good", { parent: "1" }),
  msg("5", "maya", 400, "@Forge check the images", { mentions: ["forge"] }),
  msg("6", "atlas", 500, "Release notes drafted"),
];

describe("memberProfile", () => {
  it("shows what a person posted, asked of agents, and how those requests stand", () => {
    const p = memberProfile({
      members,
      messages,
      pubkey: "dev",
      progress: { "2:atlas": "acknowledged" },
    });
    expect(p?.stats).toEqual({ messages: 2, requests: 1, handled: 0 });
    const asked = p?.timeline.find((i) => i.kind === "asked");
    expect(asked).toMatchObject({ agentName: "Atlas", status: "waiting" });
    expect(p?.timeline.map((i) => i.kind)).toEqual(["asked", "posted"]);
    expect(p?.lastActiveAt).toBe(200);
  });

  it("counts a request as answered once it is done, and lists the agents someone runs with their queue", () => {
    const p = memberProfile({
      members,
      messages,
      pubkey: "dev",
      progress: { "2:atlas": "done" },
    });
    expect(p?.stats.handled).toBe(1);
    const forge = memberProfile({
      members,
      messages,
      pubkey: "maya",
      progress: { "2:atlas": "acknowledged" },
    });
    expect(forge?.agents).toHaveLength(1);
    expect(forge?.agents[0]).toMatchObject({
      waiting: 1,
      handled: 0,
      lastAt: 500,
    });
    expect(
      forge?.timeline
        .filter((i) => i.kind === "agent_replied")
        .map((i) => i.agentName),
    ).toEqual(["Atlas", "Atlas"]);
  });

  it("shows an agent its owner, the requests it received and what it posted", () => {
    const p = memberProfile({
      members,
      messages,
      pubkey: "atlas",
      progress: { "2:atlas": "done" },
    });
    expect(p?.owner?.name).toBe("Maya");
    expect(p?.timeline.find((i) => i.kind === "received")).toMatchObject({
      askerName: "Dev",
      status: "answered",
    });
    expect(p?.stats).toEqual({ messages: 2, requests: 1, handled: 1 });
  });

  it("returns nothing for someone who is not on the team", () => {
    expect(
      memberProfile({ members, messages, pubkey: "nobody", progress: {} }),
    ).toBeNull();
  });
});
