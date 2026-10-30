import type { Account } from "#/chat-transport/nostr/keys";
import type { TeamMessage } from "#/chat-transport/nostr";
import type { RequestProgress } from "#/stores/team-chat-store";

export interface AgentRequest {
  key: string;
  message: TeamMessage;
  agent: Account;
  /** True once the agent has already said in the thread that it is waiting. */
  acknowledged: boolean;
}

export const requestKey = (messageId: string, agentPubkey: string): string =>
  `${messageId}:${agentPubkey}`;

/**
 * The messages that ask one of my agents for something and still wait on me: they
 * mention the agent, come from someone else (not me, not my other agents), and are not
 * handled yet. A request is returned once per agent mentioned.
 */
export function pendingAgentRequests(input: {
  messages: TeamMessage[];
  myPubkey: string;
  agents: Account[];
  requests: Record<string, RequestProgress>;
}): AgentRequest[] {
  const mine = new Set([input.myPubkey, ...input.agents.map((a) => a.pubkey)]);
  return input.messages.flatMap((message) => {
    if (mine.has(message.pubkey)) return [];
    return input.agents
      .filter((agent) => message.mentions.includes(agent.pubkey))
      .map((agent) => ({
        key: requestKey(message.id, agent.pubkey),
        message,
        agent,
      }))
      .filter(({ key }) => input.requests[key] !== "done")
      .map((item) => ({
        ...item,
        acknowledged: input.requests[item.key] === "acknowledged",
      }));
  });
}

/** The request text without the @mentions of the people it was addressed to. */
export function requestText(text: string, names: string[]): string {
  return names
    .reduce((acc, name) => acc.split(`@${name}`).join(""), text)
    .replace(/\s+/g, " ")
    .trim();
}

/** Pubkeys of the members named with @Name in the text; the longest names match first. */
export function mentionedPubkeys(
  text: string,
  members: Array<{ pubkey: string; name: string }>,
): string[] {
  const found = new Set<string>();
  let rest = text;
  [...members]
    .sort((a, b) => b.name.length - a.name.length)
    .forEach((m) => {
      if (!m.name) return;
      const at = `@${m.name}`;
      const i = rest.indexOf(at);
      const next = rest[i + at.length];
      if (i >= 0 && (next === undefined || /[^\p{L}\p{N}_]/u.test(next))) {
        found.add(m.pubkey);
        rest = rest.split(at).join(" ");
      }
    });
  return [...found];
}
