import {
  FEED_ME_ID,
  FEED_TEAMMATES,
  toMentionHandle,
} from "#/utils/feed-team-demo";
import { FEED_DEMO_AGENTS } from "#/utils/feed-demo-agents";
import type { Identity } from "./types";

export const LOCAL_AGENT_ID_PREFIX = "agent:";

/** The signed-in user's local identity. */
export const LOCAL_ME: Identity = {
  id: FEED_ME_ID,
  displayName: "You",
  kind: "person",
};

const PEOPLE: Identity[] = FEED_TEAMMATES.map((member) => ({
  id: member.id,
  displayName: member.name,
  kind: "person",
}));

const AGENTS: Identity[] = FEED_DEMO_AGENTS.map((agent) => ({
  id: `${LOCAL_AGENT_ID_PREFIX}${agent.name}`,
  displayName: agent.name,
  kind: "agent",
}));

const ALL: Identity[] = [LOCAL_ME, ...PEOPLE, ...AGENTS];

/** Resolves profile ids and @handles to identities with stable ids. */
export const identityDirectory = {
  all: (): Identity[] => ALL,

  /** The identity for a profile id (`maya`, `you`) or an agent id. */
  get: (id: string): Identity | undefined =>
    ALL.find((identity) => identity.id === id),

  /** The identity an agent profile name maps to, e.g. `Atlas`. */
  agentByName: (name: string): Identity | undefined =>
    AGENTS.find((identity) => identity.displayName === name),

  /** Resolves `@Maya` style handles, case-insensitively; skips unknown ones. */
  resolveMentions: (text: string): Identity[] => {
    const handles = text.match(/@([\p{L}\p{N}_-]+)/gu) ?? [];
    const found = new Map<string, Identity>();
    handles.forEach((raw) => {
      const handle = raw.slice(1).toLowerCase();
      const match = ALL.find(
        (identity) =>
          identity.id !== LOCAL_ME.id &&
          toMentionHandle(identity.displayName).toLowerCase() === handle,
      );
      if (match) found.set(match.id, match);
    });
    return [...found.values()];
  },
};
