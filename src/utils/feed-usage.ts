import type { MetricsSnapshot } from "#/api/conversation-service/agent-server-conversation-service.types";

export interface FeedUsage {
  /** Prompt plus completion tokens spent so far. */
  totalTokens: number;
  /** Tokens the latest turn put in context; 0 when the backend omits it. */
  contextTokens: number;
  /** The model's context window; 0 when unknown. */
  contextWindow: number;
  /** Share of the context window in use, 0–100; null without a window. */
  contextPercent: number | null;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** The cost the server reported; null when it reported none. */
  cost: number | null;
  /** Reported per-task budget in dollars; null when none is set. */
  budget: number | null;
  /**
   * Where the cost comes from. Only the server's own figure is ever shown:
   * "reported" for a cost above zero, "unpriced" when tokens were used but no
   * cost was reported, "none" before any usage.
   */
  costSource: "reported" | "unpriced" | "none";
}

/** Token and context-window figures from a metrics snapshot, or null when none. */
export function toFeedUsage(
  metrics: MetricsSnapshot | null | undefined,
): FeedUsage | null {
  const usage = metrics?.accumulated_token_usage;
  if (!usage) return null;
  const contextWindow = usage.context_window ?? 0;
  const contextTokens = usage.per_turn_token ?? 0;
  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  const cost = metrics?.accumulated_cost ?? null;
  const budget =
    (metrics?.max_budget_per_task ?? 0) > 0
      ? (metrics?.max_budget_per_task ?? null)
      : null;
  let costSource: FeedUsage["costSource"] = "none";
  if ((cost ?? 0) > 0) costSource = "reported";
  else if (promptTokens + completionTokens > 0) costSource = "unpriced";
  return {
    totalTokens: promptTokens + completionTokens,
    promptTokens,
    completionTokens,
    cacheReadTokens: usage.cache_read_tokens ?? 0,
    cacheWriteTokens: usage.cache_write_tokens ?? 0,
    cost,
    budget,
    costSource,
    contextTokens,
    contextWindow,
    contextPercent:
      contextWindow > 0
        ? Math.min(100, Math.round((contextTokens / contextWindow) * 100))
        : null,
  };
}

/** 1234 → "1.2K" in the given locale. */
export function formatCompactCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
