import { Bot } from "lucide-react";
import type { FeedAgentConfig } from "#/stores/feed-agent-config-store";
import type { FeedDemoAgent } from "./feed-demo-agents";

/** The colours an agent profile can be given; each maps to avatar tint classes. */
export const FEED_AGENT_COLORS = {
  sky: "bg-sky-500/20 text-sky-300",
  violet: "bg-violet-500/20 text-violet-300",
  emerald: "bg-emerald-500/20 text-emerald-300",
  orange: "bg-orange-500/20 text-orange-300",
  pink: "bg-pink-500/20 text-pink-300",
  amber: "bg-amber-500/20 text-amber-300",
  teal: "bg-teal-500/20 text-teal-300",
  slate: "bg-slate-500/20 text-slate-300",
} as const;

export type FeedAgentColor = keyof typeof FEED_AGENT_COLORS;

export const FEED_AGENT_COLOR_KEYS = Object.keys(
  FEED_AGENT_COLORS,
) as FeedAgentColor[];

const COLOR_VALUES = Object.values(FEED_AGENT_COLORS);

/** A stable tint for a key when the profile has no chosen colour. */
export function pickAgentTint(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return COLOR_VALUES[hash % COLOR_VALUES.length];
}

/** The avatar tint for an agent profile: its chosen colour, else a stable one. */
export function agentTint(
  key: string,
  config?: Pick<FeedAgentConfig, "color">,
): string {
  const chosen = config?.color as FeedAgentColor | undefined;
  return chosen && chosen in FEED_AGENT_COLORS
    ? FEED_AGENT_COLORS[chosen]
    : pickAgentTint(key);
}

/** A real agent profile in the shape the factory roster and feed rows use. */
export function toFeedAgent(
  profile: { id?: string | null; name: string },
  config?: FeedAgentConfig,
): FeedDemoAgent {
  return {
    name: profile.name,
    role: config?.role ?? "worker",
    tier: config?.tier ?? null,
    Icon: Bot,
    className: agentTint(profile.id ?? profile.name, config),
    profileId: profile.id ?? undefined,
  };
}
