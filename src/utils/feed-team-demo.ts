import {
  Database,
  Globe,
  Server,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ExecutionStatus } from "#/types/agent-server/core";
import { Factory } from "lucide-react";
import {
  useFeedFactoriesStore,
  type CustomFactory,
} from "#/stores/feed-factories-store";
import { pickFeedDemoAgent, pickFeedTint } from "./feed-demo-agents";

/** Query parameter that switches the simulated team on: `?demoTeam=on`. */
export const FEED_TEAM_DEMO_PARAM = "demoTeam";

/**
 * The simulated factories, teammates and chatter are off unless asked for with
 * `?demoTeam=on`. Without it the Feed shows only real data.
 */
export function isFeedTeamDemoEnabled(search: string): boolean {
  return new URLSearchParams(search).get(FEED_TEAM_DEMO_PARAM) === "on";
}

export interface FeedFactory {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  /** Tailwind classes for the factory icon tile's tint and glyph color. */
  className: string;
  /** The simulated teammate who owns the factory. */
  ownerId: string;
}

export const FEED_FACTORIES: readonly FeedFactory[] = [
  {
    id: "web",
    name: "Web Platform",
    description:
      "Ships the customer-facing web apps: the design system, frontend releases and the agents that keep them green.",
    Icon: Globe,
    className: "bg-sky-500/20 text-sky-300",
    ownerId: "maya",
  },
  {
    id: "mobile",
    name: "Mobile Apps",
    description:
      "iOS and Android builds, store releases and the device-test agents that gate every version.",
    Icon: Smartphone,
    className: "bg-violet-500/20 text-violet-300",
    ownerId: "dev",
  },
  {
    id: "data",
    name: "Data Pipeline",
    description:
      "Ingestion, transformation and quality checks that feed the analytics warehouse.",
    Icon: Database,
    className: "bg-emerald-500/20 text-emerald-300",
    ownerId: "sofia",
  },
  {
    id: "infra",
    name: "Infrastructure",
    description:
      "Cloud, CI runners and deploy automation that every other factory builds on.",
    Icon: Server,
    className: "bg-amber-500/20 text-amber-300",
    ownerId: "omar",
  },
];

export interface FeedTeammate {
  id: string;
  name: string;
  title: string;
  initials: string;
  online: boolean;
  /** Tailwind classes for the avatar's tint and text color. */
  className: string;
}

export const FEED_TEAMMATES: readonly FeedTeammate[] = [
  {
    id: "maya",
    name: "Maya Chen",
    title: "Staff engineer",
    initials: "MC",
    online: true,
    className: "bg-sky-500/20 text-sky-300",
  },
  {
    id: "dev",
    name: "Dev Patel",
    title: "Product manager",
    initials: "DP",
    online: true,
    className: "bg-violet-500/20 text-violet-300",
  },
  {
    id: "lena",
    name: "Lena Fischer",
    title: "Designer",
    initials: "LF",
    online: false,
    className: "bg-pink-500/20 text-pink-300",
  },
  {
    id: "omar",
    name: "Omar Haddad",
    title: "SRE",
    initials: "OH",
    online: true,
    className: "bg-emerald-500/20 text-emerald-300",
  },
  {
    id: "sofia",
    name: "Sofia Rossi",
    title: "QA lead",
    initials: "SR",
    online: false,
    className: "bg-amber-500/20 text-amber-300",
  },
];

/** The signed-in user, who has a profile page like every teammate. */
export const FEED_ME_ID = "you";

export interface FeedPerson {
  id: string;
  name: string;
  title: string;
  initials: string;
  online: boolean;
  className: string;
  /** The user, whose name comes from translation instead of `name`. */
  isMe: boolean;
}

const FEED_ME: FeedPerson = {
  id: FEED_ME_ID,
  name: "You",
  title: "",
  initials: "YO",
  online: true,
  className: "bg-surface text-contrast",
  isMe: true,
};

/** A teammate, or the user for `you`; undefined for an unknown id. */
export function getFeedPerson(id: string): FeedPerson | undefined {
  if (id === FEED_ME_ID) return FEED_ME;
  const member = FEED_TEAMMATES.find((candidate) => candidate.id === id);
  return member ? { ...member, isMe: false } : undefined;
}

/** Route to a person's profile page. */
export const feedProfilePath = (personId: string): string =>
  `/feed/people/${personId}`;

const hashId = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/** A factory someone added, shaped like the built-in ones. */
export function toFeedFactory(factory: CustomFactory): FeedFactory {
  return { ...factory, Icon: Factory, className: pickFeedTint(factory.id) };
}

/**
 * The factory a conversation belongs to: the one the inbox placed it in, else
 * a stable simulated one so reloads keep it.
 */
export function getFeedFactory(conversationId: string): FeedFactory {
  const { assignments, custom } = useFeedFactoriesStore.getState();
  const assigned = assignments[conversationId];
  if (assigned) {
    const found =
      FEED_FACTORIES.find((factory) => factory.id === assigned.factoryId) ??
      custom
        .filter((factory) => factory.id === assigned.factoryId)
        .map(toFeedFactory)[0];
    if (found) return found;
  }
  return FEED_FACTORIES[hashId(conversationId) % FEED_FACTORIES.length];
}

