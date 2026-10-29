import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import type { FeedAgentRoleKey, FeedAgentTier } from "./feed-agent-role";
import {
  Bot,
  Brain,
  Code2,
  Compass,
  Hammer,
  Rocket,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/** Query parameter that turns the simulated agent personas on (demo only). */
export const FEED_DEMO_AGENTS_PARAM = "demoAgents";

export interface FeedDemoAgent {
  name: string;
  /** The orchestration role this persona plays, with its model tier. */
  role: FeedAgentRoleKey;
  tier: FeedAgentTier | null;
  Icon: LucideIcon;
  /** Tailwind classes for the avatar's tint and glyph color. */
  className: string;
}

export const FEED_DEMO_AGENTS: readonly FeedDemoAgent[] = [
  {
    name: "Atlas",
    role: "conductor",
    tier: 4,
    Icon: Compass,
    className: "bg-sky-500/20 text-sky-300",
  },
  {
    name: "Nova",
    role: "scout",
    tier: 2,
    Icon: Sparkles,
    className: "bg-violet-500/20 text-violet-300",
  },
  {
    name: "Sentinel",
    role: "verifier",
    tier: 3,
    Icon: ShieldCheck,
    className: "bg-emerald-500/20 text-emerald-300",
  },
  {
    name: "Forge",
    role: "worker",
    tier: 3,
    Icon: Hammer,
    className: "bg-orange-500/20 text-orange-300",
  },
  {
    name: "Pixel",
    role: "worker",
    tier: 2,
    Icon: Code2,
    className: "bg-pink-500/20 text-pink-300",
  },
  {
    name: "Orbit",
    role: "dispatcher",
    tier: null,
    Icon: Rocket,
    className: "bg-amber-500/20 text-amber-300",
  },
  {
    name: "Sage",
    role: "janitor",
    tier: 1,
    Icon: Brain,
    className: "bg-teal-500/20 text-teal-300",
  },
  {
    name: "Botley",
    role: "worker",
    tier: 1,
    Icon: Bot,
    className: "bg-slate-500/20 text-slate-300",
  },
];

/**
 * The persona for a conversation: the agent the factory inbox gave it to, else
 * a stable simulated one so reloads keep it.
 */
export function pickFeedDemoAgent(conversationId: string): FeedDemoAgent {
  const assigned =
    useFeedFactoriesStore.getState().assignments[conversationId]?.agentName;
  const placed = assigned
    ? FEED_DEMO_AGENTS.find((agent) => agent.name === assigned)
    : undefined;
  if (placed) return placed;
  let hash = 0;
  for (let i = 0; i < conversationId.length; i += 1) {
    hash = (hash * 31 + conversationId.charCodeAt(i)) >>> 0;
  }
  return FEED_DEMO_AGENTS[hash % FEED_DEMO_AGENTS.length];
}

export function isFeedDemoAgentsEnabled(search: string): boolean {
  return new URLSearchParams(search).has(FEED_DEMO_AGENTS_PARAM);
}

/** Prefix on an `agentProfileId` filter that names a simulated persona. */
export const FEED_DEMO_AGENT_FILTER_PREFIX = "demo:";

/** A stable tint for a key, from the personas' palette, for icons without one. */
export function pickFeedTint(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FEED_DEMO_AGENTS[hash % FEED_DEMO_AGENTS.length].className;
}
