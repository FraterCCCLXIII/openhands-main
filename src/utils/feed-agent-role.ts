import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import type { FeedDemoAgent } from "./feed-demo-agents";

/**
 * Agent roles from the kosmos-engine orchestration plan (docs/plans/
 * orchestration.md section 4), and its model tiers (section 3).
 */
export type FeedAgentRoleKey =
  | "conductor"
  | "dispatcher"
  | "worker"
  | "verifier"
  | "janitor"
  | "scout";

export type FeedAgentTier = 1 | 2 | 3 | 4;

export interface FeedAgentRole {
  role: FeedAgentRoleKey;
  /** Null for a role that runs no model, such as the dispatcher. */
  tier: FeedAgentTier | null;
  /** Model family the tier maps to; null without a tier. */
  model: string | null;
}

// Tier-to-model map from tools/tasks/caps.json.
const TIER_MODEL: Record<FeedAgentTier, string> = {
  1: "Haiku",
  2: "Sonnet",
  3: "Opus",
  4: "Fable",
};

const MODEL_FAMILY_TIER: ReadonlyArray<[string, FeedAgentTier]> = [
  ["haiku", 1],
  ["sonnet", 2],
  ["opus", 3],
  ["fable", 4],
];

const ROLE_KEYS: readonly FeedAgentRoleKey[] = [
  "conductor",
  "dispatcher",
  "worker",
  "verifier",
  "janitor",
  "scout",
];

// Conversation tag keys that name the role / tier a conversation runs as.
const ROLE_TAG_KEYS = ["role", "agent_role"];
const TIER_TAG_KEYS = ["tier", "agent_tier"];

function readTag(
  tags: Record<string, string> | null | undefined,
  keys: readonly string[],
): string | null {
  if (!tags) return null;
  const found = Object.entries(tags).find(([key]) =>
    keys.includes(key.trim().toLowerCase()),
  );
  return found?.[1]?.trim().toLowerCase() || null;
}

function parseTier(value: string | null): FeedAgentTier | null {
  const match = value?.match(/^t?([1-4])$/);
  return match ? (Number(match[1]) as FeedAgentTier) : null;
}

function tierFromModel(model: string | null | undefined): FeedAgentTier | null {
  const lower = model?.toLowerCase() ?? "";
  return (
    MODEL_FAMILY_TIER.find(([family]) => lower.includes(family))?.[1] ?? null
  );
}

/**
 * The role and tier a conversation's agent runs as. An explicit `role` / `tier`
 * tag wins; otherwise a conversation that manages subagents reads as the
 * conductor, anything else as a worker, and the tier follows the model family.
 */
export function getFeedAgentRole(
  conversation: AppConversation,
  demo?: FeedDemoAgent,
): FeedAgentRole {
  if (demo) {
    return {
      role: demo.role,
      tier: demo.tier,
      model: demo.tier ? TIER_MODEL[demo.tier] : null,
    };
  }
  const tagged = readTag(conversation.tags, ROLE_TAG_KEYS);
  const role =
    ROLE_KEYS.find((key) => key === tagged) ??
    ((conversation.sub_conversation_ids?.length ?? 0) > 0
      ? "conductor"
      : "worker");
  const tier =
    role === "dispatcher"
      ? null
      : (parseTier(readTag(conversation.tags, TIER_TAG_KEYS)) ??
        tierFromModel(conversation.llm_model));
  return { role, tier, model: tier ? TIER_MODEL[tier] : null };
}