/** What a conversation needs to say which factory it belongs to. */
export interface FactoryConversationRef {
  id: string;
  launched_agent_profile?: { agent_profile_id: string } | null;
}

/** Maps a conversation to its factory, or undefined when it has none. */
export type FactoryResolver = (
  conversation: FactoryConversationRef,
) => FeedFactory | undefined;

/**
 * The factory a conversation really belongs to: the one the inbox placed it
 * in, else the first factory that has the agent profile it was launched with
 * as a member. Undefined when neither applies; only `?demoTeam=on` falls back
 * to a simulated factory.
 */
export function getConversationFactory(
  conversation: FactoryConversationRef,
  agentNameById?: ReadonlyMap<string, string>,
): FeedFactory | undefined {
  const { assignments, custom, addedAgents } = useFeedFactoriesStore.getState();
  const demo =
    typeof window !== "undefined" &&
    isFeedTeamDemoEnabled(window.location.search);
  const known: FeedFactory[] = [
    ...(demo ? FEED_FACTORIES : []),
    ...custom.map(toFeedFactory),
  ];
  const assigned = assignments[conversation.id];
  if (assigned) {
    const found = known.find((factory) => factory.id === assigned.factoryId);
    if (found) return found;
  }
  const profileId = conversation.launched_agent_profile?.agent_profile_id;
  const agentName = profileId ? agentNameById?.get(profileId) : undefined;
  if (agentName) {
    const member = known.find((factory) =>
      addedAgents[factory.id]?.includes(agentName),
    );
    if (member) return member;
  }
  return demo ? getFeedFactory(conversation.id) : undefined;
}

export type FeedTeamAuthorKind = "agent" | "subagent" | "teammate";

export interface FeedTeamMessage {
  id: string;
  kind: FeedTeamAuthorKind;
  /** Display name: the persona, a subagent, or the teammate. */
  author: string;
  teammate?: FeedTeammate;
  /** May contain `@Handle` mentions of the people in the thread. */
  text: string;
  /** ISO time, counted back from the conversation's last activity. */
  timestamp: string;
  /** Direct replies, oldest first. */
  replies: FeedTeamMessage[];
}

const TEAMMATE_OPENERS = [
  "Can we get this shipped before the demo?",
  "Quick check: does this touch the auth flow?",
  "Looks promising. What's left before review?",
  "Is this safe to roll out behind the flag?",
];

const AGENT_REPLIES = [
  "On it. I'm splitting the work across two subagents and will report back.",
  "Plan is ready: one subagent maps the files, another runs the suite.",
  "Picking this up now. I'll post a summary when the checks pass.",
  "Yes, nothing else depends on it. Starting the change.",
];

const SUBAGENT_NAMES = ["Scout", "Verifier", "Janitor"];

const SUBAGENT_REPORTS = [
  "Mapped 12 files that need changes. No blockers so far.",
  "Test suite: 148 passed, 0 failed.",
  "Cleaned up 3 stale branches and a dangling worktree.",
  "Found 2 flaky tests and re-ran them. Both green.",
];

const TEAMMATE_CLOSERS = [
  "Nice work. I'll review the diff after lunch.",
  "Ship it once CI is green.",
  "Left a comment on the PR. Nothing blocking.",
  "Thanks, this unblocks the release.",
];

const AGENT_FOLLOW_UPS = [
  "Thanks! I'll merge as soon as CI is green.",
  "Will do. I'll ping you when the PR is up.",
  "Got it. Adding that to the checklist.",
  "Appreciate it. Anything else you want covered?",
];

const MINUTE_MS = 60_000;

const pick = <T>(items: readonly T[], seed: number): T =>
  items[seed % items.length];

/** The @handle for a display name: its first word, without spaces. */
export const toMentionHandle = (name: string): string =>
  name.split(/[\s/]+/).filter(Boolean)[0] ?? name;

/** The two simulated teammates in a conversation, always different people. */
function getThreadTeammates(
  conversationId: string,
): [FeedTeammate, FeedTeammate] {
  const seed = hashId(conversationId);
  const first = seed % FEED_TEAMMATES.length;
  const second =
    (first + 1 + ((seed >>> 3) % (FEED_TEAMMATES.length - 1))) %
    FEED_TEAMMATES.length;
  return [FEED_TEAMMATES[first], FEED_TEAMMATES[second]];
}

/** Ids of the simulated teammates talking in a conversation. */
export function getFeedTeammateIds(conversationId: string): string[] {
  return getThreadTeammates(conversationId).map((member) => member.id);
}

export interface FeedMentionTarget {
  handle: string;
  name: string;
  kind: FeedTeamAuthorKind;
}

