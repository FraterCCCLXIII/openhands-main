import type { TeamMember, TeamMessage } from "#/chat-transport/nostr";
import type { RequestProgress } from "#/stores/team-chat-store";
import { requestKey } from "./team-chat-inbox";

export type ActivityKind =
  | "posted"
  | "replied"
  | "asked"
  | "received"
  | "agent_replied";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  at: number;
  text: string;
  /** The agent an item is about: who was asked, who answered. */
  agentName?: string;
  /** For someone who asked, or an agent that was asked. */
  askerName?: string;
  status?: "sent" | "waiting" | "answered";
}

export interface OwnedAgent {
  member: TeamMember;
  waiting: number;
  handled: number;
  lastAt: number | null;
}

export interface MemberProfile {
  member: TeamMember;
  owner: TeamMember | null;
  stats: { messages: number; requests: number; handled: number };
  agents: OwnedAgent[];
  timeline: ActivityItem[];
  lastActiveAt: number | null;
}

const TIMELINE_LIMIT = 25;

const statusOf = (
  progress: Record<string, RequestProgress>,
  messageId: string,
  agentPubkey: string,
): ActivityItem["status"] => {
  const p = progress[requestKey(messageId, agentPubkey)];
  if (p === "done") return "answered";
  if (p === "acknowledged") return "waiting";
  return "sent";
};

/**
 * What a person or an agent has been doing in the team: their messages, the requests they
 * made to agents (or that agents received), how those went, and what their own agents did.
 */
export function memberProfile(input: {
  members: TeamMember[];
  messages: TeamMessage[];
  pubkey: string;
  progress: Record<string, RequestProgress>;
}): MemberProfile | null {
  const { members, messages, pubkey, progress } = input;
  const member = members.find((m) => m.pubkey === pubkey);
  if (!member) return null;
  const byKey = new Map(members.map((m) => [m.pubkey, m]));
  const isAgent = member.kind === "agent";
  const owned = members.filter((m) => m.kind === "agent" && m.owner === pubkey);
  const ownedKeys = new Set(owned.map((m) => m.pubkey));
  const nameOf = (pk: string) => byKey.get(pk)?.name ?? "Someone";
  const timeline: ActivityItem[] = [];

  messages.forEach((m) => {
    const askedAgents = m.mentions
      .map((pk) => byKey.get(pk))
      .filter((a): a is TeamMember => a?.kind === "agent");
    const mine = m.pubkey === pubkey;
    if (mine && askedAgents.length > 0 && !isAgent) {
      askedAgents.forEach((a) =>
        timeline.push({
          id: `${m.id}:${a.pubkey}`,
          kind: "asked",
          at: m.createdAt,
          text: m.text,
          agentName: a.name,
          status: statusOf(progress, m.id, a.pubkey),
        }),
      );
    } else if (mine) {
      timeline.push({
        id: m.id,
        kind: m.parent ? "replied" : "posted",
        at: m.createdAt,
        text: m.text,
      });
    }
    if (isAgent && m.mentions.includes(pubkey)) {
      timeline.push({
        id: `${m.id}:in`,
        kind: "received",
        at: m.createdAt,
        text: m.text,
        askerName: nameOf(m.pubkey),
        status: statusOf(progress, m.id, pubkey),
      });
    }
    if (!isAgent && ownedKeys.has(m.pubkey)) {
      timeline.push({
        id: `${m.id}:agent`,
        kind: "agent_replied",
        at: m.createdAt,
        text: m.text,
        agentName: nameOf(m.pubkey),
      });
    }
  });
  timeline.sort((a, b) => b.at - a.at);

  const requests = timeline.filter((i) =>
    isAgent ? i.kind === "received" : i.kind === "asked",
  );
  const agents: OwnedAgent[] = owned.map((a) => {
    const received = messages.filter((m) => m.mentions.includes(a.pubkey));
    const own = messages.filter((m) => m.pubkey === a.pubkey);
    return {
      member: a,
      waiting: received.filter(
        (m) => statusOf(progress, m.id, a.pubkey) !== "answered",
      ).length,
      handled: received.filter(
        (m) => statusOf(progress, m.id, a.pubkey) === "answered",
      ).length,
      lastAt: own.length ? Math.max(...own.map((m) => m.createdAt)) : null,
    };
  });
  const times = timeline.map((i) => i.at);
  return {
    member,
    owner: member.owner ? (byKey.get(member.owner) ?? null) : null,
    stats: {
      messages: messages.filter((m) => m.pubkey === pubkey).length,
      requests: requests.length,
      handled: requests.filter((i) => i.status === "answered").length,
    },
    agents,
    timeline: timeline.slice(0, TIMELINE_LIMIT),
    lastActiveAt: times.length ? Math.max(...times) : null,
  };
}
