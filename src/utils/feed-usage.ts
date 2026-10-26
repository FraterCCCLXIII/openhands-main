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
}

/** Token and context-window figures from a metrics snapshot, or null when none. */
export function toFeedUsage(
  metrics: MetricsSnapshot | null | undefined,
): FeedUsage | null {
  const usage = metrics?.accumulated_token_usage;
  if (!usage) return null;
  const contextWindow = usage.context_window ?? 0;
  const contextTokens = usage.per_turn_token ?? 0;
  return {
    totalTokens: (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
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