/** Everyone a reply on this conversation can @mention. */
export function getFeedMentionTargets(
  conversationId: string,
): FeedMentionTarget[] {
  const seed = hashId(conversationId);
  const agent = pickFeedDemoAgent(conversationId);
  const subagent = pick(SUBAGENT_NAMES, seed >>> 4);
  return [
    ...getThreadTeammates(conversationId).map((member) => ({
      handle: toMentionHandle(member.name),
      name: member.name,
      kind: "teammate" as const,
    })),
    { handle: agent.name, name: agent.name, kind: "agent" as const },
    {
      handle: subagent,
      name: `${agent.name} / ${subagent}`,
      kind: "subagent" as const,
    },
  ];
}

/**
 * A simulated exchange on a feed item as a reply tree. A teammate asks, the
 * agent answers with a subagent's report nested under it, and a second
 * teammate wraps up and gets a reply. Deterministic per conversation so
 * reloads keep the same chatter.
 */
export function getFeedTeamThread(conversation: {
  id: string;
  updated_at: string;
}): FeedTeamMessage[] {
  const seed = hashId(conversation.id);
  const [asker, closer] = getThreadTeammates(conversation.id);
  const agent = pickFeedDemoAgent(conversation.id);
  const subagent = pick(SUBAGENT_NAMES, seed >>> 4);
  const end = new Date(conversation.updated_at).getTime();
  const at = (minutesBefore: number): string =>
    new Date(end - minutesBefore * MINUTE_MS).toISOString();
  const id = (n: number) => `${conversation.id}-team-${n}`;

  const subagentReport: FeedTeamMessage = {
    id: id(3),
    kind: "subagent",
    author: `${agent.name} / ${subagent}`,
    text: `@${agent.name} ${pick(SUBAGENT_REPORTS, seed >>> 5)}`,
    timestamp: at(6),
    replies: [],
  };
  const agentAnswer: FeedTeamMessage = {
    id: id(2),
    kind: "agent",
    author: agent.name,
    text: `@${toMentionHandle(asker.name)} ${pick(AGENT_REPLIES, seed >>> 2)}`,
    timestamp: at(11),
    replies: [subagentReport],
  };
  const agentFollowUp: FeedTeamMessage = {
    id: id(5),
    kind: "agent",
    author: agent.name,
    text: `@${toMentionHandle(closer.name)} ${pick(AGENT_FOLLOW_UPS, seed >>> 8)}`,
    timestamp: at(1),
    replies: [],
  };

  return [
    {
      id: id(1),
      kind: "teammate",
      author: asker.name,
      teammate: asker,
      text: pick(TEAMMATE_OPENERS, seed >>> 1),
      timestamp: at(14),
      replies: [agentAnswer],
    },
    {
      id: id(4),
      kind: "teammate",
      author: closer.name,
      teammate: closer,
      text: `@${agent.name} ${pick(TEAMMATE_CLOSERS, seed >>> 6)}`,
      timestamp: at(2),
      replies: [agentFollowUp],
    },
  ];
}

export interface FeedGitActivity {
  subagents: number;
  commits: number;
  pullRequests: number;
  merges: number;
}

/**
 * Simulated counts for the stats row where the backend reports none: subagents
 * 1–4, commits 1–12, pull requests 0–3 and merges up to the pull requests.
 */
export function getFeedGitActivity(conversationId: string): FeedGitActivity {
  const seed = hashId(conversationId);
  const pullRequests = (seed >>> 7) % 4;
  return {
    subagents: 1 + ((seed >>> 3) % 4),
    commits: 1 + ((seed >>> 5) % 12),
    pullRequests,
    merges: pullRequests === 0 ? 0 : (seed >>> 9) % (pullRequests + 1),
  };
}

/** Every message in a reply tree, parents before their replies. */
export function flattenFeedThread(
  thread: FeedTeamMessage[],
): FeedTeamMessage[] {
  return thread.flatMap((message) => [
    message,
    ...flattenFeedThread(message.replies),
  ]);
}

export interface FeedGroupSummary {
  /** Simulated lines added across the group. */
  additions: number;
  /** Simulated lines removed across the group. */
  deletions: number;
  /** Conversations whose agent is running right now. */
  activeAgents: number;
}

/** Simulated diff size of one conversation: 20–1,019 added, 5–304 removed. */
export function getFeedSimulatedDiff(conversationId: string): {
  additions: number;
  deletions: number;
} {
  const seed = hashId(conversationId);
  return {
    additions: 20 + ((seed >>> 2) % 1000),
    deletions: 5 + ((seed >>> 11) % 300),
  };
}

/**
 * Numbers for a left-list row: diff lines (simulated, since the real totals
 * need git requests per conversation) and agents running (real).
 */
export function summarizeFeedGroup(
  conversations: AppConversation[],
): FeedGroupSummary {
  return conversations.reduce<FeedGroupSummary>(
    (total, conversation) => {
      const diff = getFeedSimulatedDiff(conversation.id);
      return {
        additions: total.additions + diff.additions,
        deletions: total.deletions + diff.deletions,
        activeAgents:
          total.activeAgents +
          (conversation.execution_status === ExecutionStatus.RUNNING ? 1 : 0),
      };
    },
    { additions: 0, deletions: 0, activeAgents: 0 },
  );
}
